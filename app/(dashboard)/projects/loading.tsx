export default function ProjectsLoading() {
    return (
        <div className="space-y-8 animate-pulse max-w-7xl mx-auto py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-5 bg-surface rounded w-72" />
                </div>
                <div className="h-12 bg-purple-100 rounded-xl w-40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-card p-6 rounded-2xl border border-card-border shadow-sm h-48" />
                ))}
            </div>
        </div>
    )
}
