/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@challenge.io' }
    })
    console.log('User found:', JSON.stringify(user, null, 2))
}

main().finally(() => prisma.$disconnect())
