import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/index';
import prisma from '../../config/database';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
    try { res.json(await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/unread-count', async (_req: AuthRequest, res: Response): Promise<void> => {
    try { res.json({ count: await prisma.notification.count({ where: { isRead: false } }) }); }
    catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        await prisma.notification.update({ where: { id }, data: { isRead: true } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/mark-all-read', async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
