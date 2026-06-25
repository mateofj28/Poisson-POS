import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Chip, Spinner } from '@heroui/react';
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
                <div>
                    <h1 className="text-2xl font-semibold text-white">
                        Buenos días, {employee?.first_name || 'Usuario'}
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">Resumen operativo del día</p>
                </div>
                <Chip color="primary" size="sm" variant="flat">
                    🔄 Auto-refresh 30s
                </Chip>
            </div>

            {/* Main Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ventas Hoy */}
                <Card className="bg-zinc-900/70 border border-zinc-800/80">
                    <CardContent className="p-5">
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Ventas Hoy</p>
                        <div className="flex items-end justify-between mt-2">
                            <span className="text-2xl font-bold text-white">${data?.total_sales_today?.toLocaleString() || 0}</span>
                            <Chip color="success" size="sm" variant="flat" className="text-xs">
                                ↑ activo
                            </Chip>
                        </div>
                    </CardContent>
                </Card>

                {/* Pedidos Hoy */}
                <Card className="bg-zinc-900/70 border border-zinc-800/80">
                    <CardContent className="p-5">
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Pedidos Hoy</p>
                        <div className="flex items-end justify-between mt-2">
                            <span className="text-2xl font-bold text-white">{data?.total_orders_today || 0}</span>
                            <Chip color="primary" size="sm" variant="flat" className="text-xs">
                                pedidos
                            </Chip>
                        </div>
                    </CardContent>
                </Card>

                {/* Mesas Ocupadas */}
                <Card className="bg-zinc-900/70 border border-zinc-800/80">
                    <CardContent className="p-5">
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Mesas</p>
                        <div className="flex items-end justify-between mt-2">
                            <span className="text-2xl font-bold text-white">{data?.occupied_tables || 0}<span className="text-base text-zinc-500 font-normal">/{totalTables}</span></span>
                            <Chip color="warning" size="sm" variant="flat" className="text-xs">
                                {occupancyPercent}% ocupación
                            </Chip>
                        </div>
                    </CardContent>
                </Card>

                {/* Mesas Libres */}
                <Card className="bg-zinc-900/70 border border-zinc-800/80">
                    <CardContent className="p-5">
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Mesas Libres</p>
                        <div className="flex items-end justify-between mt-2">
                            <span className="text-2xl font-bold text-white">{data?.free_tables || 0}</span>
                            <Chip color="success" size="sm" variant="flat" className="text-xs">
                                disponibles
                            </Chip>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row - Performance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Inventario Overview */}
                <Card className="bg-zinc-900/70 border border-zinc-800/80">
                    <CardHeader className="px-5 pt-5 pb-0">
                        <div className="flex items-center justify-between w-full">
                            <CardTitle className="text-base">Estado de Inventario</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-zinc-500">Sin Stock</p>
                                <p className="text-xl font-bold text-red-400">{data?.out_of_stock_products || 0}</p>
                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((data?.out_of_stock_products || 0) * 10, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-zinc-500">Bajo Stock</p>
                                <p className="text-xl font-bold text-yellow-400">{data?.low_stock_products || 0}</p>
                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min((data?.low_stock_products || 0) * 10, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Best Seller & Cash Register */}
                <Card className="bg-zinc-900/70 border border-zinc-800/80">
                    <CardHeader className="px-5 pt-5 pb-0">
                        <div className="flex items-center justify-between w-full">
                            <CardTitle className="text-base">Resumen Rápido</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="space-y-4">
                            {/* Best Seller */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500">Mejor Vendedor Hoy</p>
                                        <p className="text-sm font-semibold text-white">{data?.best_seller_today || 'Sin ventas'}</p>
                                    </div>
                                </div>
                                {data?.best_seller_quantity ? (
                                    <Chip color="secondary" size="sm" variant="flat">{data.best_seller_quantity} uds</Chip>
                                ) : null}
                            </div>

                            <div className="h-px bg-zinc-800"></div>

                            {/* Cash Register */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${data?.active_cash_register ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${data?.active_cash_register ? 'text-green-400' : 'text-red-400'}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500">Estado de Caja</p>
                                        <p className="text-sm font-semibold text-white">{data?.active_cash_register ? 'Caja Abierta' : 'Caja Cerrada'}</p>
                                    </div>
                                </div>
                                <Chip
                                    color={data?.active_cash_register ? 'success' : 'danger'}
                                    size="sm"
                                    variant="dot"
                                >
                                    {data?.active_cash_register ? 'Activa' : 'Inactiva'}
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
