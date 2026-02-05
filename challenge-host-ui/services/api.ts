import { User, Challenge, Participant, ActivityLog, LeaderboardEntry, AuthResponse } from '../types';

const DELAY = 800;

const mockUsers: User[] = [
    { id: '1', email: 'user@example.com', name: 'Joe Participant', role: 'USER', isVerified: true, isActive: true },
    { id: '2', email: 'org@example.com', name: 'Alice Organizer', role: 'ORGANIZER', isVerified: true, isActive: true },
    { id: '3', email: 'admin@example.com', name: 'Bob Admin', role: 'ADMIN', isVerified: true, isActive: true },
];

const mockChallenges: Challenge[] = [
    {
        id: 'c1',
        title: '30 Day Cardio Blast',
        description: 'Get your heart rate up every day for 30 days! Target: 30 minutes of cardio.',
        organizerId: '2',
        organizerName: 'Alice Organizer',
        startDate: '2026-02-01',
        endDate: '2026-03-01',
        status: 'ACTIVE',
        metrics: ['minutes'],
        scoringBrackets: [{ min: 30, max: 60, points: 10, label: 'Standard' }],
        loggingFrequency: 'DAILY',
        approvalRequired: false,
        isLeaderboardVisible: true,
        participantCount: 45,
    },
    {
        id: 'c2',
        title: 'Reading Marathon',
        description: 'Read 500 pages this month.',
        organizerId: '2',
        organizerName: 'Alice Organizer',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        status: 'UPCOMING',
        metrics: ['pages'],
        scoringBrackets: [{ min: 1, max: 100, points: 1, label: 'Per Page' }],
        loggingFrequency: 'ANYTIME',
        approvalRequired: true,
        isLeaderboardVisible: true,
        participantCount: 12,
    },
];

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
        const user = mockUsers.find(u => u.email === email);
        if (!user) throw new Error('Invalid credentials');
        return { token: 'mock-jwt-token', user };
    },
    me: async (): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockUsers[0]; // Default mock user
    }
};

export const challengeService = {
    getChallenges: async (): Promise<Challenge[]> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
        return mockChallenges;
    },
    getChallengeById: async (id: string): Promise<Challenge> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
        const challenge = mockChallenges.find(c => c.id === id);
        if (!challenge) throw new Error('Challenge not found');
        return challenge;
    },
    createChallenge: async (challenge: Partial<Challenge>): Promise<Challenge> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
        const newChallenge: Challenge = {
            id: Math.random().toString(36).substr(2, 9),
            title: challenge.title || '',
            description: challenge.description || '',
            organizerId: '2',
            organizerName: 'Alice Organizer',
            startDate: challenge.startDate || '',
            endDate: challenge.endDate || '',
            status: 'UPCOMING',
            metrics: challenge.metrics || [],
            scoringBrackets: challenge.scoringBrackets || [],
            loggingFrequency: challenge.loggingFrequency || 'DAILY',
            approvalRequired: challenge.approvalRequired || false,
            isLeaderboardVisible: true,
            participantCount: 0,
        };
        mockChallenges.push(newChallenge);
        return newChallenge;
    },
    joinChallenge: async (challengeId: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
    }
};

export const participantService = {
    getParticipants: async (challengeId: string): Promise<Participant[]> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
        return [
            { userId: '1', userName: 'Joe Participant', userEmail: 'user@example.com', challengeId, status: 'APPROVED', joinedAt: '2026-02-01', progress: 0.4 },
            { userId: '4', userName: 'Sarah Runner', userEmail: 'sarah@example.com', challengeId, status: 'PENDING', joinedAt: '2026-02-02', progress: 0 },
        ];
    },
    approveParticipant: async (challengeId: string, userId: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
    }
};

export const logService = {
    submitLog: async (log: Partial<ActivityLog>): Promise<ActivityLog> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
        return {
            id: Math.random().toString(36).substr(2, 9),
            userId: '1',
            challengeId: log.challengeId || '',
            date: new Date().toISOString(),
            value: log.value || 0,
            metric: log.metric || '',
            pointsEarned: 10,
        };
    }
};

export const leaderboardService = {
    getLeaderboard: async (challengeId: string): Promise<LeaderboardEntry[]> => {
        await new Promise(resolve => setTimeout(resolve, DELAY));
        return [
            { userId: '1', userName: 'Joe Participant', rank: 1, totalPoints: 120, totalValue: 360 },
            { userId: '5', userName: 'Mike Swift', rank: 2, totalPoints: 110, totalValue: 330 },
            { userId: '6', userName: 'Emma Peak', rank: 3, totalPoints: 95, totalValue: 285 },
        ];
    }
};
