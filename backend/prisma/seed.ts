import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');

    const passwordHash = await bcrypt.hash('Admin@123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@gmail.com' },
        update: {
            passwordHash
        },
        create: {
            name: 'Administrador',
            email: 'admin@gmail.com',
            passwordHash,
            role: 'admin',
            isActive: true,
        },
    });

    console.log('✅ Admin user created: admin@gmail.com / Admin@123');
    console.log('🌱 Seeding complete!');
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
