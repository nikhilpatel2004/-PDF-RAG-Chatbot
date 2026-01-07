import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function askQuestion({ docId, question, language = 'en' }) {
  const { data } = await api.post('/chat', { docId, question, language });
  return data;
}

export async function generateSummary({ docId, language = 'en' }) {
  const { data } = await api.post('/summary', { docId, language });
  return data;
}

export async function generateQuiz({ docId, language = 'en', numQuestions = 5 }) {
  const { data } = await api.post('/quiz', { docId, language, numQuestions });
  return data;
}
