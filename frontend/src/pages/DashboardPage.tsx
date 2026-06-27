import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Chip, Spinner } from '@heroui/react';
import { dashboardService } from '../services/dashboard.service';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';

const DashboardPage = () => {
    const { employee } = useAuthStore();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardService.getDashboard,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
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
                        <div className="flex items-center justify-between mb-5">
                            <p className={`text-sm font-medium ${textPrimary}`}>Estado de Inventario</p>
                        </div>
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <div>
                                <p className="text-xl font-semibold text-red-400">{data?.out_of_stock_products || 0}</p>
                                <p className={`text-xs ${textSecondary} mt-0.5`}>Sin Stock</p>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-amber-400">{data?.low_stock_products || 0}</p>
                                <p className={`text-xs ${textSecondary} mt-0.5`}>Bajo Stock</p>
                            </div>
                            <div>
                                <p className={`text-xl font-semibold ${textPrimary}`}>{(data?.out_of_stock_products || 0) + (data?.low_stock_products || 0)}</p>
                                <p className={`text-xs ${textSecondary} mt-0.5`}>Total Alertas</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-1.5 h-16">
                            {[40, 65, 30, 80, 55, 70, 45, 90, 60, 35, 75, 50].map((h, i) => (
                                <div key={i} className="flex-1 bg-blue-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
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
