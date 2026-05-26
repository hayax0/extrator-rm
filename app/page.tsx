'use client'

import { useState, useCallback, useMemo } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [tipoRelatorio, setTipoRelatorio] = useState('LÍQUIDO SALARIAL')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Verifica se o arquivo é considerado grande (Maior que 2MB)
  const isLargeFile = useMemo(() => {
    if (!file) return false
    return file.size > 2 * 1024 * 1024 // 2MB em bytes
  }, [file])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setMensagem('')
    }
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
        setMensagem('')
      } else {
        setMensagem('❌ Erro: Por favor, envie apenas arquivos no formato PDF.')
      }
    }
  }, [])

  const handleProcessar = async () => {
    if (!file) {
      setMensagem('⚠️ Selecione um arquivo PDF.')
      return
    }

    setLoading(true)
    setMensagem('⏳ O Gemini 2.5 Pro está analisando as páginas do documento...')

    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('tipoRelatorio', tipoRelatorio)

    try {
      const response = await fetch('/api/extrair', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro no processamento.')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Extração_${file.name.replace('.pdf', '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()

      setMensagem('✅ Planilha gerada com sucesso!')
      setFile(null)
    } catch (error: any) {
      setMensagem(`❌ Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-radial-[at_top] from-slate-900 via-gray-950 to-black p-4 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <div className="relative w-full max-w-xl my-8">
        
        {/* Efeitos de Iluminação de Fundo */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-4000"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-4000"></div>

        {/* Card Principal Container */}
        <div className="relative bg-zinc-900/30 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-3xl overflow-hidden">
          
          {/* Linha de Carregamento Superior Infinita */}
          {loading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 overflow-hidden">
              <div className="h-full bg-linear-to-r from-blue-500 via-indigo-400 to-blue-600 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
          )}

          <header className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold mb-4 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
              RM Labore Automations
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-linear-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent mb-2">
              Extrator de PDFs
            </h1>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
              Converta relatórios de pagamento digitalizados em planilhas Excel estruturadas instantaneamente.
            </p>
          </header>

          <section className="space-y-6">
            
            {/* INPUT DINÂMICO DO FILTRO */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Nome do Relatório Alvo
              </label>
              <input
                type="text"
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value)}
                disabled={loading}
                placeholder="Ex: LÍQUIDO SALARIAL"
                className="w-full bg-zinc-950/50 border border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm font-semibold text-white outline-hidden transition-all placeholder:text-zinc-600 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              />
            </div>

            {/* DRAG AND DROP ZONE */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' 
                  : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/20'
              }`}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={loading}
              />

              <div className="flex flex-col items-center p-4 pointer-events-none text-center">
                <div className={`p-3.5 rounded-xl mb-3 transition-all duration-300 ${
                  file 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-zinc-900 text-zinc-400 border border-white/5 group-hover:scale-110'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-zinc-200 px-4 max-w-xs truncate">
                  {file ? file.name : 'Arraste seu documento PDF aqui'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'ou clique para explorar os arquivos'}
                </p>
              </div>
            </div>

            {/* AVISO INTELIGENTE DE ARQUIVO LONGO */}
            {isLargeFile && !loading && (
              <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-400 animate-in fade-in duration-300">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider">Documento de grande porte detectado</h4>
                  <p className="text-xs text-amber-400/80 font-medium leading-relaxed">
                    Este PDF contém muitas páginas. O Gemini 2.5 Pro irá processar os dados de forma minuciosa em lote. Isso pode levar de 1 a 3 minutos. Por favor, mantenha a janela aberta.
                  </p>
                </div>
              </div>
            )}

            {/* BOTÃO DE AÇÃO */}
            <button
              onClick={handleProcessar}
              disabled={loading || !file}
              className={`relative w-full overflow-hidden py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-md ${
                loading || !file
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30 hover:shadow-xl active:scale-[0.99] cursor-pointer'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processando Dados...
                  </>
                ) : 'Iniciar Extração Baseada em IA'}
              </span>
            </button>

            {/* NOTIFICAÇÕES DE FEEDBACK */}
            {mensagem && (
              <div className={`animate-in fade-in slide-in-from-top-2 duration-300 p-4 rounded-xl text-xs font-semibold text-center border ${
                mensagem.includes('❌')
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : mensagem.includes('⏳')
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {mensagem}
              </div>
            )}
          </section>

          {/* GUIA DE USO PARA A TELA NÃO FICAR VAZIA */}
          <section className="mt-8 pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Como usar o painel</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-zinc-500 font-medium">
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold mt-0.5">1</span>
                Verifique ou altere o nome do relatório no topo conforme impresso no PDF.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold mt-0.5">2</span>
                Insira o arquivo PDF consolidado com as listagens digitalizadas.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold mt-0.5">3</span>
                A IA ignorará páginas e rodapés antigos de forma autônoma.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold mt-0.5">4</span>
                O download da planilha formatada em XLSX começará sozinho.
              </li>
            </ul>
          </section>

          <footer className="mt-8 pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
              Powered by Gemini 2.5 Pro Engine
            </p>
          </footer>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  )
}
