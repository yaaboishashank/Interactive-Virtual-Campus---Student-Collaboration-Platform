import { useState } from "react";
import Button from "../../../components/ui/Button/Button";
import Input from "../../../components/ui/Input/Input";
import styles from "../campus.module.css";

export default function JoinCampusForm({
  onJoin,
  pending,
  onCancel,
}) {
  const [inviteCode, setInviteCode] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!inviteCode.trim()) return;

    const success = await onJoin(inviteCode.trim());

    if (success) {
      setInviteCode("");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <div>
          <span>HAVE AN INVITE?</span>
          <h2>Join a campus</h2>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Close join campus form"
        >
          ×
        </button>
      </div>

      <p className={styles.formDescription}>
        Campus owner se mila hua invite code enter karo.
      </p>

      <Input
        id="invite-code"
        label="Invite code"
        name="inviteCode"
        value={inviteCode}
        onChange={(event) =>
          setInviteCode(event.target.value.toLowerCase())
        }
        placeholder="Example: 5b2c0f84"
        autoComplete="off"
        maxLength={30}
        required
        disabled={pending}
      />

      <div className={styles.formActions}>
        <Button type="button" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Joining…" : "Join Campus"}
        </Button>
      </div>
    </form>
  );
}