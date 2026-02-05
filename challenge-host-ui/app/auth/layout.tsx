import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-max-w-md text-center">
                <h1 className="text-3xl font-extrabold text-blue-600">Challenge App</h1>
                <p className="mt-2 text-sm text-gray-600">The ultimate platform for self-improvement.</p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
