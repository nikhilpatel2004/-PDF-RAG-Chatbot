import { useState, useRef, useEffect } from 'react';

// Simple markdown-like formatting
function formatMessage(text) {
  if (!text) return '';
  
  let formatted = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  
  // Wrap lists
  formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
  
  return `<p>${formatted}</p>`;
}

function ChatWindow({ messages, onSend, loading, language }) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Set language based on selection
      const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'zh': 'zh-CN'
      };
      recognitionRef.current.lang = langMap[language] || 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p>Upload a PDF and start asking questions!</p>
            <p style={{ fontSize: '14px' }}>You can also use voice input 🎤</p>
          </div>
        )}
        
        {messages.map((m, idx) => (
          <div key={idx} className={`message ${m.role}`}>
            {m.role === 'bot' ? (
              <div dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
            ) : (
              m.content
            )}
            {m.role === 'bot' && m.sources && m.sources.length > 0 && (
              <div className="source">
                📚 Sources: {m.sources.slice(0, 3).map((s, i) => (
                  <span key={i}>#{i + 1} ({(s.score * 100).toFixed(0)}%)</span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="message bot">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-area">
        <button 
          type="button" 
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>
        <input
          type="text"
          placeholder="Ask about your PDF... (or use voice 🎤)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send ➤
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
