import { Copy, Lock, Unlock, Users } from "lucide-react";
import Button from "../../../components/ui/Button/Button";
import styles from "../campus.module.css";
import { Link } from "react-router-dom";

export default function CampusCard({ campus }) {
    async function copyInviteCode() {
        try {
            await navigator.clipboard.writeText(campus.inviteCode);
        } catch {
            alert(`Invite code: ${campus.inviteCode}`);
        }
    }

    return (
        <article className={styles.campusCard}>
            <div className={styles.cardHeader}>
                <div className={styles.campusIcon}>
                    {campus.name?.charAt(0).toUpperCase()}
                </div>

                <span className={styles.privacy}>
                    {campus.isPrivate ? <Lock size={14} /> : <Unlock size={14} />}

                    {campus.isPrivate ? "Private" : "Public"}
                </span>
            </div>

            <div>
                <h3>{campus.name}</h3>

                <p className={styles.description}>
                    {campus.description || "A virtual space for students."}
                </p>
            </div>

            <div className={styles.memberInfo}>
                <Users size={17} />
                <span>{campus.members?.length || 1} members</span>
            </div>

            {campus.inviteCode && (
                <div className={styles.inviteCode}>
                    <div>
                        <small>INVITE CODE</small>
                        <strong>{campus.inviteCode}</strong>
                    </div>

                    <button
                        type="button"
                        onClick={copyInviteCode}
                        aria-label={`Copy invite code for ${campus.name}`}
                        title="Copy invite code"
                    >
                        <Copy size={17} />
                    </button>
                </div>
            )}

            <Button
                as={Link}
                to={`/campuses/${campus._id}`}
                variant="primary"
                fullWidth
            >
                Enter Campus →
            </Button>
        </article>
    );
}