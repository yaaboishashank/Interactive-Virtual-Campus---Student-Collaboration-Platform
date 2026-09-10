import styles from "../landing.module.css";

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Register and set up your student profile.",
  },
  {
    number: "02",
    title: "Create or join a campus",
    description: "Start your own campus or enter using an invite code.",
  },
  {
    number: "03",
    title: "Choose a room",
    description: "Find a classroom, library, study room, or lounge.",
  },
  {
    number: "04",
    title: "Explore and collaborate",
    description: "Meet your classmates and keep the conversation going.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.sectionHeading}>
        <span className={styles.eyebrow}>How it works</span>
        <h2>Your Campus in Four Simple Steps</h2>
        <p>Bring your classmates together in one shared space.</p>
      </div>

      <div className={styles.stepsGrid}>
        {steps.map(({ number, title, description }) => (
          <article className={styles.stepCard} key={number}>
            <span className={styles.stepNumber}>{number}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;