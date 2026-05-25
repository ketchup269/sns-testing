export default function Loading() {
    return (
        <div className="w-full h-full flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-text animate-pulse">読み込み中...</p>
            </div>
        </div>
    )
}
