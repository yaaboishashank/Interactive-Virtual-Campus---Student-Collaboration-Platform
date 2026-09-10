import { DoorOpen, Map, MessageCircle, Users } from "lucide-react";
import styles from "../landing.module.css";

const features = [
  {
    icon: Map,
    title: "Interactive Campus Map",
    description:
      "Explore a connected 2D campus and move between shared spaces with your classmates.",
    detail: "Keyboard movement",
  },
  {
    icon: DoorOpen,
    title: "Study Rooms",
    description:
      "Create dedicated rooms for classes, group study, and focused discussions.",
    detail: "Flexible room types",
  },
  {
    icon: MessageCircle,
    title: "Real-Time Chat",
    description:
      "Communicate instantly with students inside your current room.",
    detail: "Live room messaging",
  },
  {
    icon: Users,
    title: "Student Presence",
    description:
      "See who is online and connect with students sharing your campus.",
    detail: "Online indicators",
  },
];

const FeaturesSection = () => {
  return (
    <section className={styles.section} id="features">
      <div className={styles.sectionHeading}>
        <span className={styles.eyebrow}>Core capabilities</span>

        <h2>Everything You Need for a Connected Campus</h2>

        <p>
          Focused tools for learning, conversation, and student
          collaboration.
        </p>
      </div>

      <div className={styles.featureGrid}>
        {features.map(({ icon: Icon, title, description, detail }) => (
          <article className={styles.featureCard} key={title}>
            <span className={styles.featureIcon}>
              <Icon size={22} aria-hidden="true" />
            </span>

            <h3>{title}</h3>
            <p>{description}</p>

            <span className={styles.featureDetail}>{detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;