import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import Button from "../../../components/ui/Button/Button";
import useAuth from "../../../hooks/useAuth";
import CampusCard from "../../campus/components/CampusCard";
import CreateCampusForm from "../../campus/components/CreateCampusForm";
import JoinCampusForm from "../../campus/components/JoinCampusForm";
import {
  createCampus,
  getCampuses,
  joinCampus,
} from "../../campus/campus.api";
import styles from "../../campus/campus.module.css";

function extractCampuses(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.campuses)) return data.campuses;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [campuses, setCampuses] = useState([]);
  const [search, setSearch] = useState("");
  const [activeForm, setActiveForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCampuses = useCallback(async () => {
    try {
      setError("");
      const data = await getCampuses();
      setCampuses(extractCampuses(data));
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Campuses load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampuses();
  }, [loadCampuses]);

  async function handleCreate(values) {
    try {
      setPending(true);
      setError("");
      setMessage("");

      await createCampus(values);
      await loadCampuses();

      setActiveForm(null);
      setMessage("Campus successfully create ho gaya.");
      return true;
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Campus create nahi ho paya."
      );
      return false;
    } finally {
      setPending(false);
    }
  }

  async function handleJoin(inviteCode) {
    try {
      setPending(true);
      setError("");
      setMessage("");

      await joinCampus(inviteCode);
      await loadCampuses();

      setActiveForm(null);
      setMessage("Aap campus mein successfully join ho gaye.");
      return true;
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invite code invalid hai ya campus join nahi hua."
      );
      return false;
    } finally {
      setPending(false);
    }
  }

  const filteredCampuses = campuses.filter((campus) => {
    const query = search.toLowerCase();

    return (
      campus.name?.toLowerCase().includes(query) ||
      campus.description?.toLowerCase().includes(query)
    );
  });

  return (
    <main className={styles.dashboard}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>YOUR CAMPUS HUB</span>

          <h1>
            Welcome back,{" "}
            <span>{user?.name?.split(" ")[0] || "Student"}.</span>
          </h1>

          <p>
            Join your classmates, enter study rooms and create spaces
            where ideas can grow.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Button
            type="button"
            variant="primary"
            onClick={() => setActiveForm("create")}
          >
            <Plus size={18} />
            Create Campus
          </Button>

          <Button
            type="button"
            onClick={() => setActiveForm("join")}
          >
            <UserPlus size={18} />
            Join Campus
          </Button>
        </div>
      </section>

      <section className={styles.quickStats}>
        <article>
          <Building2 size={22} />
          <div>
            <strong>{campuses.length}</strong>
            <span>Your campuses</span>
          </div>
        </article>

        <article>
          <ArrowRight size={22} />
          <div>
            <strong>Ready</strong>
            <span>Enter and collaborate</span>
          </div>
        </article>
      </section>

      {activeForm && (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) {
              setActiveForm(null);
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={
              activeForm === "create"
                ? "Create campus"
                : "Join campus"
            }
          >
            {activeForm === "create" ? (
              <CreateCampusForm
                onCreate={handleCreate}
                pending={pending}
                onCancel={() => setActiveForm(null)}
              />
            ) : (
              <JoinCampusForm
                onJoin={handleJoin}
                pending={pending}
                onCancel={() => setActiveForm(null)}
              />
            )}
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage} role="alert">
          <span>{error}</span>

          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {message && (
        <div className={styles.successMessage} role="status">
          <span>{message}</span>

          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      <section className={styles.campusSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>YOUR SPACES</span>
            <h2>My Campuses</h2>
          </div>

          <label className={styles.search}>
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search campuses..."
              aria-label="Search campuses"
            />
          </label>
        </div>

        {loading && (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <h3>Loading campuses…</h3>
          </div>
        )}

        {!loading && campuses.length === 0 && (
          <div className={styles.stateBox}>
            <Building2 size={42} />
            <h3>Your campus journey starts here.</h3>
            <p>Create your own campus or join using an invite code.</p>

            <div className={styles.emptyActions}>
              <Button
                variant="primary"
                onClick={() => setActiveForm("create")}
              >
                Create Campus
              </Button>

              <Button onClick={() => setActiveForm("join")}>
                Join Campus
              </Button>
            </div>
          </div>
        )}

        {!loading &&
          campuses.length > 0 &&
          filteredCampuses.length === 0 && (
            <div className={styles.stateBox}>
              <Search size={38} />
              <h3>No matching campus found.</h3>
              <p>Search mein doosra campus name try karo.</p>
            </div>
          )}

        {!loading && filteredCampuses.length > 0 && (
          <div className={styles.campusGrid}>
            {filteredCampuses.map((campus) => (
              <CampusCard
                key={campus._id || campus.id}
                campus={campus}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}