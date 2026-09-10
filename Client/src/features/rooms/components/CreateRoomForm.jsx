import { useState } from "react";
import Button from "../../../components/ui/Button/Button";
import Input from "../../../components/ui/Input/Input";
import styles from "../rooms.module.css";

const roomTypes = [
  "classroom",
  "library",
  "lounge",
  "meeting",
  "study",
];

export default function CreateRoomForm({
  room = null,
  onSubmit,
  onCancel,
}) {
  const editing = Boolean(room);

  const [values, setValues] = useState({
    name: room?.name || "",
    description: room?.description || "",
    type: room?.type || "study",
    capacity: room?.capacity || 20,
    isLocked: room?.isLocked || false,
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = values.name.trim();
    const capacity = Number(values.capacity);

    if (!name) {
      setError("Room name required hai.");
      return;
    }

    if (
      !Number.isInteger(capacity) ||
      capacity < 2 ||
      capacity > 100
    ) {
      setError("Capacity 2 se 100 ke beech honi chahiye.");
      return;
    }

    try {
      setPending(true);
      setError("");

      await onSubmit({
        name,
        description: values.description.trim(),
        type: values.type,
        capacity,
        isLocked: values.isLocked,
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Room save nahi hua."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.formPanel}>
      <h2>{editing ? "Edit room" : "Create a room"}</h2>

      <p>
        {editing
          ? "Room details aur access update karo."
          : "Campus members ke liye new space create karo."}
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset className={styles.fields} disabled={pending}>
          <Input
            id={editing ? "edit-room-name" : "create-room-name"}
            label="Room name"
            name="name"
            value={values.name}
            onChange={handleChange}
            maxLength={60}
            required
          />

          <label className={styles.field}>
            Description

            <textarea
              name="description"
              value={values.description}
              onChange={handleChange}
              maxLength={200}
              rows={3}
            />
          </label>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              Room type

              <select
                name="type"
                value={values.type}
                onChange={handleChange}
              >
                {roomTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <Input
              id={
                editing
                  ? "edit-room-capacity"
                  : "create-room-capacity"
              }
              label="Capacity"
              name="capacity"
              type="number"
              min={2}
              max={100}
              value={values.capacity}
              onChange={handleChange}
              required
            />
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="isLocked"
              checked={values.isLocked}
              onChange={handleChange}
            />

            Lock this room
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>

            <Button type="submit" variant="primary">
              {pending
                ? "Saving…"
                : editing
                  ? "Save Changes"
                  : "Create Room"}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}