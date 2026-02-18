import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/index';
import { whatsappService } from './whatsapp.service';

const router = Router();
router.use(authMiddleware);

router.get('/status', (_req: AuthRequest, res: Response) => {
    res.json(whatsappService.getStatus());
});

router.get('/qr', (_req: AuthRequest, res: Response) => {
    const qr = whatsappService.getQR();
    if (!qr) { res.status(404).json({ error: 'QR Code not available' }); return; }
    res.json({ qr });
});

router.post('/send', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { to, message } = req.body;
        const success = await whatsappService.sendMessage(to, message);
        res.json({ success });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/logout', async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        await whatsappService.logout();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
