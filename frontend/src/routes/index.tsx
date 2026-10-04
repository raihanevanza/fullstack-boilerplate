import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import RequireAuth from '@/features/auth/RequireAuth';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ProductListPage from '@/pages/products/ProductListPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductListPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
