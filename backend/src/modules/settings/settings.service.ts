import prisma from '../../config/database';

export class SettingsService {
    async get(key: string) {
        return prisma.systemSetting.findUnique({ where: { key } });
    }

    async getAll() {
        return prisma.systemSetting.findMany();
    }

    async set(key: string, value: string) {
        return prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
    }

    async getReminderDays() {
        const setting = await this.get('reminder_days');
        return setting ? parseInt(setting.value) : 1; // Default 1 day
    }
}

export const settingsService = new SettingsService();
