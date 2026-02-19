import prisma from '../../config/database';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { pdfService } from '../pdf/pdf.service';
// @ts-ignore
import { MessageMedia } from 'whatsapp-web.js';

export class NotificationWorkerService {
    private async getSetting(key: string, defaultValue: string) {
        const s = await prisma.systemSetting.findUnique({ where: { key } });
        return s ? s.value : defaultValue;
    }

    async processInstallmentReminders() {
        console.log('📨 Processing installment reminders (Sync/Due)...');

        try {
            const globalBeforeDays = parseInt(await this.getSetting('reminder_days_before', '1'));

            // Fetch pending installments that are NOT overdue yet
            const installments = await prisma.installment.findMany({
                where: { status: 'pending', dueDate: { gte: new Date() } },
                include: {
                    sale: { include: { consortium: true } }
                }
            });

            console.log(`  🔍 Checking ${installments.length} pending non-overdue installments...`);

            for (const inst of installments) {
                if (!inst.sale.personPhone) continue;
                const beforeDays = inst.sale.reminderDaysBefore ?? inst.sale.consortium?.reminderDaysBefore ?? globalBeforeDays;
                await this.handleInstallmentReminders(inst, beforeDays);
            }

        } catch (error) {
            console.error('❌ Error processing installment reminders:', error);
        }
    }

    async processOverdueReminders() {
        console.log('📨 Processing OVERDUE reminders (Configurable Job)...');

        try {
            // Fetch all overdue installments
            const installments = await prisma.installment.findMany({
                where: { status: 'pending', dueDate: { lt: new Date() } },
                include: {
                    sale: { include: { consortium: true } }
                }
            });

            console.log(`  🔍 Sending reminders for ${installments.length} overdue installments...`);

            for (const inst of installments) {
                if (!inst.sale.personPhone) continue;

                const now = new Date();
                const dueDate = new Date(inst.dueDate);
                const diffTime = now.getTime() - dueDate.getTime();
                const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const pdfBuffer = await pdfService.generateBoletoPDF(inst.id);
                const media = new MessageMedia(
                    'application/pdf',
                    pdfBuffer.toString('base64'),
                    `boleto-atrasado-p${inst.number}.pdf`
                );

                await this.sendSpecificReminder(
                    inst,
                    `Olá ${inst.sale.personName}, gostaria de lembrar que temos pendência de pagamento:\n\n• Boleto #${inst.saleId} parcela ${inst.number} - R$${Number(inst.amount).toFixed(2)}\n\n(Atrasado há ${daysOverdue} dias)\n\nSegue o boleto em anexo.\nObrigado! 🙏`,
                    { notifLateDays: { increment: 1 }, lastLateNotifAt: new Date() },
                    `Lembrete atraso (${daysOverdue}d)`,
                    media
                );
            }
        } catch (error) {
            console.error('❌ Error processing overdue reminders:', error);
        }
    }

    private async handleInstallmentReminders(inst: any, beforeDays: number) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const dueDate = new Date(inst.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 1. Before Reminders (only once)
        if (diffDays === beforeDays && !inst.notif1DaySent) {
            await this.sendSpecificReminder(inst, `📋 *Lembrete de Pagamento*\n\nOlá ${inst.sale.personName},\n\nSua parcela nº ${inst.number} no valor de R$${Number(inst.amount).toFixed(2)} vence em *${beforeDays === 1 ? 'amanhã' : beforeDays + ' dias'}* (${inst.dueDate.toLocaleDateString('pt-BR')}).\n\nPor favor, providencie o pagamento para evitar atrasos.\n\nObrigado! 🙏`, { notif1DaySent: true }, `Lembrete ${beforeDays} dia(s) antes`);
        }

        // 2. Due Day Reminders (only once)
        else if (diffDays === 0 && !inst.notifDueDaySent) {
            await this.sendSpecificReminder(inst, `⚠️ *Pagamento Hoje*\n\nOlá ${inst.sale.personName},\n\nSua parcela nº ${inst.number} no valor de R$${Number(inst.amount).toFixed(2)} vence *hoje* (${inst.dueDate.toLocaleDateString('pt-BR')}).\n\nPor favor, efetue o pagamento o mais breve possível.\n\nObrigado! 🙏`, { notifDueDaySent: true }, `Lembrete dia do vencimento`);
        }
    }

    private async sendSpecificReminder(inst: any, message: string, updateData: any, logPrefix: string, media?: MessageMedia) {
        try {
            if (media) {
                await whatsappService.sendMediaMessage(inst.sale.personPhone, media, message);
            } else {
                await whatsappService.sendMessage(inst.sale.personPhone, message);
            }
            await prisma.installment.update({ where: { id: inst.id }, data: updateData });
            await this.createNotification(`${logPrefix} enviado para ${inst.sale.personName} - Parcela ${inst.number}`);
            console.log(`  ✅ ${logPrefix} sent: ${inst.sale.personName} parcela ${inst.number}`);
        } catch (error) {
            console.error(`  ❌ Failed ${logPrefix}: ${inst.sale.personName}`, error);
        }
    }

    private async createNotification(content: string) {
        // Notify all admin users
        const admins = await prisma.user.findMany({ where: { role: 'admin', isActive: true }, select: { id: true } });
        for (const admin of admins) {
            await prisma.notification.create({ data: { type: 'installment_reminder', content, recipientId: admin.id } });
        }
    }
}

export const notificationWorkerService = new NotificationWorkerService();
