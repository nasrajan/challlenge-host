'use client';

import React, { useEffect, useState } from 'react';
import { challengeService, participantService } from '@/services/api';
import { Challenge, Participant } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings, Plus, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrganizerDashboard() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await challengeService.getChallenges();
                // Mocking "my" challenges (where I am organizer)
                setChallenges(data.filter(c => c.organizerId === '2'));

                // Mocking pending across all my challenges
                const allParticipants = await Promise.all(
                    data.map(c => participantService.getParticipants(c.id))
                );
                setPendingParticipants(allParticipants.flat().filter(p => p.status === 'PENDING'));
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organizer Dashboard</h1>
                    <p className="text-gray-600">Manage your challenges and participants.</p>
                </div>
                <Link href="/challenges/create">
                    <Button variant="primary">
                        <Plus className="mr-2 h-4 w-4" /> Create Challenge
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Managed Challenges */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center">
                        <Settings className="mr-2 h-5 w-5 text-gray-400" /> Your Challenges
                    </h2>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />)}
                        </div>
                    ) : challenges.length > 0 ? (
                        <div className="space-y-4">
                            {challenges.map(challenge => (
                                <Card key={challenge.id}>
                                    <CardContent className="py-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {challenge.participantCount} participants • Starts {new Date(challenge.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Link href={`/challenges/${challenge.id}`}>
                                                <Button variant="ghost" size="sm">Stats</Button>
                                            </Link>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center text-gray-500">
                            You haven&apos;t created any challenges yet.
                        </Card>
                    )}
                </div>

                {/* Pending Requests */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center">
                        <Users className="mr-2 h-5 w-5 text-gray-400" /> Pending Requests
                    </h2>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />)}
                        </div>
                    ) : pendingParticipants.length > 0 ? (
                        <div className="space-y-4">
                            {pendingParticipants.map(p => (
                                <Card key={`${p.challengeId}-${p.userId}`}>
                                    <CardContent className="py-3 px-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900">{p.userName}</span>
                                            <span className="text-xs text-gray-500">{new Date(p.joinedAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-3 truncate">Wants to join: Cardio Blast</p>
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs text-green-600 border-green-200 hover:bg-green-50">
                                                <CheckCircle className="mr-1 h-3 w-3" /> Approve
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs text-red-600 border-red-200 hover:bg-red-50">
                                                <XCircle className="mr-1 h-3 w-3" /> Reject
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center text-sm text-gray-500">
                            No pending requests.
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
