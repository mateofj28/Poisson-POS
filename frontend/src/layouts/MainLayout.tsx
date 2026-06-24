import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    useMediaQuery,
    useTheme,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Stack,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    TableBar as TableBarIcon,
    People as PeopleIcon,
    Inventory as InventoryIcon,
    Category as CategoryIcon,
    LocalBar as LocalBarIcon,
    Receipt as ReceiptIcon,
    PointOfSale as PointOfSaleIcon,
    MoveToInbox as MoveToInboxIcon,
    ShoppingCart as ShoppingCartIcon,
    Logout as LogoutIcon,
    MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';

const DRAWER_WIDTH = 260;

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    roles?: string[];
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Mesas', path: '/tables', icon: <TableBarIcon /> },
    { label: 'Pedidos', path: '/orders', icon: <ShoppingCartIcon /> },
    { label: 'Ventas', path: '/sales', icon: <PointOfSaleIcon />, roles: ['admin', 'cajero'] },
    { label: 'Caja', path: '/cash-register', icon: <ReceiptIcon />, roles: ['admin', 'cajero'] },
    { label: 'Inventario', path: '/inventory', icon: <MoveToInboxIcon />, roles: ['admin', 'cajero'] },
    { label: 'Productos', path: '/products', icon: <InventoryIcon />, roles: ['admin'] },
    { label: 'Categorías', path: '/categories', icon: <CategoryIcon />, roles: ['admin'] },
    { label: 'Barriles', path: '/barrels', icon: <LocalBarIcon />, roles: ['admin'] },
    { label: 'Empleados', path: '/employees', icon: <PeopleIcon />, roles: ['admin'] },
];

