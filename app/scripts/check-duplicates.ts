import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const participants = await prisma.participant.findMany({
        select: {
            id: true,
            userId: true,
            challengeId: true,
            name: true,
            displayName: true
        }
    })

    console.log('Total participants:', participants.length)

    const counts: Record<string, string[]> = {}
    participants.forEach(p => {
        const key = `${p.userId}-${p.challengeId}-${p.name}`
        if (!counts[key]) counts[key] = []
        counts[key].push(p.id)
    })

    const duplicates = Object.entries(counts).filter(([_, ids]) => ids.length > 1)

    if (duplicates.length === 0) {
        console.log('No duplicates found for (userId, challengeId, name)')
    } else {
        console.log('Found duplicates:')
        duplicates.forEach(([key, ids]) => {
            console.log(`Key: ${key}, IDs: ${ids.join(', ')}`)
        })
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
