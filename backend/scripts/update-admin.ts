import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@gmail.com';
    const password = 'Admin@123';
    const passwordHash = await bcrypt.hash(password, 10);

    console.log(`🚀 Updating admin user to: ${email}...`);

    try {
        // First try to update the new email if it exists
        await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash,
                name: 'Administrador',
                isActive: true,
                role: 'admin'
            },
            create: {
                email,
                passwordHash,
                name: 'Administrador',
                isActive: true,
                role: 'admin'
            }
        });

        // Also remove the old admin if it persists
        await prisma.user.deleteMany({
            where: {
                email: 'admin@contb.com'
            }
        });

        console.log('✅ Admin credentials updated successfully!');
    } catch (error) {
        console.error('❌ Error updating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
