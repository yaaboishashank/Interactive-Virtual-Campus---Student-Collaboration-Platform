import {
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getCurrentUser,
  loginUser,
} from "../features/auth/auth.api";
import api from "../lib/axiosInstance";

export const AuthContext = createContext(null);

const TOKEN_KEY = "campusverse-token";
const PROFILE_SIGNAL = "campusverse-profile-updated";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const requestVersion = useRef(0);

  useEffect(() => {
    let active = true;

    async function restoreSession(showLoading = false) {
      const version = ++requestVersion.current;
      const token = localStorage.getItem(TOKEN_KEY);

      if (showLoading) setLoading(true);

      if (!token) {
        setUser(null);
        setSessionError("");
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();

        if (
          !active ||
          version !== requestVersion.current ||
          token !== localStorage.getItem(TOKEN_KEY)
        ) {
          return;
        }

        if (!data?.user) {
          throw new Error("User response missing.");
        }

        setUser(data.user);
        setSessionError("");
      } catch (error) {
        if (!active || version !== requestVersion.current) return;

        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setSessionError("");
        } else {
          setSessionError(
            "Session check nahi ho paya. Backend check karke page refresh karo."
          );
        }
      } finally {
        if (active && version === requestVersion.current) {
          setLoading(false);
        }
      }
    }

    function handleStorage(event) {
      if (event.key === TOKEN_KEY || event.key === null) {
        restoreSession(true);
      } else if (event.key === PROFILE_SIGNAL) {
        restoreSession(false);
      }
    }

    restoreSession(true);
    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      requestVersion.current += 1;
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  async function login(values) {
    const version = ++requestVersion.current;
    const data = await loginUser(values);

    if (!data.token || !data.user) {
      throw new Error("Login response mein token ya user missing hai.");
    }

    if (version !== requestVersion.current) {
      throw new Error("Session changed. Please try again.");
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    setSessionError("");
    setLoading(false);
    setUser(data.user);

    return data.user;
  }

  async function saveProfile(values) {
    const token = localStorage.getItem(TOKEN_KEY);
    const version = ++requestVersion.current;

    const { data } = await api.patch("/auth/me", values);

    if (
      version !== requestVersion.current ||
      token !== localStorage.getItem(TOKEN_KEY)
    ) {
      throw new Error("Session changed. Please reopen your profile.");
    }

    if (!data?.user?._id && !data?.user?.id) {
      throw new Error("Updated profile response missing.");
    }

    setUser(data.user);
    setSessionError("");

    // Storage events notify other tabs on the same browser origin.
    try {
      localStorage.setItem(
        PROFILE_SIGNAL,
        JSON.stringify({
          userId: data.user._id || data.user.id,
          time: Date.now(),
          nonce: Math.random(),
        })
      );
    } catch {
      // The profile is already saved even if tab notification fails.
    }

    return data.user;
  }

  function logout() {
    requestVersion.current += 1;
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setLoading(false);
    setSessionError("");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        login,
        logout,
        saveProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}