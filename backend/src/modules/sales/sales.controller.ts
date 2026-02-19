import { Router, Response, Request } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/index';
import { salesService } from './sales.service';

const router = Router();

router.get('/boleto-view/:installmentId', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.installmentId as string);
        const html = await salesService.renderBoletoHTML(id);
        res.header('Content-Type', 'text/html');
        res.send(html);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(String(req.query.page)) || 1;
        const limit = parseInt(String(req.query.limit)) || 20;
        const status = req.query.status as string | undefined;
        res.json(await salesService.getAll(page, limit, status));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const sale = await salesService.getById(id);
        if (!sale) { res.status(404).json({ error: 'Not found' }); return; }
        res.json(sale);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        res.status(201).json(await salesService.create(req.user.userId, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        res.json(await salesService.update(id, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        await salesService.delete(id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/history', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, email } = req.query;
        res.json(await salesService.getByPerson(phone as string, email as string));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/installments/:installmentId/pay', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.installmentId as string);
        res.json(await salesService.payInstallment(id));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/installments/:installmentId/boleto', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.installmentId as string);
        res.json(await salesService.generateBoleto(id));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/installments/:installmentId/send-whatsapp', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.installmentId as string);
        const success = await salesService.sendBoletoWhatsApp(id);
        res.json({ success });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/installments/bulk-notify', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { installmentIds } = req.body;
        res.json(await salesService.bulkNotify(installmentIds));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
