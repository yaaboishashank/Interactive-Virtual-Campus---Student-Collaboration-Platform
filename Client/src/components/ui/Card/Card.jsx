import styles from "./Card.module.css";

const Card = ({ children, className = "", ...props }) => {
  const cardClasses = [styles.card, className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cardClasses} {...props}>
      {children}
    </section>
  );
};

export default Card;