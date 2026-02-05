'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { challengeService, logService, leaderboardService } from '@/services/api';
import { Challenge, LeaderboardEntry } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Calendar, Users, Target, CheckCircle2, Activity, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function ChallengeDetailPage() {
    const { challengeId } = useParams();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [logValue, setLogValue] = useState('');
    const [isLogging, setIsLogging] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [challengeData, leaderboardData] = await Promise.all([
                    challengeService.getChallengeById(challengeId as string),
                    leaderboardService.getLeaderboard(challengeId as string),
                ]);
                setChallenge(challengeData);
                setLeaderboard(leaderboardData);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [challengeId]);

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLogging(true);
        try {
            await logService.submitLog({
                challengeId: challengeId as string,
                value: Number(logValue),
                metric: challenge?.metrics[0],
            });
            setLogValue('');
            // Refresh leaderboard or show success
            alert('Activity logged successfully!');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLogging(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading challenge...</div>;
    if (!challenge) return <div className="p-8 text-center text-red-500">Challenge not found.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-sm font-medium text-blue-600 mb-2">
                        <span className="bg-blue-100 px-2 py-0.5 rounded uppercase">{challenge.status}</span>
                        <span>Created by {challenge.organizerName}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{challenge.title}</h1>
                    <p className="text-gray-600 mt-2 max-w-2xl">{challenge.description}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline">Invite Friends</Button>
                    <Button variant="primary">Share Progress</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Logging */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-4 flex items-center space-x-4">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Duration</p>
                                    <p className="text-sm font-medium">30 Days</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4 flex items-center space-x-4">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Participants</p>
                                    <p className="text-sm font-medium">{challenge.participantCount}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4 flex items-center space-x-4">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Goal</p>
                                    <p className="text-sm font-medium">30 mins / day</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Logging Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                                Log Your Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogSubmit} className="flex gap-4">
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        value={logValue}
                                        onChange={(e) => setLogValue(e.target.value)}
                                        placeholder={`Enter ${challenge.metrics[0]}...`}
                                        required
                                    />
                                </div>
                                <Button type="submit" isLoading={isLogging}>Log Result</Button>
                            </form>
                            <div className="mt-4 flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-2" />
                                Next log window closes in 4 hours
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Feed / Progress (Placeholder) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Progress History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100">
                                        <div className="flex items-center">
                                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium">35 minutes cardio</p>
                                                <p className="text-xs text-gray-500">Feb {i}, 2026</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-blue-600">+10 pts</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Leaderboard */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Leaderboard</span>
                                <Trophy className="h-5 w-5 text-yellow-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {leaderboard.map((entry) => (
                                    <div key={entry.userId} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className={cn(
                                                "w-6 text-sm font-bold",
                                                entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-gray-400" : entry.rank === 3 ? "text-orange-400" : "text-gray-400"
                                            )}>
                                                #{entry.rank}
                                            </span>
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                                                {entry.userName.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{entry.userName}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{entry.totalPoints} pts</p>
                                            <p className="text-xs text-gray-500">{entry.totalValue} {challenge.metrics[0]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full mt-6 text-sm text-blue-600">View Full Leaderboard</Button>
                        </CardContent>
                    </Card>

                    {/* Challenge Rules */}
                    <Card className="bg-gray-50 border-none">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-gray-500">Scoring Rules</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm">
                                {challenge.scoringBrackets.map((bracket, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="font-medium">{bracket.label}</span>
                                        <span className="text-blue-600 font-bold">{bracket.points} pts / log</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
