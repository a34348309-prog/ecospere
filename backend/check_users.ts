
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log(`Total users: ${count}`);
    if (count > 0) {
        const users = await prisma.user.findMany({ take: 5 });
        console.log('Sample users:', users.map(u => ({ email: u.email, name: u.name })));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
