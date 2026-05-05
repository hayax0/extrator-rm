'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setMensagem('')
    }
  }

  const handleProcessar = async () => {
    if (!file) {
      setMensagem('⚠️ Por favor, selecione um PDF primeiro.')
      return
    }

    setLoading(true)
    setMensagem('⏳ Enviando arquivo e processando OCR... (Pode levar até 2 min)')

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const response = await fetch('/api/extrair', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro desconhecido no servidor.')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `Matriculas_${file.name.replace('.pdf', '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setMensagem('✅ Sucesso! O Excel foi baixado. Pode colar na planilha oficial.')
      setFile(null)

    } catch (error: any) {
      setMensagem(`❌ Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-xl w-full bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">

        <h1 className="text-3xl font-bold text-center mb-2 bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Extrator RM Labore
        </h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Faça o upload do cheque em PDF para gerar a planilha de matrículas.
        </p>

        <div className="flex flex-col items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-800 border-gray-600 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold text-blue-400">Clique para selecionar</span> ou arraste o PDF
              </p>
              {file && <p className="text-xs text-green-400 font-bold mt-2">📄 {file.name}</p>}
            </div>
            <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
          </label>
        </div>

        <button
          onClick={handleProcessar}
          disabled={loading || !file}
          className={`w-full mt-6 py-3 font-bold rounded-lg transition-all ${loading || !file
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30'
            }`}
        >
          {loading ? 'Processando com IA...' : 'Extrair Matrículas'}
        </button>

        {mensagem && (
          <div className={`mt-4 p-3 rounded text-sm text-center font-medium ${mensagem.includes('❌') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
            {mensagem}
          </div>
        )}
      </div>
    </main>
  )
}
