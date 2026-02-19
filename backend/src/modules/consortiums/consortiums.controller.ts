import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/index';
import { consortiumsService } from './consortiums.service';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(String(req.query.page)) || 1;
        const limit = parseInt(String(req.query.limit)) || 20;
        res.json(await consortiumsService.getAll(page, limit));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const consortium = await consortiumsService.getById(id);
        if (!consortium) { res.status(404).json({ error: 'Not found' }); return; }
        res.json(consortium);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        res.status(201).json(await consortiumsService.create(req.user.userId, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        res.json(await consortiumsService.update(id, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        await consortiumsService.delete(id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

// Participants
router.get('/:id/participants', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        res.json(await consortiumsService.getParticipants(id));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.post('/:id/participants', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        res.status(201).json(await consortiumsService.addParticipant(id, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.put('/participants/:participantId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const participantId = parseInt(req.params.participantId as string);
        res.json(await consortiumsService.updateParticipant(participantId, req.body));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.delete('/participants/:participantId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const participantId = parseInt(req.params.participantId as string);
        await consortiumsService.removeParticipant(participantId);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get('/participants/:participantId/details', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const participantId = parseInt(req.params.participantId as string);
        res.json(await consortiumsService.getParticipantDetails(participantId));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
