'use client'

import { useState, useCallback } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [isDragging, setIsDragging] = useState(false)

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
      setFile(e.dataTransfer.files[0])
      setMensagem('')
    }
  }, [])

  const handleProcessar = async () => {
    if (!file) {
      setMensagem('⚠️ Selecione um arquivo PDF.')
      return
    }

    setLoading(true)
    setMensagem('⏳ Analisando documento com IA...')

    const formData = new FormData()
    formData.append('pdf', file)

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
    <main className="flex items-center justify-center min-h-screen bg-radial-[at_top] from-gray-900 via-black to-black p-4">
      <div className="relative w-full max-w-lg">
        {/* Efeito de brilho ao fundo */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative bg-gray-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden">
          {/* Barra de Progresso Animada (Só aparece no loading) */}
          {loading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
              <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
          )}

          <header className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-b from-white to-gray-500 bg-clip-text text-transparent mb-3">
              Extrator Pdf
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Transforme cheques RM Labore em planilhas Excel em segundos.
            </p>
          </header>

          <section className="space-y-6">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative group flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-gray-700 hover:border-gray-500 bg-gray-800/30'
                }`}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="application/pdf"
                onChange={handleFileChange}
              />

              <div className="flex flex-col items-center pointer-events-none">
                <div className={`p-4 rounded-full mb-4 transition-colors ${file ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'}`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-300">
                  {file ? file.name : 'Solte o PDF aqui'}
                </p>
                <p className="text-xs text-gray-500 mt-1">ou clique para navegar</p>
              </div>
            </div>

            <button
              onClick={handleProcessar}
              disabled={loading || !file}
              className={`relative w-full overflow-hidden group py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 ${loading || !file
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-[0.98]'
                }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processando...
                  </>
                ) : 'Iniciar Extração'}
              </span>
            </button>

            {mensagem && (
              <div className={`animate-in fade-in slide-in-from-top-2 duration-300 p-4 rounded-xl text-xs font-bold text-center border ${mensagem.includes('❌')
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                {mensagem}
              </div>
            )}
          </section>

          <footer className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
              Powered by Gemini 2.5 Flash
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
