import { Router } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { parseAndChunkPdf } from '../services/pdfService.js';
import { embedTexts } from '../services/embedService.js';
import { upsertDocuments } from '../vector/pineconeClient.js';
import { logger } from '../utils/logger.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const docId = uuid();
    logger.info(`Starting PDF processing for doc ${docId}`);
    
    const documents = await parseAndChunkPdf(req.file.buffer);
    logger.info(`Parsed ${documents.length} chunks`);
    
    const vectors = await embedTexts(documents);
    logger.info(`Generated ${vectors.length} embeddings`);
    
    const { count } = await upsertDocuments({ docId, documents, vectors });
    logger.info(`Stored ${count} chunks for doc ${docId}`);
    
    res.json({ docId, chunks: count });
  } catch (err) {
    logger.error(`Upload error: ${err.message}`);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

export default router;
