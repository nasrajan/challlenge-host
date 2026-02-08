const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@challenge.io' }
    })

    if (!admin) {
        console.error('Admin user not found. Run create-admin.js first.')
        return
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + 30)

    const challenge = await prisma.challenge.create({
        data: {
            name: 'Ultimate Fitness Odyssey 2026',
            description: 'The definitive multi-discipline fitness challenge. Log your steps, workouts, and more to earn points and climb the leaderboard.',
            startDate,
            endDate,
            organizerId: admin.id,
            status: 'ACTIVE',
            metrics: {
                create: [
                    {
                        name: 'Daily Steps',
                        unit: 'steps',
                        aggregationMethod: 'SUM',
                        scoringFrequency: 'DAILY',
                        maxPointsPerPeriod: 5,
                        scoringRules: {
                            create: [
                                { comparisonType: 'RANGE', minValue: 5000, maxValue: 9999, points: 1 },
                                { comparisonType: 'GREATER_THAN_EQUAL', minValue: 10000, points: 3 },
                                { comparisonType: 'GREATER_THAN_EQUAL', minValue: 15000, points: 5 }
                            ]
                        }
                    },
                    {
                        name: 'Workout Duration',
                        unit: 'minutes',
                        aggregationMethod: 'SUM',
                        scoringFrequency: 'WEEKLY',
                        maxPointsPerPeriod: 20,
                        scoringRules: {
                            create: [
                                { comparisonType: 'GREATER_THAN_EQUAL', minValue: 150, points: 10 },
                                { comparisonType: 'GREATER_THAN_EQUAL', minValue: 300, points: 20 }
                            ]
                        }
                    }
                ]
            }
        }
    })

    console.log('Seeded multi-metric challenge:', challenge.name)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
