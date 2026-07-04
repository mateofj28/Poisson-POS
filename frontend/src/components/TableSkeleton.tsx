import { useThemeStore } from '../store/theme.store';

interface TableSkeletonProps {
    rows?: number;
    cols?: number;
}

const TableSkeleton = ({ rows = 5, cols = 6 }: TableSkeletonProps) => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            {/* Header */}
            <div className={`flex gap-4 px-4 py-3 ${isDark ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className={`h-3 rounded-full animate-pulse flex-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, row) => (
                <div key={row} className={`flex gap-4 px-4 py-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    {Array.from({ length: cols }).map((_, col) => (
                        <div key={col} className={`h-3 rounded-full animate-pulse flex-1 ${isDark ? 'bg-zinc-800/60' : 'bg-zinc-100'}`} style={{ width: `${60 + Math.random() * 40}%` }}></div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TableSkeleton;
