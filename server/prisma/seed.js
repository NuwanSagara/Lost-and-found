/*
  Prisma seed scaffold for teams that migrate auth to Prisma later.
  The live app currently seeds the working Mongo/Mongoose admin via:
  npm run seed:admin
*/

const bcrypt = require('bcryptjs');

async function main() {
    const { PrismaClient, Role } = require('@prisma/client');
    const prisma = new PrismaClient();

    const adminName = process.env.ADMIN_NAME || 'CampusFound Admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@campusfound.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

    const password = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            name: adminName,
            password,
            role: Role.ADMIN,
        },
        create: {
            name: adminName,
            email: adminEmail,
            password,
            role: Role.ADMIN,
        },
    });

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error('Prisma admin seed failed:', error);
    process.exitCode = 1;
});
