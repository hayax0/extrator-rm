# Extrator Pro - RM Labore

O Extrator Pro é uma aplicação Full Stack desenvolvida para automatizar o processo de extração de matrículas (chapas) a partir de documentos de folha de pagamento em formato PDF gerados pelo sistema RM Labore. 

Utilizando Inteligência Artificial Generativa para visão computacional (OCR) e uma arquitetura robusta sem limites de timeout, a ferramenta transforma um processo manual de quase uma hora em uma operação de apenas alguns segundos com zero risco de erro humano.

---

## Tecnologias Utilizadas

* Framework: Next.js 15+ (App Router) com TypeScript
* Estilização: Tailwind CSS (Interface Moderna com Glassmorphism)
* Inteligência Artificial: Gemini 2.5 Flash via @google/genai (File API para upload de mídias pesadas)
* Manipulação de Planilhas: ExcelJS (Geração nativa de arquivos .xlsx)
* Hospedagem / Infraestrutura: Render (Web Service Node.js para processamento assíncrono de longa duração)

---

## Principais Funcionalidades

* Interface Inteligente com Drag and Drop: Arraste o arquivo PDF ou clique para navegar com feedback visual instantâneo.
* Leitura Avançada via IA: Processamento de PDFs digitalizados ou nativos com tratamento de milhares de registros em lote.
* Sanitização de Dados: Remoção automática de zeros à esquerda das chapas e filtragem de caracteres inválidos.
* Download Instantâneo: Geração em tempo real de planilha Excel estruturada e pronta para operações como PROCV / VLOOKUP.
* Sem Limites de Conexão: Hospedagem otimizada para requisições de processamento longo (ignora os limites estritos de 10s de plataformas Serverless tradicionais).

---

## Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js instalado (versão 18 ou superior)
* Uma chave de API do Google Gemini (GEMINI_API_KEY)

### Passo a Passo

1. Clone o repositório:
   git clone https://github.com/SEU_USUARIO/extrartor-rm.git
   cd extrartor-rm

2. Instale as dependências:
   npm install

3. Configure as Variáveis de Ambiente:
   Crie um arquivo .env.local na raiz do projeto e adicione sua chave de API:
   GEMINI_API_KEY=sua_chave_do_gemini_aqui

4. Inicie o servidor de desenvolvimento:
   npm run dev
   
Abra http://localhost:3000 no seu navegador para ver o sistema rodando.

---

## Variáveis de ambiente necessárias no deploy (Render):
* GEMINI_API_KEY: Chave de autenticação do Google AI Studio.

---

## Regras de Negócio do Prompt de IA

O modelo gemini-2.5-flash é instruído sob regras rígidas para garantir a integridade dos dados:
1. Extração focada exclusivamente na coluna Chapa.
2. Limpeza de formatação e remoção de zeros à esquerda (Ex: 00000110 vira 110).
3. Retorno estrito estruturado por delimitadores, evitando quebras de linha que possam corromper o buffer do gerador Excel.

---

Desenvolvido por Caio Campos
