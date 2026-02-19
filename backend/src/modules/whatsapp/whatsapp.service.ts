// @ts-ignore
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
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
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-blink-features=AutomationControlled'
                    ],
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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

    private async resolveChatId(to: string) {
        if (!this.client) return null;

        let phone = to.replace(/\D/g, '');

        // Ensure Brazil country code if not present
        if (phone.length <= 11 && !phone.startsWith('55')) {
            phone = '55' + phone;
        }

        try {
            // Resolve the actual JID (handles 9th digit differences and existence check)
            const id = await this.client.getNumberId(phone);
            if (id) return id._serialized;

            // Fallback for cases where getNumberId might fail but phone is valid
            return phone.includes('@c.us') ? phone : `${phone}@c.us`;
        } catch (error) {
            console.error(`❌ Error resolving ID for ${phone}:`, error);
            return phone.includes('@c.us') ? phone : `${phone}@c.us`;
        }
    }

    async sendMessage(to: string, message: string) {
        if (!this.client || !this.isReady) {
            console.warn('⚠️ WhatsApp not ready, message not sent');
            return false;
        }

        const chatId = await this.resolveChatId(to);
        if (!chatId) return false;

        try {
            await this.client.sendMessage(chatId, message);
            console.log(`✅ WhatsApp message sent to ${chatId}`);
            return true;
        } catch (error: any) {
            console.error(`❌ Failed to send WhatsApp to ${to}:`, error.message);
            return false;
        }
    }

    async sendMediaMessage(to: string, media: MessageMedia, caption?: string) {
        if (!this.client || !this.isReady) {
            console.warn('⚠️ WhatsApp not ready, media message not sent');
            return false;
        }

        const chatId = await this.resolveChatId(to);
        if (!chatId) return false;

        try {
            console.log(`📤 Sending media message to ${chatId}...`);
            await this.client.sendMessage(chatId, media, { caption });
            console.log(`✅ WhatsApp media message sent to ${chatId}`);
            return true;
        } catch (error: any) {
            console.error(`❌ Failed to send WhatsApp media to ${to}:`, error.message);
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
