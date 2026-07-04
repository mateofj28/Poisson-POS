import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Chip, Spinner } from '@heroui/react';
import { dashboardService } from '../services/dashboard.service';
import { inventoryService } from '../services/inventory.service';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import CardSkeleton from '../components/CardSkeleton';

const DashboardPage = () => {
    const { employee } = useAuthStore();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardService.getDashboard,
        refetchInterval: 5000,
    });

    const { data: lowStockProducts } = useQuery({
        queryKey: ['low-stock-dashboard'],
        queryFn: () => inventoryService.getLowStock(),
        refetchInterval: 5000,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className={`h-6 w-48 rounded-full animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                <CardSkeleton count={4} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-xl p-5 h-48 animate-pulse ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}></div>
                    <div className={`rounded-xl p-5 h-48 animate-pulse ${isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]'}`}></div>
                </div>
            </div>
        );
    }

    const totalTables = (data?.occupied_tables || 0) + (data?.free_tables || 0);
    const occupancyPercent = totalTables > 0 ? Math.round(((data?.occupied_tables || 0) / totalTables) * 100) : 0;

    const cardBg = isDark ? 'bg-[#18181b]' : 'bg-[#f4f4f5]';
    const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
    const textSecondary = isDark ? 'text-zinc-500' : 'text-zinc-500';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className={`text-xl font-medium ${textPrimary}`}>
                    Buenos días, {employee?.first_name || 'Usuario'}
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2">
                <button className={`px-4 py-1.5 rounded-full text-sm font-medium ${isDark ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}>Overview</button>
                <button className={`px-4 py-1.5 rounded-full text-sm font-medium ${textSecondary} hover:${textPrimary} transition-colors`}>Ventas</button>
                <button className={`px-4 py-1.5 rounded-full text-sm font-medium ${textSecondary} hover:${textPrimary} transition-colors`}>Inventario</button>
            </div>

            {/* Main Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className={`${cardBg} border-none shadow-none`}>
                    <CardContent className="p-4">
                        <p className={`text-xs ${textSecondary} mb-2`}>Ventas Hoy</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-semibold ${textPrimary}`}>${data?.total_sales_today?.toLocaleString() || 0}</span>
                            <span className="text-xs text-emerald-400 font-medium">↑ hoy</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${cardBg} border-none shadow-none`}>
                    <CardContent className="p-4">
                        <p className={`text-xs ${textSecondary} mb-2`}>Pedidos</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-semibold ${textPrimary}`}>{data?.total_orders_today || 0}</span>
                            <span className="text-xs text-emerald-400 font-medium">↑ activos</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${cardBg} border-none shadow-none`}>
                    <CardContent className="p-4">
                        <p className={`text-xs ${textSecondary} mb-2`}>Mesas</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-semibold ${textPrimary}`}>{data?.occupied_tables || 0}<span className={`text-base font-normal ${textSecondary}`}>/{totalTables}</span></span>
                            <span className="text-xs text-amber-400 font-medium">↑ {occupancyPercent}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${cardBg} border-none shadow-none`}>
                    <CardContent className="p-4">
                        <p className={`text-xs ${textSecondary} mb-2`}>Disponibles</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-semibold ${textPrimary}`}>{data?.free_tables || 0}</span>
                            <span className="text-xs text-emerald-400 font-medium">↑ libres</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className={`${cardBg} border-none shadow-none`}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className={`text-sm font-medium ${textPrimary}`}>Alertas de Inventario</p>
                            <Chip size="sm" color={lowStockProducts && lowStockProducts.length > 0 ? 'danger' : 'success'} variant="flat">
                                {lowStockProducts?.length || 0} alertas
                            </Chip>
                        </div>

                        {lowStockProducts && lowStockProducts.length > 0 ? (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                                {lowStockProducts.slice(0, 8).map((p) => (
                                    <div key={p.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${isDark ? 'bg-zinc-800/40' : 'bg-zinc-100/80'}`}>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${textPrimary}`}>{p.name}</p>
                                            <p className={`text-xs ${textSecondary}`}>{p.category_name || 'Sin categoría'}</p>
                                        </div>
                                        <div className="text-right ml-3">
                                            <p className={`text-sm font-bold ${p.stock <= 0 ? 'text-red-400' : 'text-amber-400'}`}>
                                                {p.stock}
                                            </p>
                                            <p className={`text-[10px] ${textSecondary}`}>
                                                {p.stock <= 0 ? 'Agotado' : `Mín: ${p.min_stock}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`text-center py-6 ${textSecondary}`}>
                                <p className="text-2xl mb-1">✓</p>
                                <p className="text-sm">Todo el inventario está en orden</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={`${cardBg} border-none shadow-none`}>
                    <CardContent className="p-5">
                        <p className={`text-sm font-medium mb-4 ${textPrimary}`}>Estado Operativo</p>

                        <div className="space-y-4">
                            {/* Caja */}
                            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-zinc-800/40' : 'bg-zinc-100/80'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${data?.active_cash_register ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${data?.active_cash_register ? 'text-emerald-400' : 'text-red-400'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${textPrimary}`}>Caja Registradora</p>
                                        <p className={`text-xs ${textSecondary}`}>{data?.active_cash_register ? 'Lista para operar' : 'Debes abrirla para vender'}</p>
                                    </div>
                                </div>
                                <Chip color={data?.active_cash_register ? 'success' : 'danger'} size="sm" variant="flat">
                                    {data?.active_cash_register ? 'Abierta' : 'Cerrada'}
                                </Chip>
                            </div>

                            {/* Best seller */}
                            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-zinc-800/40' : 'bg-zinc-100/80'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${textPrimary}`}>{data?.best_seller_today || 'Sin ventas aún'}</p>
                                        <p className={`text-xs ${textSecondary}`}>Más vendido hoy</p>
                                    </div>
                                </div>
                                {data?.best_seller_quantity ? (
                                    <span className={`text-sm font-bold ${textPrimary}`}>{data.best_seller_quantity} uds</span>
                                ) : (
                                    <span className={`text-xs ${textSecondary}`}>—</span>
                                )}
                            </div>

                            {/* Tables summary */}
                            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-zinc-800/40' : 'bg-zinc-100/80'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${textPrimary}`}>{data?.occupied_tables || 0} mesas atendiendo</p>
                                        <p className={`text-xs ${textSecondary}`}>{data?.free_tables || 0} disponibles de {(data?.occupied_tables || 0) + (data?.free_tables || 0)}</p>
                                    </div>
                                </div>
                                <Chip color={data?.occupied_tables && data.occupied_tables > 0 ? 'warning' : 'success'} size="sm" variant="flat">
                                    {data?.occupied_tables && data.occupied_tables > 0 ? 'Activas' : 'Libres'}
                                </Chip>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
