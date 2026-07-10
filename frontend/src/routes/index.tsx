import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import TablesPage from '../pages/TablesPage';
import EmployeesPage from '../pages/EmployeesPage';
import ProductsPage from '../pages/ProductsPage';
import CategoriesPage from '../pages/CategoriesPage';
import BarrelsPage from '../pages/BarrelsPage';
import OrdersPage from '../pages/OrdersPage';
import NewOrderPage from '../pages/NewOrderPage';
import SalesPage from '../pages/SalesPage';
import NewSalePage from '../pages/NewSalePage';
import NewSalePage from '../pages/NewSalePage';
import InventoryPage from '../pages/InventoryPage';
import CashRegisterPage from '../pages/CashRegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/', element: <DashboardPage /> },
                    { path: '/dashboard', element: <DashboardPage /> },
                    { path: '/tables', element: <TablesPage /> },
                    { path: '/orders', element: <OrdersPage /> },
                    { path: '/orders/new', element: <NewOrderPage /> },
                ],
            },
        ],
    },
    {
        element: <ProtectedRoute allowedRoles={['admin', 'cajero']} />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/sales', element: <SalesPage /> },
                    { path: '/sales/new', element: <NewSalePage /> },
                    { path: '/sales/new', element: <NewSalePage /> },
                    { path: '/cash-register', element: <CashRegisterPage /> },
                    { path: '/inventory', element: <InventoryPage /> },
                ],
            },
        ],
    },
    {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/employees', element: <EmployeesPage /> },
                    { path: '/products', element: <ProductsPage /> },
                    { path: '/categories', element: <CategoriesPage /> },
                    { path: '/barrels', element: <BarrelsPage /> },
                ],
            },
        ],
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);

export default router;
