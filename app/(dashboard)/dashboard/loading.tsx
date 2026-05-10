import { MoreHorizontal } from 'lucide-react'

export default function DashboardLoading() {
    return (
        <div className="space-y-8 animate-pulse max-w-7xl mx-auto">
            {/* Greeting Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 bg-gray-200 rounded-md w-48 mb-2" />
                    <div className="h-5 bg-surface rounded-md w-72" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-16 h-5 bg-surface rounded-md" />
                    <div className="w-9 h-9 bg-surface rounded-lg" />
                </div>
            </div>

            {/* KPI Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <div className="w-10 h-10 bg-surface rounded-xl mb-4" />
                        <div className="h-4 bg-surface rounded w-1/2 mb-2" />
                        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-surface rounded w-1/3" />
                    </div>
                ))}
            </div>

            {/* Performance Chart Skeleton */}
            <div className="bg-card p-8 rounded-2xl border border-card-border shadow-sm h-[320px]">
                <div className="flex justify-between mb-8">
                    <div>
                        <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
                        <div className="h-4 bg-surface rounded w-64" />
                    </div>
                </div>
                <div className="h-[200px] bg-surface rounded-xl w-full" />
            </div>

            {/* Bottom Grid Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {[1, 2].map(section => (
                    <div key={section} className="bg-card rounded-2xl border border-card-border shadow-sm">
                        <div className="p-6 border-b border-card-border">
                            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
                            <div className="h-4 bg-surface rounded w-48" />
                        </div>
                        <div className="divide-y divide-card-border">
                            {[1, 2, 3].map(item => (
                                <div key={item} className="flex items-center gap-4 p-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface shrink-0" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                                        <div className="h-3 bg-surface rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
