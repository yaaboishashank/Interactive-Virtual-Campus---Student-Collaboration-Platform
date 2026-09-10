import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button/Button";
import styles from "../landing.module.css";
import CoastalPreview from "./CoastalPreview";

export default function HeroSection() {
  return (
    <section className={styles.hero} id="home">
      <div className={styles.heroContent}>
        <span className={styles.eyebrow} data-hero-reveal>A virtual campus for students</span>
        <h1 data-hero-reveal>Your Campus,<br /><span>Reimagined<br />Online.</span></h1>
        <p data-hero-reveal>Create virtual campuses, join study rooms, explore interactive spaces, and connect with students in real time.</p>
        <div className={styles.heroActions} data-hero-reveal>
          <Button as={Link} variant="primary" to="/register">Enter Campus <ArrowUpRight size={18} aria-hidden="true" /></Button>
          <a className={styles.exploreLink} href="#features">Explore Features ↓</a>
        </div>
        <div className={styles.heroNote} data-hero-reveal>
          <span className={styles.sampleAvatars} aria-hidden="true"><i>S</i><i>A</i><i>H</i></span>
          <span>A shared world for your classmates.<small>Example avatars</small></span>
        </div>
      </div>
      <div className={styles.heroVisual}>
        <div className={styles.preview} data-hero-reveal>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}><strong>Coastal Clubhouse</strong><small>A little space by the sea</small></span>
            <span className={styles.previewStatus}>● Sample</span>
          </div>
          <CoastalPreview />
          <div className={styles.previewFooter}><span>Explore. Meet. Belong.</span><span>Sample illustration</span></div>
        </div>
        <div className={styles.chatPreview} data-hero-reveal>
          <div className={styles.chatHeading}><span className={styles.chatIcon}><MessageCircle size={18} aria-hidden="true" /></span><span><strong>Room conversation</strong><small>Example chat</small></span><span className={styles.previewStatus}>●</span></div>
          <div className={styles.sampleMessage}><strong>Aanya</strong>Study room after class?</div>
          <div className={`${styles.sampleMessage} ${styles.sampleOwn}`}><strong>You</strong>Meet you there!</div>
        </div>
      </div>
    </section>
  );
}
