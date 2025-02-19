import { Request, Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import Game from '../models/game';

const router = Router();

router.get(
  '/history',
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const gameHistory = await Game.getGameHistory(userId);

    res.status(200).json({ gameHistory });
  }
);

router.get('/today', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const todayGames = await Game.getTodayGames(userId);

  res.status(200).json({ todayGames });
});

router.post('/play', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { completedLevels, gameType } = req.body;

  const result = await Game.play(userId, completedLevels, gameType);

  res.status(200).json({ result });
});

export default router;
