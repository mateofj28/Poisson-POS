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
        refetchInterval: 30000,
    });

    const { data: lowStockProducts } = useQuery({
        queryKey: ['low-stock-dashboard'],
        queryFn: () => inventoryService.getLowStock(),
        refetchInterval: 60000,
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
                        <div className="flex items-center justify-between mb-5">
                            <p className={`text-sm font-medium ${textPrimary}`}>Resumen del Día</p>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                <span className={`text-xs ${textSecondary}`}>Vendedor</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                <span className={`text-xs ${textSecondary}`}>Caja</span>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <p className={`text-2xl font-semibold ${textPrimary}`}>{data?.best_seller_today || 'Sin ventas'}</p>
                                <p className={`text-xs ${textSecondary} mt-0.5`}>Producto más vendido hoy</p>
                                {data?.best_seller_quantity ? (
                                    <span className="text-xs text-purple-400 font-medium">{data.best_seller_quantity} unidades</span>
                                ) : null}
                            </div>
                            <div className={`h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${textPrimary}`}>Estado de Caja</p>
                                    <p className={`text-xs ${textSecondary} mt-0.5`}>Caja registradora</p>
                                </div>
                                <Chip
                                    color={data?.active_cash_register ? 'success' : 'danger'}
                                    size="sm"
                                    variant="flat"
                                >
                                    {data?.active_cash_register ? 'Abierta' : 'Cerrada'}
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
