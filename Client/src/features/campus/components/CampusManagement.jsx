import { useRef, useState } from "react";
import Button from "../../../components/ui/Button/Button";
import {
  getCampusById,
  updateCampus,
} from "../campus.api";
import styles from "../campusManagement.module.css";

function getId(value) {
  if (!value) return "";
  return String(value._id || value.id || value);
}

function getMembers(campus) {
  const unique = new Map();

  [campus.owner, ...(campus.members || [])].forEach(
    (member) => {
      const id = getId(member);

      if (id) unique.set(id, member);
    }
  );

  return [...unique.values()];
}

function CampusSettingsForm({
  campus,
  onUpdated,
  onCancel,
}) {
  const [name, setName] = useState(campus.name || "");
  const [description, setDescription] = useState(
    campus.description || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (savingRef.current) return;

    const cleanName = name.trim();
    const cleanDescription = description.trim();

    if (!cleanName || cleanName.length > 80) {
      setError("Campus name must contain 1–80 characters.");
      return;
    }

    if (cleanDescription.length > 300) {
      setError("Description must be at most 300 characters.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");

    try {
      const response = await updateCampus(campus._id, {
        name: cleanName,
        description: cleanDescription,
      });

      if (!response?.campus?._id) {
        throw new Error("Updated campus response missing.");
      }

      onUpdated(response.campus);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Campus update nahi hua."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <fieldset disabled={saving} className={styles.fields}>
        <legend className={styles.legend}>
          Edit campus
        </legend>

        <label className={styles.field}>
          <span>Campus name</span>

          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            autoFocus
          />

          <small>{name.length}/80 characters</small>
        </label>

        <label className={styles.field}>
          <span>Description</span>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            maxLength={300}
            rows={4}
          />

          <small>{description.length}/300 characters</small>
        </label>

        {error && <p role="alert">{error}</p>}

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            {saving ? "Saving…" : "Save changes"}
          </Button>

          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

export default function CampusManagement({
  campus,
  isOwner,
  currentUserId,
  onCampusUpdated,
  onlineIds = new Set(),
  onlineCount = 0,
  presenceStatus = "Connecting…",
}) {
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const refreshingRef = useRef(false);

  const members = getMembers(campus);
  const ownerId = getId(campus.owner);

  async function refreshMembers() {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);
    setError("");
    setMessage("");

    try {
      const response = await getCampusById(campus._id);

      if (!response?.campus?._id) {
        throw new Error("Campus response missing.");
      }

      onCampusUpdated(response.campus);
      setMessage("Members list refreshed.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Members load nahi hue."
      );
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }

  function handleUpdated(updatedCampus) {
    onCampusUpdated(updatedCampus);
    setEditing(false);
    setError("");
    setMessage("Campus details saved successfully.");
  }

  return (
    <section
      className={styles.panel}
      aria-labelledby="campus-members-heading"
    >
      <div className={styles.header}>
        <div>
          <h2 id="campus-members-heading">
            Campus members
          </h2>

          <p>
            {members.length} members · {onlineCount} online
            {" · "}
            {presenceStatus}
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            onClick={refreshMembers}
            disabled={refreshing || editing}
          >
            {refreshing
              ? "Refreshing…"
              : "Refresh members"}
          </Button>

          {isOwner && !editing && (
            <Button
              type="button"
              disabled={refreshing}
              onClick={() => {
                setError("");
                setMessage("");
                setEditing(true);
              }}
            >
              Campus Settings
            </Button>
          )}
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {editing && isOwner && (
        <CampusSettingsForm
          campus={campus}
          onUpdated={handleUpdated}
          onCancel={() => setEditing(false)}
        />
      )}

      <ul className={styles.members}>
        {members.map((member) => {
          const memberId = getId(member);
          const isAdmin = memberId === ownerId;
          const isYou =
            memberId === String(currentUserId);
          const isOnline = onlineIds.has(memberId);
          const name = member.name || "Campus member";

          return (
            <li key={memberId} className={styles.member}>
              <span
                className={`${styles.avatar} ${
                  isOnline ? styles.avatarOnline : ""
                }`}
                aria-hidden="true"
              >
                {name.charAt(0).toUpperCase()}
              </span>

              <div className={styles.identity}>
                <strong>{name}</strong>

                <small>
                  {isYou ? "You · " : ""}
                  {isOnline ? "Online" : "Offline"}
                </small>
              </div>

              <span className={styles.badge}>
                {isAdmin ? "Admin" : "Member"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}