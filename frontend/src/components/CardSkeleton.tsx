import { useThemeStore } from '../store/theme.store';

interface CardSkeletonProps {
    count?: number;
}

const CardSkeleton = ({ count = 4 }: CardSkeletonProps) => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`rounded-xl p-5 animate-pulse ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}>
                    <div className={`h-3 w-20 rounded-full mb-3 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                    <div className={`h-6 w-32 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                </div>
            ))}
        </div>
    );
};

export default CardSkeleton;
