# PDF RAG Chatbot (MERN + LangChain.js)

Full-stack Retrieval-Augmented Generation chatbot. Users upload a PDF, it is parsed, chunked, embedded with OpenAI, stored in Pinecone, and queried via GPT-4o through LangChain.js.

## Stack
- Backend: Node.js, Express, Multer, pdf-parse, LangChain.js, OpenAI, Pinecone
- Frontend: React + Vite

## Setup
1) Copy env templates
- server: `cp server/.env.example server/.env`
- client: `cp client/.env.example client/.env`
Fill values (OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX, optional CLIENT_ORIGIN, PORT).

2) Install deps
- `cd server && npm install`
- `cd client && npm install`

3) Run
- Backend: `npm run dev` (from `server`)
- Frontend: `npm run dev` (from `client`, Vite on 5173)

## API
- POST /api/upload (multipart/form-data file="file"): parses PDF, chunks, embeds, upserts to Pinecone; returns { docId, chunks }
- POST /api/chat { docId, question }: embeds query, retrieves top matches from Pinecone, calls GPT-4o, returns { answer, sources }

## Notes
- Retrieval is done via Pinecone vector search; generation via GPT-4o with retrieved context.
- Adjust chunking in `server/src/services/pdfService.js` if PDFs are very large.
