import { Router, Response } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../../middleware/index';
import { usersService } from './users.service';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(String(req.query.page)) || 1;
        const limit = parseInt(String(req.query.limit)) || 20;
        res.json(await usersService.getAll(page, limit));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const user = await usersService.getById(id);
        if (!user) { res.status(404).json({ error: 'Not found' }); return; }
        res.json(user);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        res.status(201).json(await usersService.create(req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        res.json(await usersService.update(id, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        await usersService.delete(id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
