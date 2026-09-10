import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button/Button";
import {
  deleteCampus,
  leaveCampus,
} from "../campus.api";
import styles from "../campusManagement.module.css";

export default function CampusMembershipActions({
  campus,
  isOwner,
}) {
  const navigate = useNavigate();
  const busyRef = useRef(false);

  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inviteCode = campus.inviteCode || "";

  const inviteLink = inviteCode
    ? `${window.location.origin}/invite/${encodeURIComponent(
        inviteCode
      )}`
    : "";

  function startAction(action) {
    if (busyRef.current) return false;

    busyRef.current = true;
    setBusyAction(action);
    setError("");
    setMessage("");

    return true;
  }

  function finishAction() {
    busyRef.current = false;
    setBusyAction("");
  }

  async function copyValue(value, label) {
    if (!value || !startAction("copy")) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setError(
        "Automatic copy nahi hua. Field select karke Ctrl+C karo."
      );
    } finally {
      finishAction();
    }
  }

  async function handleLeave() {
    if (isOwner || busyRef.current) return;

    const confirmed = window.confirm(
      `Leave "${campus.name}"? Your active room connections will close. You can rejoin using an invite.`
    );

    if (!confirmed || !startAction("leave")) return;

    try {
      await leaveCampus(campus._id);

      navigate("/dashboard", {
        replace: true,
        state: {
          message: `You left "${campus.name}".`,
        },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to leave campus."
      );

      finishAction();
    }
  }

  async function handleDelete() {
    if (!isOwner || busyRef.current) return;

    const confirmation = window.prompt(
      `This permanently deletes "${campus.name}", every room and every message.\n\nType DELETE to continue.`
    );

    if (confirmation !== "DELETE") {
      if (confirmation !== null) {
        setError('Campus delete karne ke liye exactly "DELETE" type karo.');
      }

      return;
    }

    if (!startAction("delete")) return;

    try {
      await deleteCampus(campus._id);

      navigate("/dashboard", {
        replace: true,
        state: {
          message: `"${campus.name}" deleted successfully.`,
        },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to delete campus."
      );

      finishAction();
    }
  }

  const busy = Boolean(busyAction);

  return (
    <section
      className={styles.panel}
      aria-labelledby="campus-invite-heading"
    >
      <div className={styles.header}>
        <div>
          <h2 id="campus-invite-heading">
            Invite classmates
          </h2>

          <p>
            Share a code or link to invite someone to this
            campus.
          </p>
        </div>
      </div>

      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Invite code</span>

          <input
            value={inviteCode}
            readOnly
            onFocus={(event) => event.target.select()}
          />
        </label>

        <label className={styles.field}>
          <span>Invite link</span>

          <input
            value={inviteLink}
            readOnly
            onFocus={(event) => event.target.select()}
          />
        </label>

        <div className={styles.actions}>
          <Button
            type="button"
            disabled={busy || !inviteCode}
            onClick={() =>
              copyValue(inviteCode, "Invite code")
            }
          >
            Copy code
          </Button>

          <Button
            type="button"
            disabled={busy || !inviteLink}
            onClick={() =>
              copyValue(inviteLink, "Invite link")
            }
          >
            Copy invite link
          </Button>
        </div>
      </div>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <div className={styles.form}>
        {isOwner ? (
          <>
            <h3>Danger zone</h3>

            <p>
              Deleting this campus permanently removes every
              room and every saved message.
            </p>

            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={handleDelete}
            >
              {busyAction === "delete"
                ? "Deleting campus…"
                : "Delete Campus"}
            </Button>
          </>
        ) : (
          <>
            <h3>Campus membership</h3>

            <p>
              Leaving removes your membership and closes your
              active room connections. Earlier messages remain
              until the campus is deleted.
            </p>

            <Button
              type="button"
              variant="danger"
              disabled={busy}
              onClick={handleLeave}
            >
              {busyAction === "leave"
                ? "Leaving campus…"
                : "Leave Campus"}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}