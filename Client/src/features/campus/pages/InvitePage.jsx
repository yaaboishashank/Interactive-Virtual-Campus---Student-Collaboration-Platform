import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import Button from "../../../components/ui/Button/Button";
import {
  getCampusInvite,
  joinCampus,
} from "../campus.api";
import styles from "../../auth/auth.module.css";

export default function InvitePage() {
  const { inviteCode } = useParams();

  return (
    <InviteContent
      key={inviteCode}
      inviteCode={inviteCode}
    />
  );
}

function InviteContent({ inviteCode }) {
  const navigate = useNavigate();
  const pendingRef = useRef(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPreview() {
      setLoading(true);
      setError("");

      try {
        const response = await getCampusInvite(inviteCode);

        if (!response?.campus?._id) {
          throw new Error("Invite response missing.");
        }

        if (active) setPreview(response);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load invite."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPreview();

    return () => {
      active = false;
    };
  }, [inviteCode, attempt]);

  async function handleJoin() {
    if (pendingRef.current) return;

    pendingRef.current = true;
    setPending(true);
    setError("");

    try {
      const response = await joinCampus(inviteCode);

      if (!response?.campus?._id) {
        throw new Error("Joined campus response missing.");
      }

      navigate(`/campuses/${response.campus._id}`, {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to join campus."
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>CAMPUS INVITATION</p>

        {loading ? (
          <p role="status">Loading invitation…</p>
        ) : preview ? (
          <>
            <h1>{preview.campus.name}</h1>

            <p className={styles.description}>
              {preview.campus.description ||
                "A shared space to learn and collaborate."}
            </p>

            <p>Campus Admin: {preview.campus.ownerName}</p>

            <p>
              {preview.alreadyMember
                ? "You are already a member of this campus."
                : "Accept this invitation to become a campus member."}
            </p>

            {preview.alreadyMember ? (
              <Button
                as={Link}
                to={`/campuses/${preview.campus._id}`}
                variant="primary"
                fullWidth
              >
                Open campus →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleJoin}
                disabled={pending}
                variant="primary"
                fullWidth
              >
                {pending ? "Joining…" : "Accept & join campus"}
              </Button>
            )}
          </>
        ) : (
          <Button
            type="button"
            onClick={() => setAttempt((current) => current + 1)}
          >
            Retry invitation
          </Button>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <p className={styles.switchText}>
          <Link to="/dashboard">Back to dashboard</Link>
        </p>
      </section>
    </main>
  );
}