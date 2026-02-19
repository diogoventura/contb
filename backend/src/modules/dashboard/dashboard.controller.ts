import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/index';
import prisma from '../../config/database';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const [
            monthlyRevenue,
            totalSales,
            activeConsortiums,
            pendingInstallments,
            overdueInstallments,
            totalProducts
        ] = await Promise.all([
            // Monthly Revenue: Paid installments in current month
            prisma.installment.aggregate({
                where: { status: 'paid', paidAt: { gte: startOfMonth, lte: endOfMonth } },
                _sum: { amount: true }
            }),
            prisma.sale.count(),
            prisma.consortium.count({ where: { status: 'active' } }),
            prisma.installment.count({ where: { status: 'pending', dueDate: { gte: now } } }),
            prisma.installment.count({ where: { status: 'pending', dueDate: { lt: now } } }),
            prisma.product.count()
        ]);

        const recentSales = await prisma.sale.findMany({
            take: 5,
            orderBy: { soldAt: 'desc' },
            include: { installments: true }
        });

        const upcomingInstallments = await prisma.installment.findMany({
            where: { status: 'pending', dueDate: { gte: now } },
            take: 5,
            orderBy: { dueDate: 'asc' },
            include: { sale: true }
        });

        res.json({
            summary: {
                monthlyRevenue: monthlyRevenue._sum.amount || 0,
                totalSales,
                activeConsortiums,
                pendingInstallments,
                overdueInstallments,
                totalProducts
            },
            recentSales,
            upcomingInstallments
        });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
