import prisma from '../../config/database';
import bcrypt from 'bcrypt';

export class UsersService {
    async getAll(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip, take: limit,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true, profilePicture: true }
            }),
            prisma.user.count()
        ]);
        return { users, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getById(id: number) {
        return prisma.user.findUnique({ where: { id } });
    }

    async create(data: { name: string; email: string; password?: string; role: string; phone?: string }) {
        const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : await bcrypt.hash('temporary_password', 10);
        const { password, ...rest } = data;
        return prisma.user.create({
            data: { ...rest, passwordHash: hashedPassword }
        });
    }

    async update(id: number, data: any) {
        const updateData = { ...data };
        if (updateData.password) {
            updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
            delete updateData.password;
        }
        return prisma.user.update({ where: { id }, data: updateData });
    }

    async delete(id: number) {
        return prisma.user.delete({ where: { id } });
    }

    async ensureAdmin() {
        const email = 'admin@gmail.com';
        const password = 'Admin@123';
        const passwordHash = await bcrypt.hash(password, 10);

        console.log(`🧹 Ensuring admin user: ${email}...`);

        try {
            await prisma.user.upsert({
                where: { email },
                update: { passwordHash, isActive: true, role: 'admin' },
                create: {
                    name: 'Administrador',
                    email,
                    passwordHash,
                    role: 'admin',
                    isActive: true,
                },
            });
            console.log('✅ Admin user is ready.');
        } catch (error) {
            console.error('❌ Failed to ensure admin user:', error);
        }
    }
}

export const usersService = new UsersService();
