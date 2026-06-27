import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, Chip, Spinner } from '@heroui/react';
import { dashboardService } from '../services/dashboard.service';
import { useAuthStore } from '../store/auth.store';

const DashboardPage = () => {
    const { employee } = useAuthStore();
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-medium text-white">
                    Buenos días, {employee?.first_name || 'Usuario'}
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2">
                <button className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium">Overview</button>
                <button className="px-4 py-1.5 rounded-full text-zinc-400 text-sm font-medium hover:text-white transition-colors">Ventas</button>
                <button className="px-4 py-1.5 rounded-full text-zinc-400 text-sm font-medium hover:text-white transition-colors">Inventario</button>
            </div>

            {/* Main Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ventas Hoy */}
                <Card className="bg-[#18181b] border-none shadow-none">
                    <CardContent className="p-4">
                        <p className="text-xs text-zinc-500 mb-2">Ventas Hoy</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-white">${data?.total_sales_today?.toLocaleString() || 0}</span>
                            <span className="text-xs text-emerald-400 font-medium">↑ hoy</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Pedidos Hoy */}
                <Card className="bg-[#18181b] border-none shadow-none">
                    <CardContent className="p-4">
                        <p className="text-xs text-zinc-500 mb-2">Pedidos</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-white">{data?.total_orders_today || 0}</span>
                            <span className="text-xs text-emerald-400 font-medium">↑ activos</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Mesas */}
                <Card className="bg-[#18181b] border-none shadow-none">
                    <CardContent className="p-4">
                        <p className="text-xs text-zinc-500 mb-2">Mesas</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-white">{data?.occupied_tables || 0}<span className="text-zinc-500 text-base font-normal">/{totalTables}</span></span>
                            <span className="text-xs text-amber-400 font-medium">↑ {occupancyPercent}%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Mesas Libres */}
                <Card className="bg-[#18181b] border-none shadow-none">
                    <CardContent className="p-4">
                        <p className="text-xs text-zinc-500 mb-2">Disponibles</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-white">{data?.free_tables || 0}</span>
                            <span className="text-xs text-emerald-400 font-medium">↑ libres</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sales Performance style card */}
                <Card className="bg-[#18181b] border-none shadow-none">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-5">
                            <p className="text-sm font-medium text-white">Estado de Inventario</p>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <div>
                                <p className="text-xl font-semibold text-red-400">{data?.out_of_stock_products || 0}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Sin Stock</p>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-amber-400">{data?.low_stock_products || 0}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Bajo Stock</p>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-white">{(data?.out_of_stock_products || 0) + (data?.low_stock_products || 0)}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Total Alertas</p>
                            </div>
                        </div>

                        {/* Mini bar chart visual */}
                        <div className="flex items-end gap-1.5 h-16">
                            {[40, 65, 30, 80, 55, 70, 45, 90, 60, 35, 75, 50].map((h, i) => (
                                <div key={i} className="flex-1 bg-blue-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right card - Summary */}
                <Card className="bg-[#18181b] border-none shadow-none">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-5">
                            <p className="text-sm font-medium text-white">Resumen del Día</p>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                <span className="text-xs text-zinc-500">Vendedor</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                <span className="text-xs text-zinc-500">Caja</span>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Best Seller */}
                            <div>
                                <p className="text-2xl font-semibold text-white">{data?.best_seller_today || 'Sin ventas'}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Producto más vendido hoy</p>
                                {data?.best_seller_quantity ? (
                                    <span className="text-xs text-purple-400 font-medium">{data.best_seller_quantity} unidades</span>
                                ) : null}
                            </div>

                            <div className="h-px bg-zinc-800"></div>

                            {/* Cash Register */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">Estado de Caja</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Caja registradora</p>
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
