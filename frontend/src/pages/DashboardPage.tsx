import { Box, Grid, Card, CardContent, Typography, CircularProgress, Chip } from '@mui/material';
import {
    AttachMoney,
    TableBar,
    Inventory,
    TrendingUp,
    PointOfSale,
    Warning,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

const DashboardPage = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardService.getDashboard,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    const cards = [
        {
            title: 'Ventas Hoy',
            value: `$${data?.total_sales_today?.toLocaleString() || 0}`,
            icon: <AttachMoney sx={{ fontSize: 40 }} />,
            color: '#4CAF50',
        },
        {
            title: 'Pedidos Hoy',
            value: data?.total_orders_today || 0,
            icon: <PointOfSale sx={{ fontSize: 40 }} />,
            color: '#2196F3',
        },
        {
            title: 'Mesas Ocupadas',
            value: `${data?.occupied_tables || 0} / ${(data?.occupied_tables || 0) + (data?.free_tables || 0)}`,
            icon: <TableBar sx={{ fontSize: 40 }} />,
            color: '#FF9800',
        },
        {
            title: 'Mesas Libres',
            value: data?.free_tables || 0,
            icon: <TableBar sx={{ fontSize: 40 }} />,
            color: '#4CAF50',
        },
        {
            title: 'Sin Stock',
            value: data?.out_of_stock_products || 0,
            icon: <Warning sx={{ fontSize: 40 }} />,
            color: '#F44336',
        },
        {
            title: 'Bajo Stock',
            value: data?.low_stock_products || 0,
            icon: <Inventory sx={{ fontSize: 40 }} />,
            color: '#FFC107',
        },
    ];

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                {cards.map((card) => (
                    <Grid item xs={12} sm={6} md={4} key={card.title}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ color: card.color }}>{card.icon}</Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {card.title}
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        {card.value}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {/* Best seller */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ color: '#9C27B0' }}>
                                <TrendingUp sx={{ fontSize: 40 }} />
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Mejor Vendedor Hoy
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {data?.best_seller_today || 'N/A'}
                                </Typography>
                                {data?.best_seller_quantity ? (
                                    <Chip label={`${data.best_seller_quantity} uds.`} size="small" color="primary" />
                                ) : null}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Cash register status */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ color: data?.active_cash_register ? '#4CAF50' : '#F44336' }}>
                                <PointOfSale sx={{ fontSize: 40 }} />
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Estado de Caja
                                </Typography>
                                <Chip
                                    label={data?.active_cash_register ? 'Abierta' : 'Cerrada'}
                                    color={data?.active_cash_register ? 'success' : 'error'}
                                    size="small"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
