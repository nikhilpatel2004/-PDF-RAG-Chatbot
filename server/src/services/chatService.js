import OpenAI from 'openai';
import { embedQuery } from './embedService.js';
import { queryPinecone, getAllChunks } from '../vector/pineconeClient.js';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY
});

const LANG_PROMPTS = {
  en: 'Answer in English.',
  hi: 'हिंदी में जवाब दें।',
  es: 'Responde en español.',
  fr: 'Répondez en français.',
  de: 'Antworten Sie auf Deutsch.',
  zh: '用中文回答。'
};

export async function answerQuestion({ namespace, question, language = 'en' }) {
  console.log(`[Chat] Processing question for namespace: ${namespace}`);
  
  const queryVector = await embedQuery(question);
  console.log(`[Chat] Got embedding, querying Pinecone...`);
  
  const matches = await queryPinecone({ namespace, embedding: queryVector, topK: 3 });
  console.log(`[Chat] Found ${matches.length} matches`);

  const context = matches
    .map((m, idx) => `Chunk ${idx + 1} (score ${m.score?.toFixed(3)}): ${m.metadata?.text || ''}`)
    .join('\n\n');

  const langInstruction = LANG_PROMPTS[language] || LANG_PROMPTS.en;

  const prompt = `You are a helpful assistant. Use the provided context from the uploaded PDF to answer the user's question.

Context:
${context}

Question: ${question}

${langInstruction}

Format your answer using markdown:
- Use **bold** for important terms
- Use bullet points for lists
- Use code blocks for technical content
- Use headers (##) if needed for organization`;

  const completion = await openrouter.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a retrieval-augmented assistant. Prefer the provided context. Format responses in markdown.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3
  });

  const answer = completion.choices?.[0]?.message?.content || 'No answer generated.';
  return { answer, sources: matches };
}

// Generate document summary
export async function generateDocSummary({ namespace, language = 'en' }) {
  // Get chunks from Pinecone
  const chunks = await getAllChunks({ namespace, topK: 10 });
  
  const context = chunks
    .map((m) => m.metadata?.text || '')
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 8000); // Limit context size

  const langInstruction = LANG_PROMPTS[language] || LANG_PROMPTS.en;

  const prompt = `Based on the following document content, provide a comprehensive summary:

Document Content:
${context}

${langInstruction}

Provide a well-structured summary that includes:
1. **Main Topic**: What is this document about?
2. **Key Points**: List the main ideas (use bullet points)
3. **Important Details**: Any crucial information
4. **Conclusion**: Brief takeaway`;

  const completion = await openrouter.chat.completions.create({
    model: 'openai/gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a document summarization expert. Create clear, structured summaries.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4
  });

  const summary = completion.choices?.[0]?.message?.content || 'Unable to generate summary.';
  return { summary };
}

// Generate quiz from document
export async function generateDocQuiz({ namespace, language = 'en', numQuestions = 5 }) {
  const chunks = await getAllChunks({ namespace, topK: 8 });
  
  const context = chunks
    .map((m) => m.metadata?.text || '')
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 6000);

  const langInstruction = LANG_PROMPTS[language] || LANG_PROMPTS.en;

  const prompt = `Based on the following document content, generate ${numQuestions} multiple-choice questions to test understanding.

Document Content:
${context}

${langInstruction}

IMPORTANT: Return ONLY a valid JSON array with this exact format, no other text:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of correct answer"
  }
]

Generate ${numQuestions} diverse questions covering different parts of the document.`;

  const completion = await openrouter.chat.completions.create({
    model: 'openai/gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a quiz generator. Return ONLY valid JSON arrays, no markdown, no extra text.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5
  });

  let responseText = completion.choices?.[0]?.message?.content || '[]';
  
  // Try to extract JSON array from response
  try {
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Find JSON array in response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    const questions = JSON.parse(responseText);
    return { questions: Array.isArray(questions) ? questions : [] };
  } catch (err) {
    console.error('Quiz parse error:', err.message);
    return { questions: [], error: 'Failed to parse quiz questions' };
  }
}
