'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { challengeService } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, ChevronLeft, Check, Target, Calendar, Info, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';

const STEPS = [
    { id: 1, title: 'Basics', icon: Info },
    { id: 2, title: 'Schedule', icon: Calendar },
    { id: 3, title: 'Scoring', icon: Target },
    { id: 4, title: 'Review', icon: ShieldCheck },
];

export default function CreateChallengePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        metric: '',
        scoringLabel: 'Standard',
        points: 10,
        loggingFrequency: 'DAILY',
        approvalRequired: false,
    });

    const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        try {
            const challenge = await challengeService.createChallenge({
                ...formData,
                metrics: [formData.metric],
                scoringBrackets: [{ min: 0, max: 1000000, points: Number(formData.points), label: formData.scoringLabel }],
                loggingFrequency: formData.loggingFrequency as any,
            });
            router.push(`/challenges/${challenge.id}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between px-4">
                {STEPS.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                step >= s.id ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-400"
                            )}>
                                {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                            </div>
                            <span className={cn(
                                "text-xs font-medium mt-2",
                                step >= s.id ? "text-blue-600" : "text-gray-400"
                            )}>{s.title}</span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={cn("flex-1 h-0.5 mx-2", step > s.id ? "bg-blue-600" : "bg-gray-200")} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Challenge</CardTitle>
                    <p className="text-sm text-gray-500">Step {step} of 4: {STEPS[step - 1].title}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <Input
                                label="Challenge Title"
                                placeholder="e.g. 10k Steps Daily"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 text-sm">Description</label>
                                <textarea
                                    className="w-full min-h-[120px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="What is this challenge about?"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                                <Input
                                    label="End Date"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Logging Frequency</label>
                                <select
                                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                                    value={formData.loggingFrequency}
                                    onChange={e => setFormData({ ...formData, loggingFrequency: e.target.value })}
                                >
                                    <option value="DAILY">Once per day</option>
                                    <option value="WEEKLY">Once per week</option>
                                    <option value="ANYTIME">Anytime</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <Input
                                label="Primary Metric"
                                placeholder="e.g. Steps, Pages, Minutes"
                                value={formData.metric}
                                onChange={e => setFormData({ ...formData, metric: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Scoring Label"
                                    placeholder="e.g. Completed"
                                    value={formData.scoringLabel}
                                    onChange={e => setFormData({ ...formData, scoringLabel: e.target.value })}
                                />
                                <Input
                                    label="Points per Log"
                                    type="number"
                                    value={formData.points}
                                    onChange={e => setFormData({ ...formData, points: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                <p><strong>Title:</strong> {formData.title}</p>
                                <p><strong>Schedule:</strong> {formData.startDate} to {formData.endDate}</p>
                                <p><strong>Metric:</strong> {formData.metric} ({formData.points} pts / log)</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="approval"
                                    checked={formData.approvalRequired}
                                    onChange={e => setFormData({ ...formData, approvalRequired: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="approval" className="text-sm text-gray-700 font-medium">Require approval for participants to join</label>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <Button variant="ghost" onClick={prevStep} disabled={step === 1}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    {step < 4 ? (
                        <Button onClick={nextStep}>
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={handleSubmit}>
                            Launch Challenge
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
