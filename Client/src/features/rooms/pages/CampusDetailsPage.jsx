import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Button from "../../../components/ui/Button/Button";
import useAuth from "../../../hooks/useAuth";
import { getCampusById } from "../campus.api";
import {
  createRoom,
  deleteRoom,
  getCampusRooms,
  updateRoom,
} from "../../rooms/rooms.api";
import RoomCard from "../../rooms/components/RoomCard";
import CreateRoomForm from "../../rooms/components/CreateRoomForm";
import styles from "../../rooms/rooms.module.css";

function getId(value) {
  if (!value) return "";

  return String(value._id || value.id || value);
}

export default function CampusDetailsPage() {
  const { campusId } = useParams();

  return (
    <CampusDetails
      key={campusId}
      campusId={campusId}
    />
  );
}

function CampusDetails({ campusId }) {
  const { user } = useAuth();

  const [campus, setCampus] = useState(null);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [editingRoom, setEditingRoom] =
    useState(null);

  const [deletingRoomId, setDeletingRoomId] =
    useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCampusPage() {
      try {
        setLoading(true);
        setError("");

        const [campusData, roomsData] =
          await Promise.all([
            getCampusById(campusId),
            getCampusRooms(campusId),
          ]);

        if (!campusData?.campus) {
          throw new Error("Campus response missing.");
        }

        if (!Array.isArray(roomsData)) {
          throw new Error("Rooms response missing.");
        }

        if (active) {
          setCampus(campusData.campus);
          setRooms(roomsData);
        }
      } catch (error) {
        if (active) {
          setError(
            error.response?.data?.message ||
              error.message ||
              "Campus load nahi hua."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCampusPage();

    return () => {
      active = false;
    };
  }, [campusId, attempt]);

  const isOwner =
    Boolean(user && campus) &&
    getId(campus.owner) === getId(user);

  async function handleCreateRoom(values) {
    const newRoom = await createRoom(
      campusId,
      values
    );

    if (!newRoom?._id) {
      throw new Error("Created room response missing.");
    }

    setRooms((currentRooms) => [
      newRoom,
      ...currentRooms,
    ]);

    setShowCreateForm(false);
    setMessage(`"${newRoom.name}" created successfully.`);
  }

  async function handleUpdateRoom(values) {
    if (!editingRoom?._id) return;

    const updatedRoom = await updateRoom(
      editingRoom._id,
      values
    );

    if (!updatedRoom?._id) {
      throw new Error("Updated room response missing.");
    }

    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room._id === updatedRoom._id
          ? updatedRoom
          : room
      )
    );

    setEditingRoom(null);
    setMessage(
      `"${updatedRoom.name}" updated successfully.`
    );
  }

  async function handleDeleteRoom(room) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${room.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingRoomId(room._id);
      setError("");
      setMessage("");

      await deleteRoom(room._id);

      setRooms((currentRooms) =>
        currentRooms.filter(
          (currentRoom) =>
            currentRoom._id !== room._id
        )
      );

      if (editingRoom?._id === room._id) {
        setEditingRoom(null);
      }

      setMessage(
        `"${room.name}" deleted successfully.`
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Room delete nahi hua."
      );
    } finally {
      setDeletingRoomId("");
    }
  }

  function openCreateForm() {
    setMessage("");
    setError("");
    setEditingRoom(null);
    setShowCreateForm(true);
  }

  function openEditForm(room) {
    setMessage("");
    setError("");
    setShowCreateForm(false);
    setEditingRoom(room);

    window.scrollTo({
      top: 420,
      behavior: "smooth",
    });
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.state} role="status">
          Loading campus and rooms…
        </div>
      </main>
    );
  }

  if (error && !campus) {
    return (
      <main className={styles.page}>
        <div className={styles.state}>
          <p className={styles.error} role="alert">
            {error}
          </p>

          <Button
            type="button"
            onClick={() =>
              setAttempt((current) => current + 1)
            }
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link to="/dashboard" className={styles.back}>
        <ArrowLeft size={18} />
        Back to dashboard
      </Link>

      <section className={styles.hero}>
        <span className={styles.badge}>
          {campus.isPrivate
            ? "Private campus"
            : "Public campus"}
        </span>

        <h1>{campus.name}</h1>

        <p>
          {campus.description ||
            "Your shared space to learn."}
        </p>

        <div className={styles.owner}>
          <span
            className={styles.ownerAvatar}
            aria-hidden="true"
          >
            {campus.owner?.name
              ?.charAt(0)
              .toUpperCase() || "A"}
          </span>

          <div>
            <small>
              <ShieldCheck size={14} />
              Campus Admin
            </small>

            <strong>
              {campus.owner?.name ||
                "Owner details unavailable"}
            </strong>
          </div>
        </div>

        <span className={styles.meta}>
          {rooms.length} rooms
          {Array.isArray(campus.members) &&
            ` · ${campus.members.length} members`}
          {isOwner && " · You own this campus"}
        </span>
      </section>

      {error && (
        <div className={styles.errorMessage} role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {message && (
        <div
          className={styles.successMessage}
          role="status"
        >
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.sectionHeader}>
        <div>
          <h2>Campus rooms</h2>

          <p>
            Classrooms, libraries, meeting spaces
            and lounges.
          </p>
        </div>

        {isOwner &&
          !showCreateForm &&
          !editingRoom && (
            <Button
              type="button"
              variant="primary"
              onClick={openCreateForm}
            >
              <Plus size={18} />
              Create Room
            </Button>
          )}
      </div>

      {showCreateForm && isOwner && (
        <CreateRoomForm
          onSubmit={handleCreateRoom}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingRoom && isOwner && (
        <CreateRoomForm
          key={editingRoom._id}
          room={editingRoom}
          onSubmit={handleUpdateRoom}
          onCancel={() => setEditingRoom(null)}
        />
      )}

      {rooms.length === 0 ? (
        <div className={styles.state}>
          <h3>No rooms yet.</h3>

          <p>
            {isOwner
              ? "Create the first room for this campus."
              : "Campus owner has not created any rooms yet."}
          </p>

          {isOwner && (
            <Button
              type="button"
              variant="primary"
              onClick={openCreateForm}
            >
              Create First Room
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {rooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              isOwner={isOwner}
              deleting={
                deletingRoomId === room._id
              }
              onEdit={openEditForm}
              onDelete={handleDeleteRoom}
            />
          ))}
        </div>
      )}
    </main>
  );
}