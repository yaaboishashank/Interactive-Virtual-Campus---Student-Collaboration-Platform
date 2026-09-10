import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import Button from "../../../components/ui/Button/Button";
import Avatar from "../components/Avatar";
import {
  AVATAR_PRESETS,
  getAvatarPreset,
} from "../avatarPresets";
import styles from "../profile.module.css";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <p role="status">Loading profile…</p>;
  }

  return (
    <ProfileForm
      key={user._id || user.id}
      user={user}
    />
  );
}

function ProfileForm({ user }) {
  const { saveProfile } = useAuth();
  const pendingRef = useRef(false);

  const [name, setName] = useState(user.name || "");
  const [avatar, setAvatar] = useState(
    getAvatarPreset(user.avatar).id
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (pendingRef.current) return;

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 50) {
      setError("Name must contain 2–50 characters.");
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setError("");
    setMessage("");

    try {
      const updated = await saveProfile({
        name: cleanName,
        avatar,
      });

      setName(updated.name);
      setAvatar(getAvatarPreset(updated.avatar).id);
      setMessage("Profile saved successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Profile save nahi hua."
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link to="/dashboard" className={styles.back}>
        ← Back to dashboard
      </Link>

      <section className={styles.card}>
        <h1>Your profile</h1>
        <p>Choose how classmates see you across CampusVerse.</p>

        <div className={styles.preview}>
          <Avatar avatar={avatar} size={100} />
          <div>
            <h2>{name.trim() || "Your name"}</h2>
            <p>{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} aria-busy={pending}>
          <fieldset disabled={pending} className={styles.fields}>
            <legend className={styles.legend}>Profile details</legend>

            <label className={styles.field}>
              <span>Display name</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setMessage("");
                }}
                minLength={2}
                maxLength={50}
                autoComplete="name"
                required
              />
              <small>{name.length}/50 characters</small>
            </label>

            <fieldset className={styles.avatarFieldset}>
              <legend>Choose your avatar</legend>

              <div className={styles.avatarGrid}>
                {AVATAR_PRESETS.map((preset) => (
                  <label
                    key={preset.id}
                    className={`${styles.option} ${
                      avatar === preset.id ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="avatar"
                      value={preset.id}
                      checked={avatar === preset.id}
                      onChange={() => {
                        setAvatar(preset.id);
                        setMessage("");
                      }}
                    />
                    <Avatar avatar={preset.id} size={64} />
                    <span>{preset.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p role="alert">{error}</p>}
            {message && <p role="status">{message}</p>}

            <Button type="submit" variant="primary">
              {pending ? "Saving…" : "Save profile"}
            </Button>
          </fieldset>
        </form>
      </section>
    </main>
  );
}