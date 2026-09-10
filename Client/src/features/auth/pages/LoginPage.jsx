import { Navigate, useLocation } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import useAuth from "../../../hooks/useAuth";
import { getReturnTo } from "../../../lib/authRedirect";
import styles from "../auth.module.css";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const returnTo = getReturnTo(location.search);

  if (loading) {
    return <p role="status">Checking session…</p>;
  }

  if (user) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>CAMPUSVERSE</p>
        <h1>Welcome back.</h1>
        <p className={styles.description}>
          Your campus, classmates and conversations await.
        </p>

        {location.state?.message && (
          <p className={styles.success} role="status">
            {location.state.message}
          </p>
        )}

        <AuthForm />
      </section>
    </main>
  );
}