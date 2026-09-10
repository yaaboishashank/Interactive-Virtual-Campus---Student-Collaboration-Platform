import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { authUrl } from "../lib/authRedirect";

export default function ProtectedRoute() {
  const { user, loading, sessionError } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p role="status">Checking your session…</p>;
  }

  if (sessionError) {
    return <p role="alert">{sessionError}</p>;
  }

  if (!user) {
    return (
      <Navigate
        to={authUrl("login", location.pathname)}
        replace
      />
    );
  }

  return <Outlet />;
}