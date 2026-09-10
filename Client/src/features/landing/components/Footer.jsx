import { ArrowUpRight, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button/Button";
import styles from "../landing.module.css";

const Footer = () => {
  return (
    <>
      <section className={styles.ctaSection}>
        <div>
          <span className={styles.eyebrow}>Your next chapter</span>
          <h2>Ready to Enter Your Virtual Campus?</h2>

          <p>
            Create a campus, invite your classmates, and start
            collaborating.
          </p>
        </div>

        <div className={styles.ctaActions}>
          <Button as={Link} variant="primary" to="/register">
            Create Free Account
            <ArrowUpRight size={18} aria-hidden="true" />
          </Button>

          <Button as={Link} to="/login">
            Log In
          </Button>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.brandLink}>
              <GraduationCap size={22} aria-hidden="true" />
              <strong>CampusVerse</strong>
            </Link>

            <p>
              A virtual home for student learning, collaboration,
              and conversation.
            </p>
          </div>

          <nav className={styles.footerLinks} aria-label="Footer">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#spaces">Spaces</a>
            <Link to="/login">Login</Link>
          </nav>
        </div>

        <div className={styles.copyright}>
          <span>© {new Date().getFullYear()} CampusVerse</span>
          <span>Built with MERN Stack and Socket.IO</span>
        </div>
      </footer>
    </>
  );
};

export default Footer;