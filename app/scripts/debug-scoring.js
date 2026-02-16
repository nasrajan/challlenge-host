/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('--- SCORING DEBUGGER ---')

    // 1. Get the participant with logs
    const participant = await prisma.participant.findUnique({
        where: { id: 'cmlj4c2my0003bp51i3ijful8' },
        include: { challenge: true }
    })

    if (!participant) {
        console.log('No participants found.')
        return
    }

    console.log(`Analyzing Participant: ${participant.name} (${participant.id})`)
    console.log(`Challenge: ${participant.challenge.name}`)
    console.log(`Start: ${participant.challenge.startDate}, End: ${participant.challenge.endDate}`)

    // 2. Check Activity Logs
    const logs = await prisma.activityLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' }
    })
    console.log(`\nFound ${logs.length} Recent Activity Logs (All Participants):`)
    logs.forEach(l => console.log(` - [${l.date.toISOString()}] Metric: ${l.metricId}, Value: ${l.value}, Participant: ${l.participantId}, User: ${l.userId}`))

    // 3. Check Metrics and Rules
    const metrics = await prisma.challengeMetric.findMany({
        where: { challengeId: participant.challengeId },
        include: { scoringRules: true }
    })

    console.log(`\nMetrics Config:`)
    metrics.forEach(m => {
        console.log(` - Metric: ${m.name} (${m.id})`)
        console.log(`   Freq: ${m.scoringFrequency}, Method: ${m.aggregationMethod}`)
        m.scoringRules.forEach(r => {
            console.log(`   * Rule: ${r.comparisonType} [${r.minValue}-${r.maxValue}] = ${r.points} pts (QID: ${r.qualifierId})`)
        })
    })

    // 4. Check Snapshots
    const snapshots = await prisma.scoreSnapshot.findMany({
        where: { participantId: participant.id }
    })
    console.log(`\nFound ${snapshots.length} Score Snapshots:`)
    snapshots.forEach(s => {
        console.log(` - Metric: ${s.metricId}, TotalPts: ${s.totalPoints}, Raw: ${s.rawPoints}`)
    })

    // 5. Simulate Scoring
    console.log('\n--- SIMULATING SCORING ---')
    for (const metric of metrics) {
        // Get logs for this metric (NO DATE FILTER as per fix)
        const metricLogs = await prisma.activityLog.findMany({
            where: {
                participantId: participant.id,
                metricId: metric.id
            }
        })

        if (metricLogs.length === 0) continue;

        console.log(`Metric: ${metric.name} (${metric.id}) - ${metricLogs.length} logs`)

        let totalPoints = 0;
        // Simple daily aggregation simulation
        // Assumes DAILY frequency and SUM aggregation for now
        // This is a simplified check

        // Group by day
        const dailyValues = {}
        metricLogs.forEach(l => {
            const day = l.date.toISOString().split('T')[0]
            if (!dailyValues[day]) dailyValues[day] = 0
            dailyValues[day] += l.value
        })

        Object.entries(dailyValues).forEach(([day, val]) => {
            let dayPoints = 0
            // Apply rules
            // Assuming no qualifiers for simplicity in test
            const rules = metric.scoringRules.filter(r => r.qualifierId === null)
            rules.forEach(r => {
                let match = false
                if (r.comparisonType === 'GREATER_THAN_EQUAL' && val >= (r.minValue || 0)) match = true
                if (r.comparisonType === 'RANGE' && val >= (r.minValue || 0) && val <= (r.maxValue || Infinity)) match = true

                if (match) {
                    console.log(`  [${day}] Value ${val} matched rule yielding ${r.points} pts`)
                    dayPoints += r.points
                }
            })
            totalPoints += dayPoints
        })
        console.log(`  -> Calculated Total Score: ${totalPoints}`)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
