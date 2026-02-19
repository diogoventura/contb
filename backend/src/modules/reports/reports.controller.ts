import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/index';
import { reportsService } from './reports.service';

const router = Router();
router.use(authMiddleware);

router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        res.json(await reportsService.getSummary());
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/sales-by-month', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        res.json(await reportsService.getSalesByMonth());
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/insights', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        res.json(await reportsService.getInsights());
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
