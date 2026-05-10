export default function CreateLoading() {
    return (
        <div className="space-y-8 animate-pulse max-w-7xl mx-auto py-8">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[400px] bg-card rounded-2xl border border-card-border shadow-sm p-6" />
                <div className="h-[400px] bg-card rounded-2xl border border-card-border shadow-sm p-6" />
            </div>
        </div>
    )
}
