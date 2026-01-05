import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const users = [
        { username: 'yassine.boutouil.a', password: '*yb1101!05at', role: Role.ADMIN },
        { username: 'zineddine.harrar.a', password: 'har*z521!', role: Role.ADMIN },
        { username: 'rayan.belhadi.a', password: '*rayb!1122*ata', role: Role.ADMIN },
        { username: 'yassine.boutouil.s', password: 's.*yb1101!05at', role: Role.STANDARD },
        { username: 'zineddine.harrar.s', password: 's.har*z521!', role: Role.STANDARD },
        { username: 'rayan.belhadi.s', password: 's.*rayb!1122*ata', role: Role.STANDARD },
    ];

    console.log('Seeding users...');

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.upsert({
            where: { username: user.username },
            update: {
                password: hashedPassword,
                role: user.role,
            },
            create: {
                username: user.username,
                password: hashedPassword,
                role: user.role,
            },
        });
        console.log(`User ${user.username} created/updated with role ${user.role}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
