import { useState, useRef } from 'react';
import FileUpload from './components/FileUpload.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import QuizModal from './components/QuizModal.jsx';
import { uploadPdf, askQuestion, generateSummary, generateQuiz } from './services/api.js';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
];

function App() {
  // Multi-PDF support
  const [documents, setDocuments] = useState([]); // [{docId, name, chunks}]
  const [activeDocId, setActiveDocId] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: '', type: '' });
  
  // New features
  const [language, setLanguage] = useState('en');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [showExport, setShowExport] = useState(false);

  // Handle multiple PDF uploads
  const handleUpload = async (file) => {
    setStatus({ text: 'Uploading and indexing...', type: '' });
    setLoading(true);
    try {
      const resp = await uploadPdf(file);
      const newDoc = { docId: resp.docId, name: file.name, chunks: resp.chunks };
      setDocuments(prev => [...prev, newDoc]);
      setActiveDocId(resp.docId);
      setStatus({ text: `✓ ${file.name} uploaded (${resp.chunks} chunks)`, type: 'success' });
    } catch (err) {
      setStatus({ text: err.message || 'Upload failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Remove a document
  const removeDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.docId !== docId));
    if (activeDocId === docId) {
      setActiveDocId(documents.length > 1 ? documents[0].docId : '');
    }
  };

  // Ask question with language support
  const handleAsk = async (question) => {
    if (!activeDocId) {
      setStatus({ text: 'Please upload a PDF first', type: 'error' });
      return;
    }
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    try {
      const resp = await askQuestion({ docId: activeDocId, question, language });
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: resp.answer, 
        sources: resp.sources || [] 
      }]);
      setStatus({ text: '', type: '' });
    } catch (err) {
      setStatus({ text: err.message || 'Chat failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Generate summary
  const handleSummary = async () => {
    if (!activeDocId) {
      setStatus({ text: 'Please upload a PDF first', type: 'error' });
      return;
    }
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: '📝 Generate Summary' }]);
    try {
      const resp = await generateSummary({ docId: activeDocId, language });
      setMessages(prev => [...prev, { role: 'bot', content: resp.summary }]);
    } catch (err) {
      setStatus({ text: err.message || 'Summary failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Generate quiz
  const handleQuiz = async () => {
    if (!activeDocId) {
      setStatus({ text: 'Please upload a PDF first', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const resp = await generateQuiz({ docId: activeDocId, language });
      setQuizData(resp.quiz);
      setShowQuiz(true);
    } catch (err) {
      setStatus({ text: err.message || 'Quiz generation failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Export chat
  const exportChat = (format) => {
    const chatContent = messages.map(m => 
      `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`
    ).join('\n\n---\n\n');
    
    if (format === 'txt') {
      downloadFile(chatContent, 'chat-export.txt', 'text/plain');
    } else if (format === 'md') {
      const mdContent = messages.map(m => 
        `### ${m.role === 'user' ? '👤 You' : '🤖 AI'}\n\n${m.content}`
      ).join('\n\n---\n\n');
      downloadFile(mdContent, 'chat-export.md', 'text/markdown');
    } else if (format === 'json') {
      downloadFile(JSON.stringify(messages, null, 2), 'chat-export.json', 'application/json');
    }
    setShowExport(false);
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <div className="card">
        <h1>🚀 PDF RAG Chatbot</h1>
        <p>Upload PDFs, get AI answers with retrieval, generate summaries & quizzes!</p>
        
        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <label style={{ margin: 0 }}>Language:</label>
          <select 
            className="language-select" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <FileUpload onUpload={handleUpload} loading={loading} />
        
        {/* Uploaded PDFs List */}
        {documents.length > 0 && (
          <div className="pdf-list">
            {documents.map(doc => (
              <div 
                key={doc.docId} 
                className="pdf-chip"
                style={{ 
                  background: doc.docId === activeDocId ? '#22d3ee' : '#374151',
                  color: doc.docId === activeDocId ? '#0f172a' : '#e2e8f0',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveDocId(doc.docId)}
              >
                📄 {doc.name} ({doc.chunks})
                <span className="remove" onClick={(e) => { e.stopPropagation(); removeDocument(doc.docId); }}>×</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="header-actions">
          <button onClick={handleSummary} disabled={!activeDocId || loading}>
            📝 Summary
          </button>
          <button onClick={handleQuiz} disabled={!activeDocId || loading}>
            ❓ Quiz
          </button>
          <div className="export-menu">
            <button 
              className="secondary" 
              onClick={() => setShowExport(!showExport)}
              disabled={messages.length === 0}
            >
              📤 Export
            </button>
            {showExport && (
              <div className="export-dropdown">
                <button onClick={() => exportChat('txt')}>📄 Text (.txt)</button>
                <button onClick={() => exportChat('md')}>📝 Markdown (.md)</button>
                <button onClick={() => exportChat('json')}>💾 JSON (.json)</button>
              </div>
            )}
          </div>
          <button 
            className="secondary" 
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
          >
            🗑️ Clear Chat
          </button>
        </div>

        {/* Chat Window with Voice Input */}
        <ChatWindow 
          messages={messages} 
          onSend={handleAsk} 
          loading={loading}
          language={language}
        />
        
        {/* Status */}
        {status.text && (
          <div className={`status ${status.type}`}>{status.text}</div>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuiz && quizData && (
        <QuizModal 
          quiz={quizData} 
          onClose={() => setShowQuiz(false)} 
        />
      )}
    </main>
  );
}

export default App;
