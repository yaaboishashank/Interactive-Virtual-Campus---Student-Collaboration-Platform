import styles from "./Button.module.css";

const Button = ({
  as: Component = "button",
  children,
  variant = "secondary",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={buttonClasses} {...props}>
      {children}
    </Component>
  );
};

export default Button;