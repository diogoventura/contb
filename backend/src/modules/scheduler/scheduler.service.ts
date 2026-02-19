import schedule from 'node-schedule';
import { notificationWorkerService } from '../notifications/worker.service';
import prisma from '../../config/database';

let overdueJob: schedule.Job | null = null;

export const schedulerService = {
    init: async () => {
        console.log('📅 Scheduler Service Initialized');

        // 1. Regular Check (Before/Due) - Every 30 minutes
        schedule.scheduleJob('*/30 * * * *', async () => {
            console.log('⏰ Running regular installment check...');
            try {
                await notificationWorkerService.processInstallmentReminders();
            } catch (error) {
                console.error('❌ Regular sync error:', error);
            }
        });

        // 3. Insight Check (Every 3 days)
        schedule.scheduleJob('0 0 */3 * *', async () => {
            console.log('⏰ Running 3-day insight refresh...');
            try {
                const { insightService } = await import('../reports/insight.service');
                await insightService.generateInsights();
            } catch (error) {
                console.error('❌ Insight refresh error:', error);
            }
        });

        console.log('✅ Jobs scheduled: Sync (30m), dynamic Overdue, and 3-day Insights.');
    },

    rescheduleOverdueJob: async () => {
        if (overdueJob) {
            overdueJob.cancel();
            overdueJob = null;
        }

        try {
            const getS = async (k: string, d: string) => {
                const s = await prisma.systemSetting.findUnique({ where: { key: k } });
                return s ? s.value : d;
            };

            const enabled = (await getS('overdue_notif_enabled', 'false')) === 'true';
            if (!enabled) {
                console.log('🚫 Overdue notifications are disabled in settings.');
                return;
            }

            const freq = await getS('overdue_notif_freq', 'weekly'); // 'weekly' or 'monthly'
            const day = await getS('overdue_notif_day', '1'); // 1-7 (Mon-Sun) or 1-31
            const hour = await getS('overdue_notif_hour', '09');
            const minute = await getS('overdue_notif_minute', '00');

            // Construct Cron: min hour dom month dow
            let cron = `${minute} ${hour} `;
            if (freq === 'weekly') {
                cron += `* * ${day}`; // day 1 = Monday in node-schedule? Actually node-schedule 0-6 (Sun-Sat)
                // Let's assume user sends 1 for Mon, 7 for Sun. Convert to 0-6.
                const dow = (parseInt(day) % 7);
                cron = `${minute} ${hour} * * ${dow}`;
            } else {
                cron += `${day} * *`;
            }

            console.log(`⏰ Scheduling Overdue Job with cron: [${cron}]`);
            overdueJob = schedule.scheduleJob(cron, async () => {
                console.log('⏰ Running Scheduled Overdue Reminders...');
                try {
                    await notificationWorkerService.processOverdueReminders();
                } catch (error) {
                    console.error('❌ Overdue job error:', error);
                }
            });
        } catch (error) {
            console.error('❌ Failed to reschedule overdue job:', error);
        }
    }
};
