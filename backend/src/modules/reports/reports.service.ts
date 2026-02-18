import prisma from '../../config/database';

export class ReportsService {
    async getSummary() {
        const [
            totalSales,
            totalRevenue,
            pendingAmount,
            productsValue,
            activeConsortiums
        ] = await Promise.all([
            prisma.sale.count({ where: { status: 'active' } }),
            prisma.sale.aggregate({
                _sum: { totalAmount: true },
                where: { status: 'active' }
            }),
            prisma.installment.aggregate({
                _sum: { amount: true },
                where: { status: 'pending' }
            }),
            prisma.product.count({ where: { quantity: { gt: 0 } } }),
            prisma.consortium.count({ where: { status: 'active' } })
        ]);

        return {
            totalSales,
            totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
            pendingAmount: Number(pendingAmount._sum.amount || 0),
            productsInStock: productsValue,
            activeConsortiums,
            timestamp: new Date().toISOString()
        };
    }

    async getSalesByMonth() {
        // Simple aggregation for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const sales = await prisma.sale.findMany({
            where: {
                soldAt: { gte: sixMonthsAgo },
                status: 'active'
            },
            select: {
                totalAmount: true,
                soldAt: true
            },
            orderBy: { soldAt: 'asc' }
        });

        // Group by month
        const months: Record<string, number> = {};
        sales.forEach(s => {
            const m = new Date(s.soldAt).toLocaleString('pt-BR', { month: 'short' });
            months[m] = (months[m] || 0) + Number(s.totalAmount);
        });

        return Object.entries(months).map(([name, total]) => ({ name, total }));
    }
}

export const reportsService = new ReportsService();
