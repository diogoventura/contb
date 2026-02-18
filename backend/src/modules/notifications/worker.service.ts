import prisma from '../../config/database';
import { whatsappService } from '../whatsapp/whatsapp.service';

export class NotificationWorkerService {
    private async getSetting(key: string, defaultValue: string) {
        const s = await prisma.systemSetting.findUnique({ where: { key } });
        return s ? s.value : defaultValue;
    }

    async processInstallmentReminders() {
        console.log('📨 Processing installment reminders...');

        try {
            const globalBeforeDays = parseInt(await this.getSetting('reminder_days_before', '1'));
            const globalIntervalAfter = parseInt(await this.getSetting('reminder_interval_after', '3'));

            // Fetch all pending installments with sale and consortium context
            const installments = await (prisma.installment.findMany as any)({
                where: { status: 'pending' },
                include: {
                    sale: {
                        include: { consortium: true }
                    }
                }
            });

            console.log(`  🔍 Checking ${installments.length} pending installments...`);

            for (const inst of installments) {
                if (!inst.sale.personPhone) continue;

                // Priority: Sale > Consortium > Global
                const beforeDays = inst.sale.reminderDaysBefore ?? inst.sale.consortium?.reminderDaysBefore ?? globalBeforeDays;
                const intervalAfter = inst.sale.reminderIntervalAfter ?? inst.sale.consortium?.reminderIntervalAfter ?? globalIntervalAfter;

                await this.handleInstallmentReminders(inst, beforeDays, intervalAfter);
            }

        } catch (error) {
            console.error('❌ Error processing installment reminders:', error);
        }
    }

    private async handleInstallmentReminders(inst: any, beforeDays: number, intervalAfter: number) {
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

        // 3. Overdue Reminders (repeated every intervalAfter days)
        else if (diffDays < 0) {
            const daysOverdue = Math.abs(diffDays);
            let shouldSend = false;

            if (!inst.lastLateNotifAt) {
                shouldSend = true; // First late reminder
            } else {
                const lastNotif = new Date(inst.lastLateNotifAt);
                lastNotif.setHours(0, 0, 0, 0);
                const nextDueNotif = new Date(lastNotif);
                nextDueNotif.setDate(nextDueNotif.getDate() + intervalAfter);

                if (now.getTime() >= nextDueNotif.getTime()) {
                    shouldSend = true;
                }
            }

            if (shouldSend) {
                await this.sendSpecificReminder(inst, `🔴 *Parcela em Atraso*\n\nOlá ${inst.sale.personName},\n\nSua parcela nº ${inst.number} no valor de R$${Number(inst.amount).toFixed(2)} está *${daysOverdue} dias em atraso* (venceu em ${inst.dueDate.toLocaleDateString('pt-BR')}).\n\nPor favor, regularize seu pagamento o mais breve possível.\n\nEm caso de dúvidas, entre em contato conosco.\n\nObrigado! 🙏`, { notifLateDays: { increment: 1 }, lastLateNotifAt: new Date() }, `Lembrete atraso (${daysOverdue}d)`);
            }
        }
    }

    private async sendSpecificReminder(inst: any, message: string, updateData: any, logPrefix: string) {
        try {
            await whatsappService.sendMessage(inst.sale.personPhone, message);
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
