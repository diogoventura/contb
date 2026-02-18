import prisma from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index';

export class AuthService {
    async login(email: string, password: string): Promise<{ token: string; user: any }> {
        if (!email || !password) throw new Error('Email and password required');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) throw new Error('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            config.app.secret,
            { expiresIn: config.jwt.expiresIn as any }
        );

        const { passwordHash: _, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword };
    }

    async getProfile(userId: number) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, phone: true }
        });
    }
}

export const authService = new AuthService();
