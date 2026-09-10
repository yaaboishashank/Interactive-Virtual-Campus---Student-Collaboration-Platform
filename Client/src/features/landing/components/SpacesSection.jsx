import styles from "../landing.module.css";

const spaces = [
  {
    title: "Classroom",
    description:
      "A shared space for lessons, questions, and class discussions.",
    type: "Campus room",
  },
  {
    title: "Library",
    description:
      "A dedicated environment for reading, revision, and focused study.",
    type: "Study space",
  },
  {
    title: "Study Room",
    description:
      "Collaborate on coursework and discuss ideas through room chat.",
    type: "Group room",
  },
  {
    title: "Student Lounge",
    description:
      "Take a break, meet classmates, and enjoy casual conversations.",
    type: "Social space",
  },
];

const SpacesSection = () => {
  return (
    <section className={styles.section} id="spaces">
      <div className={styles.sectionHeading}>
        <span className={styles.eyebrow}>Virtual environments</span>
        <h2>One Campus, Multiple Spaces</h2>
        <p>A place for every part of your student life.</p>
      </div>

      <div className={styles.spacesGrid}>
        {spaces.map(({ title, description, type }, index) => (
          <article className={styles.spaceCard} key={title}>
            <div className={styles.spaceArt} aria-hidden="true">
              {index === 0 && <><div className={styles.artBoard} /><div className={styles.artSeats}><i /><i /><i /><i /></div></>}
              {index === 1 && <><div className={styles.artShelf} /><div className={styles.artShelf} /><div className={styles.artRoundTable} /></>}
              {index === 2 && <div className={styles.artWorkTable}><i /><i /></div>}
              {index === 3 && <><div className={styles.artCouch} /><div className={styles.artRoundTable} /></>}
            </div>
            <div className={styles.spaceContent}>
            <h3>{title}</h3>
            <p>{description}</p>

            <div className={styles.spaceFooter}>
              <span>{type}</span>
              <span aria-hidden="true">↗</span>
            </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default SpacesSection;
