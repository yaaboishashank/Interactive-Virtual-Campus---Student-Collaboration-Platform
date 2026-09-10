import { Link } from "react-router-dom";
import {
  DoorOpen,
  Edit3,
  Lock,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import Button from "../../../components/ui/Button/Button";
import styles from "../rooms.module.css";

export default function RoomCard({
  room,
  isOwner,
  deleting,
  onEdit,
  onDelete,
}) {
  return (
    <article className={styles.roomCard}>
      <div className={styles.row}>
        <span className={styles.badge}>{room.type}</span>

        <span className={styles.locked}>
          {room.isLocked ? (
            <>
              <Lock size={15} />
              Locked
            </>
          ) : (
            <>
              <Unlock size={15} />
              Open
            </>
          )}
        </span>
      </div>

      <DoorOpen
        size={30}
        className={styles.roomIcon}
        aria-hidden="true"
      />

      <h3>{room.name}</h3>

      <p>
        {room.description ||
          "A space to learn and collaborate."}
      </p>

      <div className={styles.capacity}>
        <Users size={17} />
        Capacity: {room.capacity}
      </div>

      <Button
        as={Link}
        to={`/rooms/${room._id}`}
        variant="primary"
        fullWidth
      >
        Open Room →
      </Button>

      {isOwner && (
        <div className={styles.managementActions}>
          <Button
            type="button"
            onClick={() => onEdit(room)}
            disabled={deleting}
          >
            <Edit3 size={16} />
            Edit
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(room)}
            disabled={deleting}
          >
            <Trash2 size={16} />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      )}
    </article>
  );
}