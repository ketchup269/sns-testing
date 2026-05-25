export default function WorkflowLoading() {
    return (
        <div className="space-y-8 animate-pulse max-w-7xl mx-auto py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-5 bg-surface rounded w-72" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-32 bg-surface rounded-xl" />
                    <div className="h-10 w-10 bg-surface rounded-xl" />
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-card-border flex gap-4">
                    <div className="h-8 bg-surface rounded w-1/4" />
                    <div className="h-8 bg-surface rounded w-1/4" />
                </div>
                <div className="divide-y divide-card-border">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="p-4 flex gap-6">
                            <div className="w-16 h-16 rounded-xl bg-surface shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-surface rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
