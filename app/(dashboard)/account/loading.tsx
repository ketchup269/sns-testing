export default function AccountLoading() {
    return (
        <div className="space-y-8 animate-pulse max-w-7xl mx-auto py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-5 bg-surface rounded w-72" />
                </div>
                <div className="h-12 bg-purple-100 rounded-xl w-48" />
            </div>

            <div className="bg-card rounded-2xl border border-card-border shadow-sm p-8 max-w-3xl">
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-card-border bg-surface">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200" />
                                <div>
                                    <div className="h-5 bg-gray-200 rounded w-32 mb-1" />
                                    <div className="h-4 bg-surface rounded w-24" />
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
