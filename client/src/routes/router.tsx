import { Navigate, Route, Routes } from 'react-router-dom';
import { ActivityLogsPage } from '@/features/activity-logs/ActivityLogsPage';
import { AppShell } from '@/components/shared/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProfilePage } from '@/features/auth/ProfilePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LocationsPage } from '@/features/locations/LocationsPage';
import { FeedbackPage } from '@/features/maintenance/feedback/FeedbackPage';
import { CalendarPage } from '@/features/maintenance/calendar/CalendarPage';
import { NewRequestPage } from '@/features/maintenance/requests/NewRequestPage';
import { RequestDetailPage } from '@/features/maintenance/requests/RequestDetailPage';
import { RequestQueuePage } from '@/features/maintenance/requests/RequestQueuePage';
import { RequestsListPage } from '@/features/maintenance/requests/RequestsListPage';
import { TechniciansPage } from '@/features/maintenance/technicians/TechniciansPage';
import { PreventivePlansPage } from '@/features/maintenance/preventive/PreventivePlansPage';
import { WorkOrderDetailPage } from '@/features/maintenance/work-orders/WorkOrderDetailPage';
import { WorkOrdersPage } from '@/features/maintenance/work-orders/WorkOrdersPage';
import { AllReportsPage } from '@/features/lost-found/items/AllReportsPage';
import { BrowseItemsPage } from '@/features/lost-found/items/BrowseItemsPage';
import { ItemDetailPage } from '@/features/lost-found/items/ItemDetailPage';
import { MyReportsPage } from '@/features/lost-found/items/MyReportsPage';
import { ReportItemPage } from '@/features/lost-found/items/ReportItemPage';
import { ClaimDetailPage } from '@/features/lost-found/claims/ClaimDetailPage';
import { ClaimsPage } from '@/features/lost-found/claims/ClaimsPage';
import { HandoversPage } from '@/features/lost-found/claims/HandoversPage';
import { SubmitClaimPage } from '@/features/lost-found/claims/SubmitClaimPage';
import { MatchSuggestionsPage } from '@/features/lost-found/matches/MatchSuggestionsPage';
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
            <Route path="activity-logs" element={<ActivityLogsPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_MANAGER', 'SUPER_ADMIN']} />
            }
          >
            <Route path="technicians" element={<TechniciansPage />} />
            <Route path="maintenance/feedback" element={<FeedbackPage />} />
            <Route path="maintenance/preventive" element={<PreventivePlansPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={['MAINTENANCE_MANAGER', 'SUPER_ADMIN', 'TECHNICIAN']}
              />
            }
          >
            <Route path="work-orders" element={<WorkOrdersPage />} />
            <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
            <Route path="maintenance/calendar" element={<CalendarPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['STUDENT_EMPLOYEE']} />}>
            <Route path="maintenance/requests/new" element={<NewRequestPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={['STUDENT_EMPLOYEE', 'LOST_FOUND_OFFICER']} />
            }
          >
            <Route path="lost-found/report" element={<ReportItemPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['STUDENT_EMPLOYEE']} />}>
            <Route path="lost-found/my-reports" element={<MyReportsPage />} />
            <Route path="lost-found/claims/new" element={<SubmitClaimPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={['STUDENT_EMPLOYEE', 'LOST_FOUND_OFFICER']} />
            }
          >
            <Route path="lost-found/claims" element={<ClaimsPage />} />
            <Route path="lost-found/claims/:id" element={<ClaimDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['LOST_FOUND_OFFICER']} />}>
            <Route path="lost-found/matches" element={<MatchSuggestionsPage />} />
            <Route path="lost-found/handovers" element={<HandoversPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={['LOST_FOUND_OFFICER', 'SUPER_ADMIN']} />
            }
          >
            <Route path="lost-found/items" element={<AllReportsPage />} />
          </Route>

          <Route path="lost-found" element={<BrowseItemsPage />} />
          <Route path="lost-found/items/:id" element={<ItemDetailPage />} />

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
