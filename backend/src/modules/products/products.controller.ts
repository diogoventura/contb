import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/index';
import { productsService } from './products.service';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(String(req.query.page)) || 1;
        const limit = parseInt(String(req.query.limit)) || 20;
        const search = req.query.search as string | undefined;
        res.json(await productsService.getAll(page, limit, search));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const product = await productsService.getById(id);
        if (!product) { res.status(404).json({ error: 'Not found' }); return; }
        res.json(product);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        res.status(201).json(await productsService.create(req.user.userId, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/bulk', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const { items } = req.body;
        if (!items || !Array.isArray(items)) { res.status(400).json({ error: 'Formato inválido. Esperado array de itens.' }); return; }
        res.status(201).json(await productsService.bulkCreate(req.user.userId, items));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        res.json(await productsService.update(id, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        await productsService.delete(id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
