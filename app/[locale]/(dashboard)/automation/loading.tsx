export default function AutomationLoading() {
    return (
        <div className="space-y-8 animate-pulse max-w-3xl mx-auto py-4">
            <div>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-5 bg-surface rounded w-64" />
            </div>

            <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-card-border">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-4 bg-surface rounded w-64" />
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                        <div className="h-12 bg-surface rounded-xl w-full" />
                    </div>
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                        <div className="h-12 bg-surface rounded-xl w-full" />
                    </div>
                </div>
            </div>
            
            <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-card-border">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
                </div>
                <div className="p-6">
                    <div className="h-12 bg-surface rounded-xl w-full" />
                </div>
            </div>
        </div>
    )
}
