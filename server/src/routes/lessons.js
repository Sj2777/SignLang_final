import { Router } from 'express';
import { lessons } from '../data/lessons.js';

const router = Router();

router.get('/', (req, res) => res.json({ lessons }));

router.get('/:slug', (req, res) => {
  const lesson = lessons.find((item) => item.slug === req.params.slug);
  if (!lesson) return res.status(404).json({ message: 'That lesson could not be found.' });
  return res.json({ lesson });
});

export default router;
