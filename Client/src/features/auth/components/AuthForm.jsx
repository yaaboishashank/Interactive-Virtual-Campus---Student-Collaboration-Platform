import { useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Button from "../../../components/ui/Button/Button";
import Input from "../../../components/ui/Input/Input";
import useAuth from "../../../hooks/useAuth";
import {
  authUrl,
  getReturnTo,
} from "../../../lib/authRedirect";
import { registerUser } from "../auth.api";
import styles from "../auth.module.css";

export default function AuthForm({ mode = "login" }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const returnTo = getReturnTo(location.search);

  const pendingRef = useRef(false);
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (pendingRef.current) return;

    if (isRegister && !values.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setError("");

    const credentials = {
      email: values.email.trim(),
      password: values.password,
    };

    try {
      if (isRegister) {
        await registerUser({
          ...credentials,
          name: values.name.trim(),
        });

        navigate(authUrl("login", returnTo), {
          replace: true,
          state: {
            message: "Account created! Ab login karo.",
          },
        });

        return;
      }

      await login(credentials);
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          (requestError.response
            ? "Request failed. Please try again."
            : "Server se connect nahi hua. Backend check karo.")
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-busy={pending}
    >
      {isRegister && (
        <Input
          id="register-name"
          label="Full name"
          name="name"
          value={values.name}
          onChange={handleChange}
          autoComplete="name"
          maxLength={80}
          required
          disabled={pending}
        />
      )}

      <Input
        id={`${mode}-email`}
        label="Email address"
        type="email"
        name="email"
        value={values.email}
        onChange={handleChange}
        autoComplete="email"
        required
        disabled={pending}
      />

      <Input
        id={`${mode}-password`}
        label="Password"
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
        autoComplete={
          isRegister ? "new-password" : "current-password"
        }
        minLength={isRegister ? 8 : undefined}
        required
        disabled={pending}
      />

      {isRegister && (
        <p className={styles.hint}>
          Use at least 8 characters.
        </p>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={pending}
      >
        {pending
          ? "Please wait…"
          : isRegister
            ? "Create account →"
            : "Enter CampusVerse →"}
      </Button>

      <p className={styles.switchText}>
        {isRegister
          ? "Already have an account? "
          : "New to CampusVerse? "}

        <Link
          to={authUrl(
            isRegister ? "login" : "register",
            returnTo
          )}
        >
          {isRegister ? "Log in" : "Create account"}
        </Link>
      </p>
    </form>
  );
}