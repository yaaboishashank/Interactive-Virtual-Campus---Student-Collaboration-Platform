import { Navigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import useAuth from "../../../hooks/useAuth";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const { user, loading } = useAuth();

  if (loading) return <p role="status">Checking session…</p>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>JOIN CAMPUSVERSE</p>
        <h1>Find your people.</h1>
        <p className={styles.description}>
          Create your account and start building your virtual campus.
        </p>

        <AuthForm mode="register" />
      </section>
    </main>
  );
}