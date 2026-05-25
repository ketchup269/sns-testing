export default function CalendarLoading() {
    return (
        <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="h-8 bg-gray-200 rounded w-64" />
                <div className="h-10 bg-surface rounded-xl w-48" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="bg-card rounded-2xl border border-card-border shadow-sm min-h-[400px]">
                        <div className="p-4 border-b border-card-border h-20" />
                        <div className="p-3 space-y-3">
                            <div className="w-full bg-surface rounded-xl h-24" />
                            <div className="w-full bg-surface rounded-xl h-24" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
