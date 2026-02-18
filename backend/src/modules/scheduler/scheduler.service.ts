import schedule from 'node-schedule';
import { notificationWorkerService } from '../notifications/worker.service';

export const schedulerService = {
    init: () => {
        console.log('📅 Scheduler Service Initialized');

        // Check installment reminders every 30 minutes
        schedule.scheduleJob('*/30 * * * *', async () => {
            console.log('⏰ Running Installment Reminder Check...');
            try {
                await notificationWorkerService.processInstallmentReminders();
            } catch (error) {
                console.error('❌ Error processing installment reminders:', error);
            }
        });

        console.log('✅ Jobs scheduled: Installment Reminders (every 30m)');
    }
};
