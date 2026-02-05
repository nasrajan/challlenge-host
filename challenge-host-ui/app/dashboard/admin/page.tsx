'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, ShieldAlert, MoreVertical, Check, X } from 'lucide-react';

export default function AdminDashboard() {
    const users = [
        { id: '1', name: 'Joe Participant', email: 'user@example.com', role: 'USER', status: 'Active' },
        { id: '2', name: 'Alice Organizer', email: 'org@example.com', role: 'ORGANIZER', status: 'Active' },
        { id: '3', name: 'Bob Admin', email: 'admin@example.com', role: 'ADMIN', status: 'Active' },
        { id: '4', name: 'Bad Actor', email: 'spam@spam.com', role: 'USER', status: 'Deactivated' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
                <p className="text-gray-600">Global overview and user management.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Users', value: '1,280', icon: Users, color: 'blue' },
                    { label: 'Total Challenges', value: '45', icon: Trophy, color: 'green' },
                    { label: 'Active Logs', value: '8.4k', icon: ShieldAlert, color: 'orange' },
                    { label: 'Pending Approvals', value: '12', icon: ShieldAlert, color: 'red' },
                ].map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <stat.icon className={`h-8 w-8 text-${stat.color}-500 opacity-20`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>User Management</CardTitle>
                    <Button variant="outline" size="sm">Export Users</Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 font-semibold text-gray-700">Name</th>
                                    <th className="py-3 font-semibold text-gray-700">Role</th>
                                    <th className="py-3 font-semibold text-gray-700">Status</th>
                                    <th className="py-3 font-semibold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                        <td className="py-4">
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-gray-500 text-xs">{user.email}</div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 text-gray-600">
                                            <div className="flex items-center">
                                                <div className={`h-2 w-2 rounded-full mr-2 ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {user.status}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button className="p-1 hover:bg-gray-100 rounded">
                                                <MoreVertical className="h-4 w-4 text-gray-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
