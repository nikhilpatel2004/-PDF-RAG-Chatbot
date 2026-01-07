import { useState } from 'react';

function QuizModal({ quiz, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (qIndex, optionIndex) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    let correct = 0;
    quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        correct++;
      }
    });
    setScore(correct);
    setSubmitted(true);
  };

  const getOptionClass = (qIndex, optIndex) => {
    let cls = 'quiz-option';
    if (answers[qIndex] === optIndex) cls += ' selected';
    if (submitted) {
      if (optIndex === quiz[qIndex].correctIndex) cls += ' correct';
      else if (answers[qIndex] === optIndex) cls += ' wrong';
    }
    return cls;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>📝 Quiz Time!</h2>
          <button className="secondary" onClick={onClose}>✕</button>
        </div>
        
        {quiz.map((q, qIndex) => (
          <div key={qIndex} className="quiz-question">
            <h4>Q{qIndex + 1}. {q.question}</h4>
            {q.options.map((opt, optIndex) => (
              <div
                key={optIndex}
                className={getOptionClass(qIndex, optIndex)}
                onClick={() => handleSelect(qIndex, optIndex)}
              >
                {String.fromCharCode(65 + optIndex)}. {opt}
              </div>
            ))}
            {submitted && answers[qIndex] !== q.correctIndex && (
              <div style={{ color: '#86efac', marginTop: 8, fontSize: 14 }}>
                ✓ Correct: {String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]}
              </div>
            )}
          </div>
        ))}

        {!submitted ? (
          <button 
            onClick={handleSubmit} 
            disabled={Object.keys(answers).length < quiz.length}
            style={{ width: '100%', marginTop: 16 }}
          >
            Submit Quiz
          </button>
        ) : (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <h3 style={{ color: score >= quiz.length / 2 ? '#22c55e' : '#ef4444' }}>
              Score: {score}/{quiz.length} ({Math.round(score / quiz.length * 100)}%)
            </h3>
            <button onClick={onClose} style={{ marginTop: 12 }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizModal;
