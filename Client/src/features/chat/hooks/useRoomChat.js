import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getRoomMessages } from "../chat.api";
import useRoomCombat from "./useRoomCombat";

function mergeMessages(current, incoming) {
  const unique = new Map();

  [...current, ...incoming].forEach((message) => {
    if (message?._id) {
      unique.set(String(message._id), message);
    }
  });

  return [...unique.values()].sort(
    (a, b) =>
      new Date(a.createdAt) - new Date(b.createdAt) ||
      String(a._id).localeCompare(String(b._id))
  );
}

function updatePlayer(players, incoming) {
  if (!incoming?.socketId) return players;

  const exists = players.some(
    (player) => player.socketId === incoming.socketId
  );

  if (!exists) return [...players, incoming];

  return players.map((player) =>
    player.socketId === incoming.socketId
      ? { ...player, ...incoming }
      : player
  );
}

const ACCESS_CODES = new Set([
  "ROOM_LOCKED",
  "ROOM_FULL",
  "ROOM_DELETED",
  "CAMPUS_DELETED",
  "ROOM_FORBIDDEN",
  "CAMPUS_NOT_FOUND",
  "INVALID_ROOM",
  "SESSION_EXPIRED",
  "NOT_IN_ROOM",
]);

const PERMANENT_CODES = new Set([
  "ROOM_DELETED",
  "CAMPUS_DELETED",
  "ROOM_FORBIDDEN",
  "CAMPUS_NOT_FOUND",
  "INVALID_ROOM",
  "SESSION_EXPIRED",
]);

function accessStatus(code) {
  if (code === "ROOM_LOCKED") return "Room locked";
  if (code === "ROOM_FULL") return "Room full";
  if (code === "ROOM_DELETED") return "Room deleted";
  if (code === "CAMPUS_DELETED") return "Campus deleted";
  if (code === "SESSION_EXPIRED") return "Session expired";

  return "Room access unavailable";
}

