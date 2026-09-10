import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import HowItWorksSection from "../components/HowItWorksSection";
import SpacesSection from "../components/SpacesSection";
import Footer from "../components/Footer";
import styles from "../landing.module.css";

const questions = [
  {
    question: "How do I join a campus?",
    answer:
      "Create an account, log in, and enter the invite code shared by your classmate.",
  },
  {
    question: "Are voice and video calls included?",
    answer:
      "The initial version focuses on room text chat. Voice and video are planned as optional future additions.",
  },
  {
    question: "Can I use CampusVerse on my phone?",
    answer:
      "Account and dashboard screens are responsive. The interactive campus map is designed primarily for desktop.",
  },
];

const LandingPage = () => {
  const pageRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-hero-reveal]", {
        y: 24, opacity: 0, duration: .85, stagger: .09,
        ease: "power3.out", clearProps: "opacity,transform",
      });
      // Keep below-fold content visible before its reveal; no hidden-content dependency.
      pageRef.current.querySelectorAll("section:not(#home) article, details").forEach((element) => {
        gsap.from(element, {
          y: 22, duration: .7, ease: "power2.out", clearProps: "transform",
          scrollTrigger: { trigger: element, start: "top 94%", once: true },
        });
      });
    }, pageRef);
    return () => media.revert();
  }, []);

  return (
    <main className={styles.page} ref={pageRef}>
      <div className={styles.container}>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SpacesSection />

        <section className={`${styles.section} ${styles.faqSection}`} id="faq">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>Good to know</span>
            <h2>A Few Things Before You Join</h2>
          </div>

          <div className={styles.faq}>
            {questions.map(({ question, answer }) => (
              <details className={styles.faqItem} key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
};

export default LandingPage;
