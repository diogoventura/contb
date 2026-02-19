import prisma from '../../config/database';
import { settingsService } from '../settings/settings.service';

export class InsightService {
    async generateInsights() {
        console.log('📊 Generating system insights...');

        try {
            const [optimization, billing, integrity] = await Promise.all([
                this.calculateOptimization(),
                this.calculateBilling(),
                this.calculateIntegrity()
            ]);

            const insights = {
                optimization,
                billing,
                integrity,
                updatedAt: new Date().toISOString()
            };

            await settingsService.set('dashboard_insights', JSON.stringify(insights));
            console.log('✅ Insights updated and saved.');
            return insights;
        } catch (error) {
            console.error('❌ Error generating insights:', error);
            return null;
        }
    }

    async getInsights() {
        const setting = await settingsService.get('dashboard_insights');
        if (!setting) {
            return this.generateInsights();
        }
        return JSON.parse(setting.value);
    }

    private async calculateOptimization() {
        // Growth comparison: This month vs Last Month
        const now = new Date();
        const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [thisMonth, lastMonth, lowStock] = await Promise.all([
            prisma.installment.aggregate({
                where: { status: 'paid', paidAt: { gte: startThisMonth } },
                _sum: { amount: true }
            }),
            prisma.installment.aggregate({
                where: { status: 'paid', paidAt: { gte: startLastMonth, lte: endLastMonth } },
                _sum: { amount: true }
            }),
            prisma.product.count({ where: { quantity: { lte: 5 }, isActive: true } })
        ]);

        const current = Number(thisMonth._sum.amount || 0);
        const previous = Number(lastMonth._sum.amount || 0);

        let message = '';
        if (previous > 0) {
            const growth = ((current - previous) / previous) * 100;
            if (growth > 0) {
                message = `Sua receita cresceu ${growth.toFixed(0)}% em relação ao mês passado. `;
            } else if (growth < 0) {
                message = `Sua receita caiu ${Math.abs(growth).toFixed(0)}% em relação ao mês passado. `;
            }
        } else {
            message = 'Iniciando análise de crescimento mensal. ';
        }

        if (lowStock > 0) {
            message += `Existem ${lowStock} produtos com estoque baixo. Considere reabastecer.`;
        } else {
            message += 'Seu estoque está em níveis saudáveis.';
        }

        return message;
    }

    private async calculateBilling() {
        const pending = await prisma.installment.aggregate({
            where: { status: 'pending' },
            _sum: { amount: true }
        });

        const amount = Number(pending._sum.amount || 0);
        if (amount > 0) {
            return `Existem R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes. Ative os avisos em massa para agilizar o recebimento.`;
        }
        return 'Parabéns! Não existem pendências de pagamento relevantes no momento.';
    }

    private async calculateIntegrity() {
        // Check for installments due in the last 24h that might not have boletos or notifications sent
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);

        const [failures, total] = await Promise.all([
            prisma.installment.count({
                where: {
                    createdAt: { gte: dayAgo },
                    status: 'pending',
                    boletoUrl: null
                }
            }),
            prisma.installment.count({
                where: { createdAt: { gte: dayAgo } }
            })
        ]);

        if (failures > 0) {
            return `Atenção: ${failures} boletos gerados recentemente podem estar com problemas de visualização. Verifique a integração.`;
        }

        if (total > 0) {
            return `Todos os ${total} boletos gerados nas últimas 24h foram processados com sucesso. Sistema íntegro.`;
        }

        return 'Sistema de integridade monitorando. Nenhuma falha detectada nas últimas 24h.';
    }
}

export const insightService = new InsightService();
