import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export async function parseAndChunkPdf(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text || '';
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
  });
  const docs = await splitter.createDocuments([text]);
  return docs.map((doc, idx) => ({ ...doc, metadata: { ...doc.metadata, page: idx + 1 } }));
}
