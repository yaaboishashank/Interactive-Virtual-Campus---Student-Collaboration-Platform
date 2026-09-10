import { useState } from "react";
import Button from "../../../components/ui/Button/Button";
import Input from "../../../components/ui/Input/Input";
import styles from "../campus.module.css";

const initialValues = {
  name: "",
  description: "",
  isPrivate: false,
};

export default function CreateCampusForm({
  onCreate,
  pending,
  onCancel,
}) {
  const [values, setValues] = useState(initialValues);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!values.name.trim()) return;

    const success = await onCreate({
      name: values.name.trim(),
      description: values.description.trim(),
      isPrivate: values.isPrivate,
    });

    if (success) {
      setValues(initialValues);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <div>
          <span>NEW SPACE</span>
          <h2>Create a campus</h2>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Close create campus form"
        >
          ×
        </button>
      </div>

      <Input
        id="campus-name"
        label="Campus name"
        name="name"
        value={values.name}
        onChange={handleChange}
        placeholder="Example: DBS Virtual Campus"
        maxLength={80}
        required
        disabled={pending}
      />

      <label className={styles.field}>
        <span>Description</span>

        <textarea
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="What is this campus for?"
          maxLength={300}
          rows={4}
          disabled={pending}
        />
      </label>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          name="isPrivate"
          checked={values.isPrivate}
          onChange={handleChange}
          disabled={pending}
        />

        <span>
          <strong>Private campus</strong>
          Only students with an invite code can join.
        </span>
      </label>

      <div className={styles.formActions}>
        <Button type="button" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create Campus"}
        </Button>
      </div>
    </form>
  );
}