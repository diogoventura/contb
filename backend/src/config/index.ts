import dotenv from 'dotenv';

dotenv.config();

export const config = {
    app: {
        port: parseInt(process.env.PORT || process.env.APP_PORT || '3002', 10),
        secret: process.env.APP_SECRET || 'default-secret',
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    database: {
        url: (process.env.DATABASE_URL?.includes('/app/data') && !process.env.DATABASE_URL?.includes('/app/prisma/data'))
            ? process.env.DATABASE_URL.replace('/app/data', '/app/prisma/data')
            : (process.env.DATABASE_URL || 'file:./prisma/dev.db'),
    },
    jwt: {
        expiresIn: '24h',
    },
};
