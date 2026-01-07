// Using Jina AI free embeddings API
const JINA_API_URL = 'https://api.jina.ai/v1/embeddings';

async function getJinaEmbedding(texts) {
  const response = await fetch(JINA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.JINA_API_KEY || ''}`
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      task: 'retrieval.passage',
      dimensions: 1024,
      late_chunking: false,
      embedding_type: 'float',
      input: Array.isArray(texts) ? texts : [texts]
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jina API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.data.map(item => item.embedding);
}

export async function embedTexts(documents) {
  const texts = documents.map((doc) => doc.pageContent.slice(0, 2000));
  // Process in batches of 20 for faster processing
  const batchSize = 20;
  const allVectors = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const vectors = await getJinaEmbedding(batch);
    allVectors.push(...vectors);
  }
  
  return allVectors;
}

export async function embedQuery(query) {
  const vectors = await getJinaEmbedding([query]);
  return vectors[0];
}
