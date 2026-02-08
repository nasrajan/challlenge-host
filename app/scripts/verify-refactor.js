const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- Verifying Data Model ---')

    const challenge = await prisma.challenge.findFirst({
        include: {
            metrics: {
                include: {
                    scoringRules: true,
                    qualifiers: true,
                    scoreSnapshots: true
                }
            },
            activityLogs: true
        }
    })

    if (!challenge) {
        console.log('No challenges found. Seed may have failed or DB is empty.')
        return
    }

    console.log('Challenge:', challenge.name)
    console.log('Metrics Count:', challenge.metrics.length)
    challenge.metrics.forEach(m => {
        console.log(`- Metric: ${m.name} (${m.unit})`)
        console.log(`  Rules: ${m.scoringRules.length}`)
    })

    console.log('\n--- Verifying Activity Log Fields ---')
    const logs = await prisma.activityLog.findMany({ take: 1 })
    if (logs.length > 0) {
        console.log('Log found. Checking fields...')
        console.log('MetricId present:', !!logs[0].metricId)
    } else {
        console.log('No activity logs found yet.')
    }
}

main().finally(() => prisma.$disconnect())
