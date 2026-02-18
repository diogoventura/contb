import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import prisma from '../config/database';

export interface AuthPayload {
    userId: number;
    email: string;
    role: 'admin' | 'regular';
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
    params: { [key: string]: string };
    query: { [key: string]: string | string[] | undefined };
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'NO_TOKEN', message: 'Token não fornecido' });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.app.secret) as AuthPayload;
            req.user = decoded;

            prisma.user.update({
                where: { id: decoded.userId },
                data: { lastActiveAt: new Date() }
            }).catch(err => console.error('Error updating presence:', err));

            next();
        } catch {
            res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token inválido' });
            return;
        }
    } catch (error) {
        console.error('[AUTH] Error:', error);
        res.status(401).json({ error: 'INVALID_TOKEN', message: 'Erro interno na autenticação' });
    }
};

export const adminMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Acesso negado' });
        return;
    }
    next();
};
