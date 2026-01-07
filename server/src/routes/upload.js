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
    const documents = await parseAndChunkPdf(req.file.buffer);
    const vectors = await embedTexts(documents);
    const { count } = await upsertDocuments({ docId, documents, vectors });
    logger.info(`Stored ${count} chunks for doc ${docId}`);
    res.json({ docId, chunks: count });
  } catch (err) {
    next(err);
  }
});

export default router;
