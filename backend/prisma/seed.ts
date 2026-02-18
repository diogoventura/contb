import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');

    const passwordHash = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@contb.com' },
        update: {},
        create: {
            name: 'Administrador',
            email: 'admin@contb.com',
            passwordHash,
            role: 'admin',
            isActive: true,
        },
    });

    console.log('✅ Admin user created: admin@contb.com / admin123');
    console.log('🌱 Seeding complete!');
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
