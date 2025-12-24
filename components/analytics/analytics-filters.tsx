'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface AnalyticsFiltersProps {
    role: 'admin' | 'manager' | 'developer';
    teams?: { id: string; name: string }[];
    developers?: { id: string; name: string }[];
}

export function AnalyticsFilters({ role, teams = [], developers = [] }: AnalyticsFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleTimeRangeChange = (value: string) => {
        router.push(`?${createQueryString('timeRange', value)}`);
    };

    const handleTeamChange = (value: string) => {
        router.push(`?${createQueryString('teamId', value)}`);
    };

    const currentRange = searchParams.get('timeRange') || '6m';
    const currentTeam = searchParams.get('teamId') || '';
    // developerId handling can be added if needed for manager view deeper drill down

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center mb-6">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    {['3m', '6m', '12m'].map((range) => (
                        <button
                            key={range}
                            onClick={() => handleTimeRangeChange(range)}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${currentRange === range
                                    ? 'bg-white text-blue-600 shadow-sm font-medium'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {range.replace('m', ' Months')}
                        </button>
                    ))}
                </div>
            </div>

            {(role === 'admin' || role === 'manager') && teams.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Team:</span>
                    <select
                        value={currentTeam}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="block w-full rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                    >
                        <option value="">All Teams</option>
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
