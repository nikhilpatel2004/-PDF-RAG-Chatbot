import { Router } from 'express';
import { generateDocQuiz } from '../services/chatService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { docId, language = 'en', numQuestions = 5 } = req.body || {};
    if (!docId) {
      return res.status(400).json({ error: 'docId is required' });
    }
    const result = await generateDocQuiz({ namespace: docId, language, numQuestions });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
