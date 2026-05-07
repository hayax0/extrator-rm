import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import ExcelJS from 'exceljs'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import os from 'os'

// --- CONFIGURAÇÕES PARA A VERCEL ---
// Define o tempo máximo de execução para 60 segundos (limite do plano Hobby)
export const maxDuration = 60

// No App Router, para aumentar o limite de upload, usamos esta config:
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
// -----------------------------------

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  let tempFilePath: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File

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
    let maxWait = 24
    while (fileState.state === 'PROCESSING' && maxWait > 0) {
      await delay(5000)
      fileState = await ai.files.get({ name: uploadResult.name! })
      maxWait--
    }

    if (fileState.state === 'FAILED' || maxWait === 0) {
      throw new Error("O Google falhou ao ler a imagem ou o tempo esgotou.")
    }

    const prompt = `
      O arquivo anexo é uma imagem digitalizada de uma folha de pagamento.
      Sua ÚNICA TAREFA: Extrair os números da coluna "Chapa".
      
      REGRAS OBRIGATÓRIAS:
      1. Remova os zeros à esquerda (Ex: 00000110 vira 110).
      2. Retorne TODOS os números em uma ÚNICA LINHA de texto, separados APENAS por vírgula.
      3. É PROIBIDO usar quebras de linha (Enter).
      4. Vá do primeiro ao último funcionário sem pular NENHUM.
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    const chapasExtraidas = textoBruto
      .split(',')
      .map(chapa => parseInt(chapa.trim().replace(/[^0-9]/g, ''), 10))
      .filter(chapa => !isNaN(chapa))

    if (chapasExtraidas.length === 0) {
      throw new Error("Nenhuma matrícula foi encontrada no documento.")
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Matrículas')
    worksheet.addRow(['Matrícula'])
    chapasExtraidas.forEach(chapa => worksheet.addRow([chapa]))

    const excelBuffer = await workbook.xlsx.writeBuffer()

    if (tempFilePath) {
      unlinkSync(tempFilePath)
    }

    return new NextResponse(excelBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Resultado_Cheque.xlsx"`,
      },
    })

  } catch (error: any) {
    if (tempFilePath) {
      try { unlinkSync(tempFilePath) } catch (e) { }
    }
    // Se o erro for de Payload Too Large, customizamos a mensagem
    if (error.message.includes('413')) {
      return NextResponse.json({ error: "O PDF é muito grande para os limites da Vercel (Max 10MB)." }, { status: 413 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
