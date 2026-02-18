import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import { config } from './config/index';

// Import controllers
import authController from './modules/auth/auth.controller';
import usersController from './modules/users/users.controller';
import productsController from './modules/products/products.controller';
import consortiumsController from './modules/consortiums/consortiums.controller';
import salesController from './modules/sales/sales.controller';
import dashboardController from './modules/dashboard/dashboard.controller';
import notificationsController from './modules/notifications/notifications.controller';
import whatsappController from './modules/whatsapp/whatsapp.controller';
import reportsController from './modules/reports/reports.controller';
import settingsController from './modules/settings/settings.controller';

// Import services
import { whatsappService } from './modules/whatsapp/whatsapp.service';
import { schedulerService } from './modules/scheduler/scheduler.service';
import { usersService } from './modules/users/users.service';

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/ping', (_req, res) => res.send('pong'));
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/auth', authController);
app.use('/api/users', usersController);
app.use('/api/products', productsController);
app.use('/api/consortiums', consortiumsController);
app.use('/api/sales', salesController);
app.use('/api/dashboard', dashboardController);
app.use('/api/notifications', notificationsController);
app.use('/api/whatsapp', whatsappController);
app.use('/api/reports', reportsController);
app.use('/api/settings', settingsController);

// Serve frontend in production
const isProd = process.env.NODE_ENV === 'production';
if (isProd || process.env.STATIC_PATH) {
    const staticPath = process.env.STATIC_PATH || 'public';
    app.use(express.static(staticPath));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(process.cwd(), staticPath, 'index.html'));
    });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message || 'Erro interno do servidor' });
});

const PORT = config.app.port;

// Debug Environment
console.log('🌐 [ENV_DEBUG] Starting server diagnostics...');
console.log(`🌐 [ENV_DEBUG] CWD: ${process.cwd()}`);

let dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
// Fix for common Railway SQLite absolute path issues
if (dbUrl === 'file:/app/data/contb.db' || dbUrl.includes('/app/data')) {
    console.log('🌐 [ENV_DEBUG] Detected absolute /app/data path. Ensuring directory exists...');
}
console.log(`🌐 [ENV_DEBUG] Resolved DATABASE_URL: ${dbUrl}`);

// Safely log environment keys
console.log(`🌐 [ENV_DEBUG] Env Keys: ${Object.keys(process.env).filter(k => !k.toLowerCase().includes('hash') && !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('password')).join(', ')}`);

// Ensure data directory exists if using /app/data or /data
['/app/data', '/data'].forEach(dataDir => {
    if (process.env.DATABASE_URL?.includes(dataDir)) {
        if (!fs.existsSync(dataDir)) {
            console.log(`📂 [ENV_DEBUG] Creating missing directory: ${dataDir}`);
            try {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log(`✅ [ENV_DEBUG] Created ${dataDir}`);
            } catch (e) {
                console.error(`❌ [ENV_DEBUG] Failed to create ${dataDir}:`, e);
            }
        } else {
            console.log(`📂 [ENV_DEBUG] Directory already exists: ${dataDir}`);
            try {
                fs.accessSync(dataDir, fs.constants.W_OK);
                console.log(`✅ [ENV_DEBUG] Directory is writable: ${dataDir}`);
            } catch (e) {
                console.error(`❌ [ENV_DEBUG] Directory is NOT writable: ${dataDir}`, e);
            }
        }
    }
});

// Ensure Admin
usersService.ensureAdmin()
    .then(() => console.log('🛡️  Initial admin check completed.'))
    .catch(err => console.error('❌ Failed to ensure admin:', err));

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║   ContB API Server running on port ${String(PORT).padEnd(23)}║
║   Environment: ${(config.app.nodeEnv).padEnd(40)}║
╚══════════════════════════════════════════════════════════╝
    `);

    // Initialize WhatsApp
    whatsappService.init().catch(err => console.error('❌ WhatsApp init failed:', err));

    // Start scheduler
    schedulerService.init();
});

// Heartbeat
setInterval(() => {
    console.log(`💓 [HEARTBEAT] ${new Date().toISOString()} - Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
}, 60000);

export default server;
