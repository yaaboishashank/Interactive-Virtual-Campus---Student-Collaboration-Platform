import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ChatPanel from "../../chat/components/ChatPanel";
import useRoomChat from "../../chat/hooks/useRoomChat";
import RoomCanvas from "../../world/components/RoomCanvas";
import { getRoomById } from "../rooms.api";
import styles from "../../chat/chat.module.css";

export default function RoomPage() {
  const { roomId } = useParams();

  return <RoomContent key={roomId} roomId={roomId} />;
}

function RoomContent({ roomId }) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRoom() {
      try {
        const data = await getRoomById(roomId);

        if (!data?._id) {
          throw new Error("Room response missing.");
        }

        if (active) setRoom(data);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load room."
          );
        }
      }
    }

    loadRoom();

    return () => {
      active = false;
    };
  }, [roomId]);

  if (error) {
    return (
      <main className={styles.page}>
        <p className={styles.error} role="alert">
          {error}
        </p>
        <Link to="/dashboard">← Back to dashboard</Link>
      </main>
    );
  }

  if (!room) {
    return (
      <main className={styles.page} role="status">
        Loading room…
      </main>
    );
  }

  return <ConnectedRoom room={room} />;
}

function ConnectedRoom({ room }) {
  const chat = useRoomChat(room._id);
  const campusId = room.campus?._id || room.campus;
  const currentRoom = { ...room, ...chat.roomDetails };

  return (
    <main className={`${styles.page} ${styles.roomPage}`}>
      <Link
        className={styles.back}
        to={`/campuses/${campusId}`}
      >
        ← Back to campus
      </Link>

      <header className={styles.roomHeader}>
        <span>{currentRoom.type}</span>
        <h1>{currentRoom.name}</h1>
        <p>
          {currentRoom.description ||
            "Connect with your campus members."}
        </p>

        <p>
          {currentRoom.isLocked ? "Locked" : "Open"}
          {" · "}
          {chat.ready
            ? `${chat.players.length}/${currentRoom.capacity} seats occupied`
            : `Capacity: ${currentRoom.capacity}`}
        </p>
      </header>

      <div className={styles.workspace}>
        {chat.ready ? (
          <RoomCanvas
            players={chat.players}
            selfSocketId={chat.selfSocketId}
            connected={chat.ready}
            onMove={chat.movePlayer}
            onPunch={chat.punchPlayer}
            hitEvents={chat.hitEvents}
            punchStatus={chat.punchStatus}
          />
        ) : (
          <section className={styles.chat} aria-label="Room access">
            <header className={styles.chatHeader}>
              <div>
                <h2>{chat.status}</h2>
                <p>
                  {chat.accessCode
                    ? "Return to the campus or try again when access is available."
                    : "The map will appear after your room connection is ready."}
                </p>
              </div>
            </header>
          </section>
        )}

        <ChatPanel chat={chat} />
      </div>
    </main>
  );
}