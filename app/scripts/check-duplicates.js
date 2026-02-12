const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const participants = await prisma.participant.findMany({
        include: {
            user: { select: { email: true, name: true } },
            challenge: { select: { name: true } }
        }
    })

    const counts = {}
    participants.forEach(p => {
        const key = `${p.userId}-${p.challengeId}-${p.name || ''}`
        if (!counts[key]) counts[key] = []
        counts[key].push(p)
    })

    const duplicates = Object.entries(counts).filter(([_, group]) => group.length > 1)

    if (duplicates.length === 0) {
        console.log('No duplicates found.')
    } else {
        console.log(' --- DUPLICATE PARTICIPANTS REPORT --- ')
        duplicates.forEach(([key, group]) => {
            console.log(`\nConflict Group (User-Challenge-Name): ${key}`)
            console.log(`Challenge: ${group[0].challenge.name}`)
            console.log(`User: ${group[0].user.name || group[0].user.email}`)
            group.forEach((p, i) => {
                console.log(`  [${i + 1}] ID: ${p.id}`)
                console.log(`      Name: "${p.name}"`)
                console.log(`      DisplayName: "${p.displayName}"`)
                console.log(`      Joined At: ${p.joinedAt}`)
            })
        })
        console.log('\n---------------------------------------')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
