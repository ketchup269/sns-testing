export default function AnalyticsLoading() {
    return (
        <div className="space-y-8 animate-pulse max-w-7xl mx-auto py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-5 bg-surface rounded w-72" />
                </div>
                <div className="h-10 bg-surface rounded-lg w-32" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-card p-6 rounded-2xl border border-card-border shadow-sm h-32" />
                ))}
            </div>

            <div className="bg-card p-8 rounded-2xl border border-card-border shadow-sm h-[400px]" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm h-[300px]" />
                <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm h-[300px]" />
            </div>
        </div>
    )
}
