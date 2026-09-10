import { useEffect, useRef, useState } from "react";
import { GraduationCap, Menu, X } from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import styles from "./Navbar.module.css";
import Avatar from "../../../features/profile/components/Avatar";

const sections = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "spaces", label: "Spaces" },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const isHome = pathname === "/";

  // New page par top; landing hash par requested section.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const section =
        pathname === "/" && hash
          ? document.getElementById(hash.slice(1))
          : null;

      if (section) {
        const offset = headerRef.current?.offsetHeight || 80;

        window.scrollTo({
          top: Math.max(
            0,
            window.scrollY +
            section.getBoundingClientRect().top -
            offset -
            16
          ),
          behavior: "instant",
        });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);

  // Scroll ke according active underline.
  useEffect(() => {
    if (!isHome) return;

    let frame;

    function updateSection() {
      const marker = (headerRef.current?.offsetHeight || 80) + 40;
      let current = "home";

      for (const { id } of sections) {
        const element = document.getElementById(id);

        if (element && element.getBoundingClientRect().top <= marker) {
          current = id;
        }
      }

      setActiveSection(current);
    }

    function scheduleUpdate() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateSection);
    }

    updateSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isHome]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function handleSectionClick(event, id) {
    setMenuOpen(false);

    if (!isHome) return;

    event.preventDefault();

    const section = document.getElementById(id);
    if (!section) return;

    const offset = headerRef.current?.offsetHeight || 80;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: Math.max(
        0,
        window.scrollY +
        section.getBoundingClientRect().top -
        offset -
        16
      ),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <header className={styles.header} ref={headerRef}>
      <nav className={styles.navbar} aria-label="Main navigation">
        <Link
          to="/"
          className={styles.brand}
          onClick={() => setMenuOpen(false)}
        >
          <span className={styles.logo}>
            <GraduationCap size={22} aria-hidden="true" />
          </span>
          <span>CampusVerse</span>
        </Link>

        <div className={styles.theme}>
          <ThemeToggle />
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-controls="campus-navigation"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div
          id="campus-navigation"
          className={`${styles.panel} ${menuOpen ? styles.panelOpen : ""
            }`}
        >
          <div className={styles.links}>
            {isHome ? (
              sections.map(({ id, label }) => (
                <Link
                  key={id}
                  to={`/#${id}`}
                  onClick={(event) => handleSectionClick(event, id)}
                  className={`${styles.navLink} ${activeSection === id ? styles.active : ""
                    }`}
                  aria-current={
                    activeSection === id ? "location" : undefined
                  }
                >
                  {label}
                </Link>
              ))
            ) : (
              <Link
                to="/"
                className={styles.navLink}
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
            )}
          </div>

          <div className={styles.auth}>
            {loading ? (
              <span className={styles.session} role="status">
                Checking session…
              </span>
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`${styles.navLink} ${pathname === "/dashboard" ? styles.active : ""
                    }`}
                  aria-current={
                    pathname === "/dashboard" ? "page" : undefined
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>

                <Link
                  to="/profile"
                  className={styles.username}
                  title={`Profile: ${user.name}`}
                  aria-label={`Edit profile for ${user.name}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Avatar avatar={user.avatar} size={36} />

                  <span className={styles.usernameText}>
                    {user.name}
                  </span>
                </Link>

                <button
                  type="button"
                  className={styles.action}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={styles.action}
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className={`${styles.action} ${styles.primary}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}