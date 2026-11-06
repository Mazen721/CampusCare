import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shared/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProfilePage } from '@/features/auth/ProfilePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LocationsPage } from '@/features/locations/LocationsPage';
import { NewRequestPage } from '@/features/maintenance/requests/NewRequestPage';
import { RequestDetailPage } from '@/features/maintenance/requests/RequestDetailPage';
import { RequestQueuePage } from '@/features/maintenance/requests/RequestQueuePage';
import { RequestsListPage } from '@/features/maintenance/requests/RequestsListPage';
import { UsersPage } from '@/features/users/UsersPage';
import { ForbiddenPage } from '@/routes/ForbiddenPage';
import { NotFoundPage } from '@/routes/NotFoundPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="forbidden" element={<ForbiddenPage />} />

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="locations" element={<LocationsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['STUDENT_EMPLOYEE']} />}>
            <Route path="maintenance/requests/new" element={<NewRequestPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={['STUDENT_EMPLOYEE', 'MAINTENANCE_MANAGER', 'SUPER_ADMIN']}
              />
            }
          >
            <Route path="maintenance/requests" element={<RequestsListPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['MAINTENANCE_MANAGER']} />}>
            <Route path="maintenance/request-queue" element={<RequestQueuePage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'STUDENT_EMPLOYEE',
                  'MAINTENANCE_MANAGER',
                  'SUPER_ADMIN',
                  'TECHNICIAN',
                ]}
              />
            }
          >
            <Route path="maintenance/requests/:id" element={<RequestDetailPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
