/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('--- STARTING PARTICIPANT DATA CLEANUP ---')

    // 1. Find all participants
    const participants = await prisma.participant.findMany({
        orderBy: { joinedAt: 'asc' }
    })

    console.log(`Total participants found: ${participants.length}`)

    // 2. Identify duplicates by (userId, challengeId, name)
    const groups = {}
    participants.forEach(p => {
        const key = `${p.userId}-${p.challengeId}-${p.name || ''}`
        if (!groups[key]) groups[key] = []
        groups[key].push(p)
    })

    const duplicateGroups = Object.entries(groups).filter(([_, group]) => group.length > 1)
    console.log(`Found ${duplicateGroups.length} conflicting groups.`)

    for (const [key, group] of duplicateGroups) {
        console.log(`\nProcessing group: ${key}`)

        for (let i = 0; i < group.length; i++) {
            const p = group[i]
            // Default to displayName, fallback to name+index if displayName is missing or also non-unique
            let newName = p.displayName?.trim() || p.name?.trim() || `Participant ${i + 1}`

            // Ensure even the new name is unique within this specific conflict group processing
            // (In case multiple entries had the same displayName)
            if (group.filter(other => (other.displayName?.trim() || other.name?.trim()) === newName).length > 1) {
                newName = `${newName} (${i + 1})`
            }

            console.log(`  updating ID ${p.id}: "${p.name}" -> "${newName}"`)

            await prisma.participant.update({
                where: { id: p.id },
                data: {
                    name: newName,
                    displayName: p.displayName || newName
                }
            })
        }
    }

    console.log('\n--- CLEANUP COMPLETE ---')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
