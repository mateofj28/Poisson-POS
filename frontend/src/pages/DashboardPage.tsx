import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Chip, Spinner } from '@heroui/react';
import { dashboardService } from '../services/dashboard.service';

const DashboardPage = () => {
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

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ventas Hoy */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div>
                                <CardDescription>Ventas Hoy</CardDescription>
                                <CardTitle className="text-2xl">${data?.total_sales_today?.toLocaleString() || 0}</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Pedidos Hoy */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                            </div>
                            <div>
                                <CardDescription>Pedidos Hoy</CardDescription>
                                <CardTitle className="text-2xl">{data?.total_orders_today || 0}</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Mesas Ocupadas */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                </svg>
                            </div>
                            <div>
                                <CardDescription>Mesas Ocupadas</CardDescription>
                                <CardTitle className="text-2xl">{data?.occupied_tables || 0} / {(data?.occupied_tables || 0) + (data?.free_tables || 0)}</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Mesas Libres */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div>
                                <CardDescription>Mesas Libres</CardDescription>
                                <CardTitle className="text-2xl">{data?.free_tables || 0}</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sin Stock */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <div>
                                <CardDescription>Sin Stock</CardDescription>
                                <CardTitle className="text-2xl text-red-400">{data?.out_of_stock_products || 0}</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Bajo Stock */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                </svg>
                            </div>
                            <div>
                                <CardDescription>Bajo Stock</CardDescription>
                                <CardTitle className="text-2xl text-yellow-400">{data?.low_stock_products || 0}</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Mejor Vendedor */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                </svg>
                            </div>
                            <div>
                                <CardDescription>Mejor Vendedor Hoy</CardDescription>
                                <CardTitle className="text-lg">{data?.best_seller_today || 'N/A'}</CardTitle>
                                {data?.best_seller_quantity ? (
                                    <Chip color="primary" size="sm" className="mt-1">{data.best_seller_quantity} uds.</Chip>
                                ) : null}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Estado Caja */}
                <Card className="bg-zinc-900/60 border border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data?.active_cash_register ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${data?.active_cash_register ? 'text-green-400' : 'text-red-400'}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                                </svg>
                            </div>
                            <div>
                                <CardDescription>Estado de Caja</CardDescription>
                                <Chip
                                    color={data?.active_cash_register ? 'success' : 'danger'}
                                    size="sm"
                                    className="mt-1"
                                >
                                    {data?.active_cash_register ? 'Abierta' : 'Cerrada'}
                                </Chip>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
