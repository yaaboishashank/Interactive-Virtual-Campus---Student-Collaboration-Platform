import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function uniqueUsers(users) {
  const unique = new Map();

  for (const user of Array.isArray(users) ? users : []) {
    if (user?.userId) {
      unique.set(String(user.userId), user);
    }
  }

  return [...unique.values()];
}

export default function useCampusPresence(campusId) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [status, setStatus] = useState("Connecting…");

  useEffect(() => {
    if (!campusId) return undefined;

    let active = true;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: {
        token: localStorage.getItem("campusverse-token"),
      },
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    function joinCampusPresence() {
      setStatus("Connecting…");

      socket.timeout(10000).emit(
        "join-campus-presence",
        campusId,
        (timeoutError, response) => {
          if (!active) return;

          if (timeoutError || !response?.success) {
            setOnlineUsers([]);
            setStatus(
              response?.message || "Presence unavailable"
            );
            return;
          }

          setOnlineUsers(uniqueUsers(response.users));
          setStatus("Live");
        }
      );
    }

    function handlePresence(data) {
      if (
        !active ||
        String(data?.campusId) !== String(campusId)
      ) {
        return;
      }

      setOnlineUsers(uniqueUsers(data.users));
      setStatus("Live");
    }

    function handleDisconnect() {
      if (!active) return;

      setOnlineUsers([]);
      setStatus("Reconnecting…");
    }

    function handleConnectError() {
      if (!active) return;

      setOnlineUsers([]);
      setStatus("Presence unavailable");
    }

    socket.on("connect", joinCampusPresence);
    socket.on("campus-presence", handlePresence);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      active = false;

      if (socket.connected) {
        socket.emit("leave-campus-presence", campusId);
      }

      socket.off("connect", joinCampusPresence);
      socket.off("campus-presence", handlePresence);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      socket.disconnect();
    };
  }, [campusId]);

  const onlineIds = new Set(
    onlineUsers.map((user) => String(user.userId))
  );

  return {
    onlineUsers,
    onlineIds,
    onlineCount: onlineUsers.length,
    status,
  };
}