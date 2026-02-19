import { Router, Response } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../../middleware/index';
import { settingsService } from './settings.service';
import { schedulerService } from '../scheduler/scheduler.service';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        res.json(await settingsService.getAll());
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { key, value } = req.body;
        const result = await settingsService.set(key, String(value));

        // If overdue settings changed, reschedule
        if (key.startsWith('overdue_notif_')) {
            await schedulerService.rescheduleOverdueJob();
        }

        res.json(result);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
