import { Router } from 'express';
import { generateDocSummary } from '../services/chatService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { docId, language = 'en' } = req.body || {};
    if (!docId) {
      return res.status(400).json({ error: 'docId is required' });
    }
    const result = await generateDocSummary({ namespace: docId, language });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
