import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuid } from 'uuid';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = process.env.PINECONE_INDEX || 'pdf-rag-index';

// Ensure index exists before operations
async function ensureIndexExists() {
  try {
    const indexes = await pinecone.listIndexes();
    const indexNames = indexes.indexes?.map(i => i.name) || [];
    
    if (!indexNames.includes(indexName)) {
      console.log(`Creating Pinecone index: ${indexName}`);
      await pinecone.createIndex({
        name: indexName,
        dimension: 1024,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  } catch (err) {
    console.error('Error ensuring index exists:', err.message);
  }
}

export async function upsertDocuments({ docId, documents, vectors }) {
  await ensureIndexExists();
  const index = pinecone.Index(indexName).namespace(docId);
  const items = documents.map((doc, i) => ({
    id: uuid(),
    values: vectors[i],
    metadata: {
      text: doc.pageContent,
      page: doc.metadata?.page || 0
    }
  }));
  await index.upsert(items);
  return { namespace: docId, count: items.length };
}

export async function queryPinecone({ namespace, embedding, topK = 5 }) {
  const index = pinecone.Index(indexName).namespace(namespace);
  const result = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true
  });
  return result.matches || [];
}

// Get all chunks from a namespace (for summary/quiz generation)
export async function getAllChunks({ namespace, topK = 20 }) {
  const index = pinecone.Index(indexName).namespace(namespace);
  
  // Create a random vector to query (we just want documents)
  const randomVector = Array(1024).fill(0).map(() => Math.random() * 2 - 1);
  
  const result = await index.query({
    vector: randomVector,
    topK,
    includeMetadata: true
  });
  
  return result.matches || [];
}
