import { Router, Request, Response } from 'express';
import { authService } from './auth.service';
import { authMiddleware, AuthRequest } from '../../middleware/index';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (e) { res.status(401).json({ error: (e as Error).message }); }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const profile = await authService.getProfile(req.user.userId);
        res.json(profile);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/logout', (req: Request, res: Response) => {
    res.json({ success: true });
});

export default router;
