// @ts-ignore
import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';

class WhatsAppService {
    private client: Client | null = null;
    private qrCode: string | null = null;
    private isReady = false;
    private isInitializing = false;

    async init() {
        if (this.isInitializing || this.isReady) return;
        this.isInitializing = true;

        try {
            this.client = new Client({
                authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
                }
            });

            this.client.on('qr', async (qr) => {
                console.log('📱 WhatsApp QR Code received');
                this.qrCode = await QRCode.toDataURL(qr);
            });

            this.client.on('ready', () => {
                console.log('✅ WhatsApp client ready');
                this.isReady = true;
                this.qrCode = null;
            });

            this.client.on('disconnected', () => {
                console.log('❌ WhatsApp disconnected');
                this.isReady = false;
            });

            await this.client.initialize();
        } catch (error) {
            console.error('❌ WhatsApp init error:', error);
            this.isInitializing = false;
        }
    }

    async sendMessage(to: string, message: string) {
        if (!this.client || !this.isReady) {
            console.warn('⚠️ WhatsApp not ready, message not sent');
            return false;
        }

        try {
            const phone = to.replace(/\D/g, '');
            const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
            await this.client.sendMessage(chatId, message);
            console.log(`✅ WhatsApp message sent to ${phone}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to send WhatsApp to ${to}:`, error);
            return false;
        }
    }

    getStatus() {
        return { isReady: this.isReady, hasQR: !!this.qrCode, isInitializing: this.isInitializing };
    }

    getQR() { return this.qrCode; }

    async logout() {
        if (this.client) {
            await this.client.logout();
            this.isReady = false;
            this.qrCode = null;
        }
    }
}

export const whatsappService = new WhatsAppService();
