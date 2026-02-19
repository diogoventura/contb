import puppeteer from 'puppeteer-core';
import { salesService } from '../sales/sales.service';

export class PdfService {
    async generateBoletoPDF(installmentId: number): Promise<Buffer> {
        const html = await salesService.renderBoletoHTML(installmentId);

        let executablePath = '';
        if (process.platform === 'win32') {
            executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        }

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: executablePath || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load', timeout: 10000 });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });
        await browser.close();
        return Buffer.from(pdf);
    }
}

export const pdfService = new PdfService();
