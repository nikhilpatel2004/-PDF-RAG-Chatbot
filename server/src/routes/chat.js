import { Router } from 'express';
import { answerQuestion } from '../services/chatService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { docId, question, language = 'en' } = req.body || {};
    if (!docId || !question) {
      return res.status(400).json({ error: 'docId and question are required' });
    }
    const result = await answerQuestion({ namespace: docId, question, language });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
