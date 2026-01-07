import { useState } from 'react';

function FileUpload({ onUpload, loading }) {
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    onUpload(file);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      <label>Upload PDF</label>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <div style={{ marginTop: 10 }}>
        <button type="submit" disabled={!file || loading}>Upload & Index</button>
      </div>
    </form>
  );
}

export default FileUpload;