export default function useRoomChat(roomId) {
  const socketRef = useRef(null);
  const readyRef = useRef(false);
  const blockedRef = useRef(false);
  const permanentRef = useRef(false);
  const pendingSendRef = useRef(null);
  const blockHandlerRef = useRef(null);
  const typingRef = useRef(false);
  const lastTypingAtRef = useRef(0);

  const [messages, setMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selfSocketId, setSelfSocketId] = useState("");
  const [roomDetails, setRoomDetails] = useState(null);
  const [status, setStatus] = useState("Connecting…");
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let stopped = false;

    readyRef.current = false;
    blockedRef.current = false;
    permanentRef.current = false;
    typingRef.current = false;
    lastTypingAtRef.current = 0;
    pendingSendRef.current = null;

    setMessages([]);
    setPlayers([]);
    setTypingUsers([]);
    setSelfSocketId("");
    setRoomDetails(null);
    setReady(false);
    setSending(false);
    setError("");
    setAccessCode("");
    setStatus("Connecting…");

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
      auth: {
        token: localStorage.getItem("campusverse-token"),
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    function isCurrent() {
      return active && !stopped && socketRef.current === socket;
    }

    function cancelPendingSend() {
      const pending = pendingSendRef.current;

      if (pending?.socket === socket) {
        pendingSendRef.current = null;
        pending.resolve(false);
      }

      if (active) setSending(false);
    }

    function markUnavailable(nextStatus) {
      readyRef.current = false;
      setReady(false);
      setStatus(nextStatus);
    }

    function stopTyping() {
      if (typingRef.current && socket.connected) {
        socket.emit("typing-stop", { roomId });
      }

      typingRef.current = false;
      lastTypingAtRef.current = 0;
    }

    function blockAccess(data) {
      if (!isCurrent()) return;

      stopTyping();
      stopped = true;
      generation += 1;
      blockedRef.current = true;
      permanentRef.current = PERMANENT_CODES.has(data.code);

      cancelPendingSend();
      markUnavailable(accessStatus(data.code));

      setAccessCode(data.code || "ROOM_FORBIDDEN");
      setError(data.message || "Room access is unavailable.");
      setPlayers([]);
      setTypingUsers([]);
      setSelfSocketId("");
      setMessages([]);

      socket.disconnect();
    }

    blockHandlerRef.current = blockAccess;

    function handleDisconnect() {
      if (!active) return;

      generation += 1;
      typingRef.current = false;
      cancelPendingSend();

      readyRef.current = false;
      setReady(false);
      setPlayers([]);
      setTypingUsers([]);
      setSelfSocketId("");

      if (!stopped) setStatus("Disconnected");
    }

    function handleConnect() {
      if (!isCurrent()) return;

      const currentGeneration = ++generation;

      markUnavailable("Entering room…");
      setError("");

      socket.timeout(10000).emit(
        "join-room",
        roomId,
        async (timeoutError, response) => {
          if (!isCurrent() || currentGeneration !== generation) return;

          if (timeoutError) {
            socket.disconnect();
            setStatus("Unable to enter room");
            setError("Room join timed out. Please reconnect.");
            return;
          }

          if (!response?.success) {
            blockAccess({
              code: response?.code || "JOIN_FAILED",
              message:
                response?.message || "Unable to enter room.",
            });
            return;
          }

          setSelfSocketId(response.selfSocketId || socket.id);
          setPlayers(
            Array.isArray(response.players)
              ? response.players
              : []
          );
          setRoomDetails(response.room || null);

          try {
            const history = await getRoomMessages(roomId);

            if (
              !isCurrent() ||
              currentGeneration !== generation
            ) {
              return;
            }

            if (!Array.isArray(history)) {
              throw new Error(
                "Invalid message history response."
              );
            }

            setMessages((current) =>
              mergeMessages(current, history)
            );

            readyRef.current = true;
            setReady(true);
            setStatus("Connected");
          } catch (historyError) {
            if (
              !isCurrent() ||
              currentGeneration !== generation
            ) {
              return;
            }

            const responseData =
              historyError.response?.data;
            const httpStatus =
              historyError.response?.status;

            const code =
              responseData?.code ||
              (httpStatus === 401
                ? "SESSION_EXPIRED"
                : httpStatus === 403
                  ? "ROOM_FORBIDDEN"
                  : httpStatus === 404
                    ? "ROOM_DELETED"
                    : "");

            if (ACCESS_CODES.has(code)) {
              blockAccess({
                code,
                message:
                  responseData?.message ||
                  "Room access unavailable.",
              });
              return;
            }

            socket.disconnect();
            setStatus("History unavailable");
            setError(
              responseData?.message ||
              historyError.message ||
              "Messages load nahi hue."
            );
          }
        }
      );
    }

    function handleMessage(message) {
      if (!isCurrent()) return;

      const messageRoomId =
        message?.room?._id || message?.room;

      if (String(messageRoomId) !== String(roomId)) return;

      setMessages((current) =>
        mergeMessages(current, [message])
      );
    }

    function handleProfileUpdated(profile) {
      if (!isCurrent() || !profile?._id) return;

      const userId = String(profile._id);

      setMessages((current) =>
        current.map((message) => {
          const senderId = message.sender?._id || message.sender;

          if (String(senderId) !== userId) return message;

          return {
            ...message,
            sender: {
              ...(typeof message.sender === "object"
                ? message.sender
                : {}),
              _id: userId,
              name: profile.name,
              avatar: profile.avatar,
            },
          };
        })
      );

      setPlayers((current) =>
        current.map((player) =>
          String(player.userId) === userId
            ? {
              ...player,
              name: profile.name,
              avatar: profile.avatar,
            }
            : player
        )
      );

      setTypingUsers((current) =>
        current.map((typingUser) =>
          String(typingUser.userId) === userId
            ? { ...typingUser, name: profile.name }
            : typingUser
        )
      );
    }

    function handlePlayer(player) {
      if (!isCurrent()) return;

      setPlayers((current) =>
        updatePlayer(current, player)
      );
    }

    function handlePlayerLeft(data) {
      if (!isCurrent() || !data?.socketId) return;

      setPlayers((current) =>
        current.filter(
          (player) => player.socketId !== data.socketId
        )
      );
    }

    function handleTypingUsers(data) {
      if (
        !isCurrent() ||
        String(data?.roomId) !== String(roomId)
      ) {
        return;
      }

      setTypingUsers(
        Array.isArray(data.users) ? data.users : []
      );
    }

    function handleRoomUpdated(data) {
      if (
        !isCurrent() ||
        String(data?.roomId) !== String(roomId)
      ) {
        return;
      }

      setRoomDetails((current) => ({
        ...current,
        ...data.room,
      }));
    }

    function handleAccessRevoked(data) {
      if (
        data?.code !== "SESSION_EXPIRED" &&
        String(data?.roomId) !== String(roomId)
      ) {
        return;
      }

      blockAccess(data || {});
    }

    function handleRoomDeleted(data) {
      if (String(data?.roomId) !== String(roomId)) return;

      blockAccess({
        ...data,
        code: "ROOM_DELETED",
      });
    }

    function handleCampusDeleted(data) {
      if (String(data?.roomId) !== String(roomId)) return;

      blockAccess({
        ...data,
        code: "CAMPUS_DELETED",
      });
    }

    function handleConnectError(connectionError) {
      if (!isCurrent()) return;

      generation += 1;
      cancelPendingSend();
      markUnavailable("Connection failed");

      setError(
        connectionError.message || "Unable to connect."
      );
    }

    function handleSocketError(data) {
      if (!isCurrent()) return;

      if (ACCESS_CODES.has(data?.code)) {
        blockAccess(data);
      } else {
        setError(
          data?.message || "Realtime request failed."
        );
      }
    }

    const handlers = {
      connect: handleConnect,
      disconnect: handleDisconnect,
      connect_error: handleConnectError,
      "receive-message": handleMessage,
      "player-joined": handlePlayer,
      "player-moved": handlePlayer,
      "player-left": handlePlayerLeft,
      "typing-users": handleTypingUsers,
      "room-updated": handleRoomUpdated,
      "room-access-revoked": handleAccessRevoked,
      "room-deleted": handleRoomDeleted,
      "campus-deleted": handleCampusDeleted,
      "socket-error": handleSocketError,
      "profile-updated": handleProfileUpdated,
    };

    Object.entries(handlers).forEach(
      ([event, handler]) => {
        socket.on(event, handler);
      }
    );

    socket.connect();

    return () => {
      active = false;
      generation += 1;
      readyRef.current = false;

      stopTyping();
      cancelPendingSend();

      if (socket.connected) {
        socket.emit("leave-room", roomId);
      }

      Object.entries(handlers).forEach(
        ([event, handler]) => {
          socket.off(event, handler);
        }
      );

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (blockHandlerRef.current === blockAccess) {
        blockHandlerRef.current = null;
      }
    };
  }, [roomId, reconnectAttempt]);

  function setTyping(isTyping) {
    const socket = socketRef.current;

    if (
      !socket?.connected ||
      !readyRef.current ||
      blockedRef.current
    ) {
      return;
    }

    if (!isTyping) {
      if (typingRef.current) {
        socket.emit("typing-stop", { roomId });
      }

      typingRef.current = false;
      lastTypingAtRef.current = 0;
      return;
    }

    const now = Date.now();

    if (
      !typingRef.current ||
      now - lastTypingAtRef.current >= 1000
    ) {
      socket.emit("typing-start", { roomId });
      typingRef.current = true;
      lastTypingAtRef.current = now;
    }
  }

  function movePlayer(position) {
    const socket = socketRef.current;

    if (
      !socket?.connected ||
      !readyRef.current ||
      blockedRef.current ||
      !Number.isFinite(position?.x) ||
      !Number.isFinite(position?.y)
    ) {
      return;
    }

    socket.emit("player-move", {
      roomId,
      x: position.x,
      y: position.y,
      direction: position.direction,
      moving: Boolean(position.moving),
    });
  }

  async function sendMessage(text) {
    const socket = socketRef.current;
    const cleanText =
      typeof text === "string" ? text.trim() : "";

    if (
      !socket?.connected ||
      !readyRef.current ||
      blockedRef.current ||
      pendingSendRef.current ||
      !cleanText
    ) {
      return false;
    }

    setTyping(false);

    if (cleanText.length > 500) {
      setError(
        "Message maximum 500 characters ka ho sakta hai."
      );
      return false;
    }

    setSending(true);
    setError("");

    return new Promise((resolve) => {
      const request = { socket, resolve };
      pendingSendRef.current = request;

      socket.timeout(10000).emit(
        "send-message",
        {
          roomId,
          text: cleanText,
        },
        (timeoutError, response) => {
          if (pendingSendRef.current !== request) {
            resolve(false);
            return;
          }

          pendingSendRef.current = null;

          if (
            socketRef.current !== socket ||
            blockedRef.current
          ) {
            resolve(false);
            return;
          }

          setSending(false);

          if (timeoutError) {
            setError(
              "Message delivery confirm nahi hui. History check karo."
            );
            resolve(false);
            return;
          }

          if (
            !response?.success ||
            !response.message?._id
          ) {
            if (ACCESS_CODES.has(response?.code)) {
              blockHandlerRef.current?.(response);
            } else {
              setError(
                response?.message ||
                "Message send nahi hua."
              );
            }

            resolve(false);
            return;
          }

          setMessages((current) =>
            mergeMessages(current, [response.message])
          );

          resolve(true);
        }
      );
    });
  }

  function reconnect() {
    if (permanentRef.current) return;

    readyRef.current = false;
    setReady(false);
    setStatus("Connecting…");

    const socket = socketRef.current;
    socket?.disconnect();

    if (socketRef.current === socket) {
      socketRef.current = null;
    }

    setReconnectAttempt((current) => current + 1);
  }

  function clearError() {
    if (!blockedRef.current) setError("");
  }

    const combat = useRoomCombat({
    roomId,
    reconnectAttempt,
    socketRef,
    readyRef,
    setMessages,
  });

  const canReconnect =
    !ready &&
    !PERMANENT_CODES.has(accessCode) &&
    !["Connecting…", "Entering room…"].includes(status);

  return {
    ...combat,
    messages,
    players,
    typingUsers,
    selfSocketId,
    roomDetails,
    status,
    ready,
    sending,
    error,
    accessCode,
    canReconnect,
    sendMessage,
    movePlayer,
    setTyping,
    reconnect,
    clearError,
  };
}