import { useEffect, useRef, useState } from "react";

export default function useRoomCombat({
  roomId,
  reconnectAttempt,
  socketRef,
  readyRef,
  setMessages,
}) {
  const [hitEvents, setHitEvents] = useState([]);
  const [punchStatus, setPunchStatus] = useState("");

  const nextPunchAt = useRef(0);
  const pendingRef = useRef(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const seen = new Set();

    setHitEvents([]);
    setPunchStatus("");
    nextPunchAt.current = 0;

    function onHit(hit) {
      if (
        socketRef.current !== socket ||
        !readyRef.current ||
        hit?.roomId !== roomId ||
        typeof hit.id !== "string" ||
        !Number.isFinite(hit.x) ||
        !Number.isFinite(hit.y) ||
        seen.has(hit.id)
      ) {
        return;
      }

      seen.add(hit.id);

      if (seen.size > 100) {
        seen.delete(seen.values().next().value);
      }

      setHitEvents((events) =>
        [...events, hit].slice(-30)
      );

      const message = {
        _id: `hit:${hit.id}`,
        room: roomId,
        kind: "combat",
        sender: {
          _id: "campus-combat-system",
          name: "Room activity",
        },
        text: `👊 ${hit.attackerName} hit ${hit.targetName}!`,
        createdAt: hit.createdAt,
      };

      setMessages((messages) => {
        if (
          messages.some(
            (item) => item._id === message._id
          )
        ) {
          return messages;
        }

        // Keep only the latest 30 temporary hit messages.
        const allowed = new Set(
          [
            ...messages.filter(
              (item) => item.kind === "combat"
            ),
            message,
          ]
            .slice(-30)
            .map((item) => item._id)
        );

        return [...messages, message].filter(
          (item) =>
            item.kind !== "combat" ||
            allowed.has(item._id)
        );
      });
    }

    function onDisconnect() {
      pendingRef.current = null;
      setHitEvents([]);
      setPunchStatus("");
    }

    socket.on("player-hit", onHit);
    socket.on("disconnect", onDisconnect);

    return () => {
      pendingRef.current = null;
      socket.off("player-hit", onHit);
      socket.off("disconnect", onDisconnect);
    };
  }, [
    roomId,
    reconnectAttempt,
    socketRef,
    readyRef,
    setMessages,
  ]);

  function punchPlayer() {
    const socket = socketRef.current;
    const now = Date.now();

    if (
      !socket?.connected ||
      !readyRef.current ||
      pendingRef.current ||
      now < nextPunchAt.current
    ) {
      return;
    }

    nextPunchAt.current = now + 700;

    const request = {};
    pendingRef.current = request;

    socket.timeout(3000).emit(
      "player-punch",
      { roomId },
      (error, response) => {
        if (pendingRef.current !== request) return;

        pendingRef.current = null;

        if (
          socketRef.current !== socket ||
          !readyRef.current
        ) {
          return;
        }

        setPunchStatus(
          error
            ? "Punch not confirmed. Try again."
            : response?.hit
              ? "Punch landed!"
              : response?.message || "Miss!"
        );
      }
    );
  }

  return {
    hitEvents,
    punchStatus,
    punchPlayer,
  };
}