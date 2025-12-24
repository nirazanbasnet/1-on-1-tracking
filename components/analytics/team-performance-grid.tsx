'use client';

import { TeamMemberSummary } from '@/lib/types/analytics';
import { useRouter } from 'next/navigation';

interface TeamPerformanceGridProps {
    members: TeamMemberSummary[];
}

export function TeamPerformanceGrid({ members }: TeamPerformanceGridProps) {
    const router = useRouter();

    const handleMemberClick = (memberId: string) => {
        // Navigate to developer specific view or filter
        router.push(`?developerId=${memberId}`);
    };

    return (
        <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Developer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rating
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Alignment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trend
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => (
                            <tr
                                key={member.developer_id}
                                onClick={() => handleMemberClick(member.developer_id)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {member.developer_name.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{member.developer_name}</div>
                                            <div className="text-sm text-gray-500">{member.developer_email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-semibold">
                                        {member.latest_developer_rating?.toFixed(1) || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`text-sm ${(member.latest_alignment || 0) > 0.8 ? 'text-green-600' : 'text-yellow-600'
                                        }`}>
                                        {member.latest_alignment ? `${(member.latest_alignment * 100).toFixed(0)}%` : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${(member.action_items_completion_rate || 0) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {((member.action_items_completion_rate || 0) * 100).toFixed(0)}%
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.trend === 'up' ? 'bg-green-100 text-green-800' :
                                            member.trend === 'down' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {member.trend?.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
