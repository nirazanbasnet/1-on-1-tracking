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
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-900">Team Performance</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Developer
                            </th>
                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Rating
                            </th>
                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Alignment
                            </th>
                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Action Items
                            </th>
                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Trend
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {members.map((member) => (
                            <tr
                                key={member.developer_id}
                                onClick={() => handleMemberClick(member.developer_id)}
                                className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                            >
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                            {member.developer_name.charAt(0)}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{member.developer_name}</div>
                                            <div className="text-xs text-gray-500">{member.developer_email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-medium">
                                        {member.latest_developer_rating?.toFixed(1) || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className={`text-sm font-medium ${(member.latest_alignment || 0) > 0.8 ? 'text-green-600' : 'text-amber-600'
                                        }`}>
                                        {member.latest_alignment ? `${(member.latest_alignment * 100).toFixed(0)}%` : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full"
                                                style={{ width: `${(member.action_items_completion_rate || 0) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">
                                            {((member.action_items_completion_rate || 0) * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold uppercase tracking-wide rounded-full ${member.trend === 'up' ? 'bg-green-50 text-green-700 border border-green-100' :
                                        member.trend === 'down' ? 'bg-red-50 text-red-700 border border-red-100' :
                                            'bg-gray-50 text-gray-600 border border-gray-200'
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
