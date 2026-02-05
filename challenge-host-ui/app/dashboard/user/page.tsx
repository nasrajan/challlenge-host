'use client';

import React, { useEffect, useState } from 'react';
import { challengeService } from '@/services/api';
import { Challenge } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboard() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await challengeService.getChallenges();
                setChallenges(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const activeJoined = challenges.filter(c => c.status === 'ACTIVE');

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-gray-600">Here&apos;s what&apos;s happening with your challenges today.</p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-600 text-white border-none">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Points Earned</p>
                                <h3 className="text-3xl font-bold mt-1">1,240</h3>
                            </div>
                            <Trophy className="h-8 w-8 text-blue-200" />
                        </div>
                        <div className="mt-4 flex items-center text-sm text-blue-100">
                            <span className="bg-blue-500 px-2 py-0.5 rounded mr-2">+15%</span>
                            vs last week
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Active Challenges</p>
                                <h3 className="text-3xl font-bold mt-1">{activeJoined.length}</h3>
                            </div>
                            <Activity className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            {activeJoined.length > 0 ? 'Keep it up!' : 'Time to join one!'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Logging Streak</p>
                                <h3 className="text-3xl font-bold mt-1">5 Days</h3>
                            </div>
                            <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            Next log due tomorrow
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Challenges */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Your Active Challenges</h2>
                    <Link href="/challenges" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
                        View all <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(i => (
                            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : activeJoined.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeJoined.map(challenge => (
                            <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                                        <span>Progress: 60%</span>
                                        <span>Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }} />
                                    </div>
                                    <Link href={`/challenges/${challenge.id}`}>
                                        <Button variant="outline" className="w-full">Open Dashboard</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="py-12 text-center">
                        <CardContent>
                            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">You haven&apos;t joined any active challenges yet.</p>
                            <Button className="mt-4" variant="primary">Discover Challenges</Button>
                        </CardContent>
                    </Card>
                )}
            </section>
        </div>
    );
}
