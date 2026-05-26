import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import ExcelJS from 'exceljs'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import os from 'os'

// --- CONFIGURAÇÕES PARA A VERCEL ---
export const maxDuration = 300 
// -----------------------------------

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  let tempFilePath: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    // Captura o termo do relatório vindo da tela. Fallback para 'LÍQUIDO SALARIAL' caso venha nulo.
    const tipoRelatorio = (formData.get('tipoRelatorio') as string) || "LÍQUIDO SALARIAL"

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    tempFilePath = join(os.tmpdir(), `upload_${Date.now()}.pdf`)
    writeFileSync(tempFilePath, buffer)

    const uploadResult = await ai.files.upload({
      file: tempFilePath,
      config: {
        mimeType: 'application/pdf',
      }
    })

    let fileState = await ai.files.get({ name: uploadResult.name! })
    let maxWait = 60 
    while (fileState.state === 'PROCESSING' && maxWait > 0) {
      await delay(5000)
      fileState = await ai.files.get({ name: uploadResult.name! })
      maxWait--
    }

    if (fileState.state === 'FAILED' || maxWait === 0) {
      throw new Error("O Google falhou ao ler o arquivo ou o tempo esgotou.")
    }

    // --- PROMPT ADAPTÁVEL BASEADO NO INPUT DO USUÁRIO ---
    const prompt = `
      O arquivo anexo é uma listagem contendo MÚLTIPLAS PÁGINAS de documentos de RH.
      Atenção: Por erro de geração humana ou do sistema, este PDF pode conter páginas misturadas de relatórios antigos ou seções totalmente diferentes.
      
      SUA TAREFA IMPRESCINDÍVEL:
      Analise minuciosamente o cabeçalho de CADA PÁGINA antes de extrair qualquer dado.
      Você APENAS deve extrair os registros das páginas cujo cabeçalho indique explicitamente o título de relatório "${tipoRelatorio.toUpperCase()}".
      Se a página pertencer a QUALQUER OUTRO relatório (como relatórios de outros meses ou outras listas de funcionários), VOCÊ DEVE IGNORAR a página inteira e não extrair absolutamente nada dela.
      
      Para as páginas VÁLIDAS que batem com o termo "${tipoRelatorio.toUpperCase()}", extraia a "Chapa" e o "Líquido" (valor financeiro posicionado no final de cada linha) de TODOS os funcionários.
      
      REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
      1. Remova apenas os zeros à esquerda da Chapa (Ex: 00000270 vira 270. Mas atenção: chapas funcionais como 90000192 devem virar 90000192, nunca altere o prefixo 90000).
      2. Mantenha o valor líquido idêntico ao formato original (Ex: 1.882,50 ou 4.394,40).
      3. NÃO extraia valores acumulados de totais, resumos de páginas, CNPJs ou números soltos de rodapé.
      4. Retorne APENAS as linhas dos funcionários filtrados no formato estrito: CHAPA;VALOR
      
      Exemplo de saída esperado:
      270;1.882,50
      90000192;640,00
      
      Não adicione saudações, introduções, cabeçalhos ou blocos de código markdown (como \`\`\`json ou \`\`\`csv). Apenas a listagem pura de CHAPA;VALOR do início ao fim.
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', 
      contents: [
        {
          role: "user",
          parts: [
            { fileData: { fileUri: uploadResult.uri!, mimeType: 'application/pdf' } },
            { text: prompt }
          ]
        }
      ]
    })

    const textoBruto = response.text || ''
    
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Pagamentos')
    worksheet.addRow(['Matrícula', 'Valor Líquido'])

    const linhas = textoBruto.split('\n')
    let totalProcessado = 0

    linhas.forEach(linha => {
      if (linha.includes(';')) {
        const partes = linha.split(';')
        if (partes.length >= 2) {
          const chapaRaw = partes[0].trim().replace(/[^0-9]/g, '') 
          const valorRaw = partes[1].trim()
          
          if (chapaRaw && valorRaw) {
            // Garante o recebimento de matrículas estendidas sem quebras de índice
            if (chapaRaw.length > 0 && chapaRaw.length < 10) {
              const chapaNum = parseInt(chapaRaw, 10)
              
              // Sanitização completa do valor brasileiro para ponto flutuante computacional
              const valorLimpo = valorRaw.replace(/\./g, '').replace(',', '.')
              const valorNum = parseFloat(valorLimpo)

              if (!isNaN(valorNum)) {
                const row = worksheet.addRow([chapaNum, valorNum])
                
                // Grava o número como primitivo Real e define a máscara contábil nativa do Excel
                row.getCell(2).numFmt = '#,##0.00'
                totalProcessado++
              }
            }
          }
        }
      }
    })

    console.log(`📊 Sucesso! Total de ${totalProcessado} linhas filtradas inseridas no Excel.`);

    if (totalProcessado === 0) {
      console.log("Conteúdo bruto recebido para análise:", textoBruto)
      throw new Error("A IA não localizou nenhuma linha válida para o relatório solicitado.")
    }

    worksheet.getColumn(1).width = 15
    worksheet.getColumn(2).width = 20

    const excelBuffer = await workbook.xlsx.writeBuffer()

    if (tempFilePath) {
      unlinkSync(tempFilePath)
    }

    return new NextResponse(excelBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Extração_${tipoRelatorio.replace(/\s+/g, '_')}.xlsx"`,
      },
    })

  } catch (error: any) {
    if (tempFilePath) {
      try { unlinkSync(tempFilePath) } catch (e) { }
    }
    console.error("🚨 ERRO FATAL NA ROTA /api/extrair:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor." }, { status: 500 })
  }
}
