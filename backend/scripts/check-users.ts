import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Listing all users in database...');
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true
            }
        });
        console.table(users);
    } catch (error) {
        console.error('❌ Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