const MainLayout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { employee, setEmployee, logout, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && !employee) {
            authService.getMe().then(setEmployee).catch(() => logout());
        }
    }, [isAuthenticated, employee, setEmployee, logout]);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleNavClick = (path: string) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleLogout = () => {
        setAnchorEl(null);
        authService.logout();
        logout();
        navigate('/login');
    };

    const filteredNavItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return employee && item.roles.includes(employee.role);
    });

    // For bottom nav: show first 4 items + "More"
    const bottomNavItems = filteredNavItems.slice(0, 4);
    const moreNavItems = filteredNavItems.slice(4);

    const currentBottomIndex = bottomNavItems.findIndex((item) => location.pathname === item.path);
    const isInMoreSection = moreNavItems.some((item) => location.pathname === item.path);

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-0.02em' }}>
                    🐟 Poisson POS
                </Typography>
            </Box>
            <Divider />
            <List sx={{ flex: 1, px: 1, py: 1.5 }}>
                {filteredNavItems.map((item) => (
                    <ListItemButton
                        key={item.path}
                        onClick={() => handleNavClick(item.path)}
                        selected={location.pathname === item.path}
                    >
                        <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                                fontWeight: location.pathname === item.path ? 600 : 400,
                                color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                            }}
                        />
                    </ListItemButton>
                ))}
            </List>

            {/* User section at bottom of sidebar */}
            <Divider />
            <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            bgcolor: 'primary.main',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                        }}
                    >
                        {employee?.first_name?.[0] || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {employee ? `${employee.first_name} ${employee.last_name}` : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {employee?.role?.toUpperCase()}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleLogout}>
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Top AppBar - mobile only */}
            {isMobile && (
                <AppBar
                    position="fixed"
                    sx={{
                        backgroundColor: 'rgba(22, 22, 24, 0.72)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                        borderBottom: '1px solid rgba(84, 84, 88, 0.36)',
                        boxShadow: 'none',
                    }}
                >
                    <Toolbar sx={{ minHeight: '56px !important' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, letterSpacing: '-0.01em' }}>
                            Poisson POS
                        </Typography>
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'primary.main',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                }}
                            >
                                {employee?.first_name?.[0] || 'U'}
                            </Avatar>
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                            <MenuItem disabled>
                                <Typography variant="body2">{employee?.first_name} — {employee?.role?.toUpperCase()}</Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                                Cerrar sesión
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>
            )}

            {/* Desktop AppBar */}
            {!isMobile && (
                <AppBar
                    position="fixed"
                    sx={{
                        width: `calc(100% - ${DRAWER_WIDTH}px)`,
                        ml: `${DRAWER_WIDTH}px`,
                        backgroundColor: 'rgba(22, 22, 24, 0.72)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                        borderBottom: '1px solid rgba(84, 84, 88, 0.36)',
                        boxShadow: 'none',
                    }}
                >
                    <Toolbar sx={{ minHeight: '56px !important' }}>
                        <Box sx={{ flex: 1 }} />
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Typography variant="body2" color="text.secondary">
                                {employee ? `${employee.first_name} ${employee.last_name}` : ''}
                            </Typography>
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: 'primary.main',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {employee?.first_name?.[0] || 'U'}
                                </Avatar>
                            </IconButton>
                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                                <MenuItem disabled>
                                    <Typography variant="body2">{employee?.role?.toUpperCase()}</Typography>
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout}>
                                    <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                                    Cerrar sesión
                                </MenuItem>
                            </Menu>
                        </Stack>
                    </Toolbar>
                </AppBar>
            )}

            {/* Desktop Sidebar */}
            {!isMobile && (
                <Box component="nav" sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
                    <Drawer
                        variant="permanent"
                        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
                        open
                    >
                        {drawer}
                    </Drawer>
                </Box>
            )}

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 3 },
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    pb: { xs: '100px', md: 3 },
                }}
            >
                <Toolbar sx={{ minHeight: '56px !important' }} />
                <Outlet />
            </Box>

            {/* iOS-style Bottom Tab Bar - mobile only */}
            {isMobile && (
                <Paper
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1200,
                        backgroundColor: 'rgba(22, 22, 24, 0.78)',
                        backdropFilter: 'blur(50px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(50px) saturate(200%)',
                        borderTop: '1px solid rgba(84, 84, 88, 0.36)',
                        borderRadius: 0,
                        pb: 'env(safe-area-inset-bottom, 0px)',
                    }}
                    elevation={0}
                >
                    <BottomNavigation
                        value={isInMoreSection ? 4 : currentBottomIndex}
                        onChange={(_, newValue) => {
                            if (newValue < bottomNavItems.length) {
                                navigate(bottomNavItems[newValue].path);
                            }
                        }}
                        sx={{
                            backgroundColor: 'transparent',
                            height: 64,
                            '& .MuiBottomNavigationAction-root': {
                                color: 'rgba(235, 235, 245, 0.45)',
                                minWidth: 'auto',
                                padding: '6px 0',
                                gap: '2px',
                                transition: 'color 0.2s ease',
                                '&.Mui-selected': {
                                    color: '#0A84FF',
                                },
                                '& .MuiBottomNavigationAction-label': {
                                    fontSize: '0.65rem',
                                    fontWeight: 500,
                                    marginTop: '2px',
                                    '&.Mui-selected': {
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                    },
                                },
                                '& .MuiSvgIcon-root': {
                                    fontSize: '1.4rem',
                                },
                            },
                        }}
                        showLabels
                    >
                        {bottomNavItems.map((item) => (
                            <BottomNavigationAction
                                key={item.path}
                                label={item.label}
                                icon={item.icon}
                            />
                        ))}
                        {moreNavItems.length > 0 && (
                            <BottomNavigationAction
                                label="Más"
                                icon={<MoreHorizIcon />}
                                onClick={(e) => setMoreAnchor(e.currentTarget)}
                            />
                        )}
                    </BottomNavigation>

                    {/* More menu */}
                    <Menu
                        anchorEl={moreAnchor}
                        open={Boolean(moreAnchor)}
                        onClose={() => setMoreAnchor(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        slotProps={{
                            paper: {
                                sx: {
                                    mb: 2,
                                    minWidth: 200,
                                },
                            },
                        }}
                    >
                        {moreNavItems.map((item) => (
                            <MenuItem
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setMoreAnchor(null);
                                }}
                                selected={location.pathname === item.path}
                            >
                                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: location.pathname === item.path ? 600 : 400,
                                    }}
                                />
                            </MenuItem>
                        ))}
                    </Menu>
                </Paper>
            )}
        </Box>
    );
};

export default MainLayout;
