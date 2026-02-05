'use client';

import React, { useEffect, useState } from 'react';
import { challengeService } from '@/services/api';
import { Challenge } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Trophy, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

export default function ChallengesPage() {
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

    return (
        <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Discover Challenges</h1>
                    <p className="text-gray-600">Find the perfect challenge to level up your life.</p>
                </div>
                <Link href="/challenges/create">
                    <Button variant="primary">Create Your Own</Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search challenges..."
                        className="w-full pl-10 pr-4 h-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            {/* Challenge Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map(challenge => (
                        <Card key={challenge.id} className="group hover:border-blue-200 transition-colors">
                            <div className="aspect-video bg-gray-100 relative">
                                <div className="absolute top-3 left-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${challenge.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {challenge.status}
                                    </span>
                                </div>
                                {challenge.imageUrl ? (
                                    <img src={challenge.imageUrl} alt={challenge.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Trophy className="h-12 w-12" />
                                    </div>
                                )}
                            </div>
                            <CardHeader>
                                <CardTitle className="group-hover:text-blue-600 transition-colors">{challenge.title}</CardTitle>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{challenge.description}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {new Date(challenge.startDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="mr-1 h-3 w-3" />
                                        {challenge.participantCount} joined
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/challenges/${challenge.id}`} className="w-full">
                                    <Button variant="outline" className="w-full group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        View Details
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
