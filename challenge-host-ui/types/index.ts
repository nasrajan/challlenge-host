export type UserRole = 'USER' | 'ORGANIZER' | 'ADMIN';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    isVerified: boolean;
    isActive: boolean;
}

export type ChallengeStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    organizerId: string;
    organizerName: string;
    startDate: string;
    endDate: string;
    status: ChallengeStatus;
    metrics: string[]; // e.g., "steps", "pages", "workout_mins"
    scoringBrackets: ScoringBracket[];
    loggingFrequency: 'DAILY' | 'WEEKLY' | 'ANYTIME';
    approvalRequired: boolean;
    isLeaderboardVisible: boolean;
    participantCount: number;
    imageUrl?: string;
}

export interface ScoringBracket {
    min: number;
    max: number;
    points: number;
    label: string;
}

export interface Participant {
    userId: string;
    userName: string;
    userEmail: string;
    challengeId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    joinedAt: string;
    progress: number;
}

export interface ActivityLog {
    id: string;
    userId: string;
    challengeId: string;
    date: string;
    value: number; // e.g., 10000 steps
    metric: string;
    notes?: string;
    pointsEarned: number;
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    avatarUrl?: string;
    rank: number;
    totalPoints: number;
    totalValue: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}
