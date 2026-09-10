import { Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import ProtectedRoute from "../routes/ProtectedRoute";
import LandingPage from "../features/landing/pages/LandingPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import CampusDetailsPage from "../features/campus/pages/CampusDetailsPage";
import InvitePage from "../features/campus/pages/InvitePage";
import RoomPage from "../features/rooms/pages/RoomPage";
import ProfilePage from "../features/profile/pages/ProfilePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route
            path="dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="profile"
            element={<ProfilePage />}
          />

          <Route
            path="campuses/:campusId"
            element={<CampusDetailsPage />}
          />

          <Route
            path="rooms/:roomId"
            element={<RoomPage />}
          />

          <Route
            path="invite/:inviteCode"
            element={<InvitePage />}
          />
        </Route>

        <Route
          path="*"
          element={<p>Page not found.</p>}
        />
      </Route>
    </Routes>
  );
}