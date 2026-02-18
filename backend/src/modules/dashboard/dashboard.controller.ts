import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/index';
import prisma from '../../config/database';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const [totalSales, totalProducts, activeConsortiums, pendingInstallments] = await Promise.all([
            prisma.sale.aggregate({ _sum: { totalAmount: true } }),
            prisma.product.count(),
            prisma.consortium.count({ where: { status: 'ACTIVE' } }),
            prisma.installment.count({ where: { status: 'PENDING' } })
        ]);

        const recentSales = await prisma.sale.findMany({
            take: 5,
            orderBy: { soldAt: 'desc' },
            include: { installments: true }
        });

        const upcomingInstallments = await prisma.installment.findMany({
            where: { status: 'PENDING', dueDate: { gte: new Date() } },
            take: 5,
            orderBy: { dueDate: 'asc' },
            include: { sale: true }
        });

        res.json({
            summary: {
                totalRevenue: totalSales._sum.totalAmount || 0,
                productCount: totalProducts,
                consortiumCount: activeConsortiums,
                pendingInstallments
            },
            recentSales,
            upcomingInstallments
        });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

export default router;
