import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {
  accessError,
  requireRoomAccess,
} from "./roomAccess.service.js";
import { saveRoomMessage } from "./message.service.js";
import {
  withRoomQueue,
  withMemberQueue,
} from "./roomQueue.service.js";
import createRealtimePresence from "./realtimePresence.service.js";
import registerPunchEvents from "./punch.service.js";

const START_POSITION = { x: 470, y: 310 };

function publicPlayer(player) {
  return {
    socketId: player.socketId,
    userId: player.userId,
    name: player.name,
    avatar: player.avatar,
    x: player.x,
    y: player.y,
    direction: player.direction,
    moving: player.moving,
  };
}

function roomDetails(room) {
  return {
    _id: String(room._id),
    name: room.name,
    description: room.description,
    type: room.type,
    capacity: room.capacity,
    isLocked: room.isLocked,
  };
}

const initializeSocket = (httpServer) => {
  const roomsPresence = new Map();

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  const realtimePresence = createRealtimePresence(io);

  io.applyProfileUpdate = (updatedUser) => {
    const userId = String(updatedUser._id);

    const profile = {
      _id: userId,
      name: updatedUser.name,
      avatar: updatedUser.avatar || "violet",
    };

    const affectedCampuses = new Set();

    for (const socket of io.sockets.sockets.values()) {
      if (String(socket.user?._id) !== userId) continue;

      socket.user.name = profile.name;
      socket.user.avatar = profile.avatar;

      const roomId = socket.data.activeRoomId;
      const player = roomsPresence.get(roomId)?.get(socket.id);

      if (player) {
        player.name = profile.name;
        player.avatar = profile.avatar;

        // Existing player listener updates the map without moving it.
        io.to(roomId).emit("player-moved", publicPlayer(player));
        realtimePresence.clearTyping(socket, roomId);
      }

      const campusId = socket.data.presenceCampusId;

      if (campusId) {
        affectedCampuses.add(campusId);
        realtimePresence.addCampusPresence(socket, campusId);
      }
    }

    // Only public identity is shared; email and role are not broadcast.
    for (const campusId of affectedCampuses) {
      io.to(`campus-presence:${campusId}`).emit(
        "profile-updated",
        profile
      );
    }
  };

  // Called by the room controller after a successful update.
  io.applyRoomUpdate = (room, ownerId) => {
    const roomId = String(room._id);

    if (room.isLocked) {
      const players = roomsPresence.get(roomId);

      for (const player of [...(players?.values() || [])]) {
        if (player.userId === String(ownerId)) continue;

        const memberSocket = io.sockets.sockets.get(player.socketId);

        if (memberSocket) {
          memberSocket.emit("room-access-revoked", {
            roomId,
            code: "ROOM_LOCKED",
            message:
              "The campus owner locked this room. Return to the campus.",
          });

          memberSocket.disconnect(true);
        }
      }
    }

    io.to(roomId).emit("room-updated", {
      roomId,
      room: roomDetails(room),
    });
  };

  io.removeCampusMember = (campusId, userId) => {
    for (const memberSocket of io.sockets.sockets.values()) {
      const sameUser =
        String(memberSocket.user?._id) === String(userId);

      const sameCampus =
        memberSocket.data.activeCampusId === String(campusId);

      if (!sameUser || !sameCampus) continue;

      memberSocket.emit("room-access-revoked", {
        roomId: memberSocket.data.activeRoomId,
        code: "ROOM_FORBIDDEN",
        message:
          "You left this campus. Join again using an invite to access its rooms.",
      });

      memberSocket.disconnect(true);
    }
  };

  io.deleteCampusConnections = ({
    campusId,
    roomIds,
    message,
  }) => {
    const campusKey = String(campusId);
    const roomIdSet = new Set(
      (roomIds || []).map((roomId) => String(roomId))
    );

    for (const memberSocket of [
      ...io.sockets.sockets.values(),
    ]) {
      const activeCampusId = String(
        memberSocket.data.activeCampusId || ""
      );

      const activeRoomId = String(
        memberSocket.data.activeRoomId || ""
      );

      const belongsToDeletedCampus =
        activeCampusId === campusKey ||
        roomIdSet.has(activeRoomId);

      if (!belongsToDeletedCampus) continue;

      memberSocket.emit("campus-deleted", {
        campusId: campusKey,
        roomId: activeRoomId,
        code: "CAMPUS_DELETED",
        message:
          message ||
          "This campus was deleted by its owner.",
      });

      memberSocket.disconnect(true);
    }

    for (const roomId of roomIdSet) {
      roomsPresence.delete(roomId);
    }
  };

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name avatar");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      socket.tokenExpiresAt = decoded.exp ? decoded.exp * 1000 : null;

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    let joining = false;
    let joinVersion = 0;

    function respond(ack, payload) {
      if (typeof ack === "function") {
        ack(payload);
      } else if (!payload.success) {
        socket.emit("socket-error", payload);
      }
    }

    function handleError(ack, error) {
      if (!error.status) {
        console.error("Socket request failed:", error);
      }

      respond(ack, {
        success: false,
        status: error.status || 500,
        code: error.code || "REQUEST_FAILED",
        message: error.status
          ? error.message
          : "Unable to complete this request.",
      });
    }

    function checkSession() {
      if (
        socket.tokenExpiresAt &&
        Date.now() >= socket.tokenExpiresAt
      ) {
        throw accessError(
          "Session expired. Please log in again.",
          401,
          "SESSION_EXPIRED"
        );
      }
    }

    function removePresence() {
      const roomId = socket.data.activeRoomId;

      if (!roomId) return;

      socket.data.activeRoomId = null;
      socket.data.activeCampusId = null;

      const players = roomsPresence.get(roomId);
      const removed = players?.delete(socket.id);

      if (players?.size === 0) {
        roomsPresence.delete(roomId);
      }

      if (removed) {
        io.to(roomId).emit("player-left", {
          socketId: socket.id,
          userId: String(socket.user._id),
        });
      }

      return roomId;
    }

    async function leaveActiveRoom() {
      const roomId = removePresence();

      if (roomId) {
        await socket.leave(roomId);
      }
    }

    function assertRoomSession(roomId) {
      checkSession();

      if (
        !socket.connected ||
        socket.data.activeRoomId !== roomId ||
        !socket.rooms.has(roomId) ||
        !roomsPresence.get(roomId)?.has(socket.id)
      ) {
        throw accessError(
          "Enter the room before performing this action.",
          403,
          "NOT_IN_ROOM"
        );
      }
    }

    registerPunchEvents({
      io,
      socket,
      roomsPresence,
      assertRoomSession,
      handleError,
    });

    const sessionTimer = setInterval(() => {
      if (
        socket.tokenExpiresAt &&
        Date.now() >= socket.tokenExpiresAt
      ) {
        socket.emit("room-access-revoked", {
          roomId: socket.data.activeRoomId,
          code: "SESSION_EXPIRED",
          message: "Session expired. Please log in again.",
        });

        socket.disconnect(true);
      }
    }, 1000);

    sessionTimer.unref?.();

    socket.on("join-campus-presence", async (campusId, ack) => {
      try {
        checkSession();

        const campus = await realtimePresence.verifyCampusAccess(
          campusId,
          socket.user._id
        );

        if (!socket.connected) return;

        const users = realtimePresence.addCampusPresence(
          socket,
          campus._id
        );

        respond(ack, {
          success: true,
          campusId: String(campus._id),
          users,
        });
      } catch (error) {
        handleError(ack, error);
      }
    });

    socket.on("leave-campus-presence", (campusId) => {
      if (
        String(socket.data.presenceCampusId) === String(campusId)
      ) {
        realtimePresence.removeCampusPresence(socket);
      }
    });

    socket.on("typing-start", (payload) => {
      try {
        const roomId = payload?.roomId;

        assertRoomSession(roomId);
        realtimePresence.setTyping(socket, roomId, true);
      } catch (error) {
        handleError(undefined, error);
      }
    });

    socket.on("typing-stop", (payload) => {
      const roomId = payload?.roomId;

      if (roomId === socket.data.activeRoomId) {
        realtimePresence.setTyping(socket, roomId, false);
      }
    });

    socket.on("join-room", async (requestedRoomId, ack) => {
      if (joining) {
        respond(ack, {
          success: false,
          message: "Room join already in progress.",
        });
        return;
      }

      if (typeof requestedRoomId !== "string") {
        handleError(
          ack,
          accessError("Invalid room ID", 400, "INVALID_ROOM")
        );
        return;
      }

      const roomId = requestedRoomId.toLowerCase();
      const version = ++joinVersion;
      joining = true;

      try {
        await withRoomQueue(roomId, () =>
          withMemberQueue(socket.user._id, async () => {
            checkSession();

            const room = await requireRoomAccess(
              roomId,
              socket.user._id
            );

            if (!socket.connected || version !== joinVersion) return;

            let players = roomsPresence.get(roomId);
            const existingPlayer = players?.get(socket.id);

            if (
              !existingPlayer &&
              (players?.size || 0) >= room.capacity
            ) {
              throw accessError(
                `Room is full (${room.capacity}/${room.capacity}). Try again when a seat is free.`,
                409,
                "ROOM_FULL"
              );
            }

            if (socket.data.activeRoomId !== roomId) {
              await leaveActiveRoom();
            }

            if (!socket.connected || version !== joinVersion) return;

            await socket.join(roomId);

            if (!socket.connected || version !== joinVersion) {
              await socket.leave(roomId);
              return;
            }

            players = roomsPresence.get(roomId);

            if (!players) {
              players = new Map();
              roomsPresence.set(roomId, players);
            }

            let player = players.get(socket.id);
            const isNewPlayer = !player;

            if (!player) {
              player = {
                socketId: socket.id,
                userId: String(socket.user._id),
                name: socket.user.name,
                avatar: socket.user.avatar || "",
                x: START_POSITION.x,
                y: START_POSITION.y,
                direction: "down",
                moving: false,
                lastMoveAt: Date.now(),
              };

              players.set(socket.id, player);
            }

            socket.data.activeRoomId = roomId;
            socket.data.activeCampusId = String(room.campus);

            realtimePresence.addCampusPresence(
              socket,
              room.campus
            );

            respond(ack, {
              success: true,
              roomId,
              room: roomDetails(room),
              selfSocketId: socket.id,
              players: [...players.values()].map(publicPlayer),
            });

            if (isNewPlayer) {
              socket.to(roomId).emit(
                "player-joined",
                publicPlayer(player)
              );
            }
          })
        );
      } catch (error) {
        handleError(ack, error);
      } finally {
        joining = false;
      }
    });

    socket.on("player-move", (payload, ack) => {
      try {
        const roomId = socket.data.activeRoomId;

        assertRoomSession(roomId);

        if (payload?.roomId !== roomId) return;

        const player = roomsPresence.get(roomId)?.get(socket.id);
        const { x, y } = payload;

        if (!player) return;

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          throw accessError(
            "Invalid player coordinates.",
            400,
            "INVALID_MOVEMENT"
          );
        }

        const now = Date.now();
        const elapsedMs = now - player.lastMoveAt;

        if (elapsedMs < 40) return;

        const targetX = Math.max(16, Math.min(944, x));
        const targetY = Math.max(20, Math.min(580, y));
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.hypot(dx, dy);
        const allowedDistance =
          (220 * Math.min(elapsedMs, 1000)) / 1000 + 12;
        const ratio =
          distance > allowedDistance ? allowedDistance / distance : 1;

        player.x = Math.round((player.x + dx * ratio) * 10) / 10;
        player.y = Math.round((player.y + dy * ratio) * 10) / 10;

        if (["up", "down", "left", "right"].includes(payload.direction)) {
          player.direction = payload.direction;
        }

        player.moving = payload.moving === true;
        player.lastMoveAt = now;

        const update = publicPlayer(player);

        io.to(roomId).emit("player-moved", update);
        respond(ack, { success: true, player: update });
      } catch (error) {
        handleError(ack, error);
      }
    });

    socket.on("send-message", async (payload, ack) => {
      try {
        const { roomId, text } = payload || {};

        assertRoomSession(roomId);

        realtimePresence.clearTyping(socket, roomId);

        const message = await saveRoomMessage({
          roomId,
          userId: socket.user._id,
          text,
          assertActive: () => assertRoomSession(roomId),
        });

        io.to(roomId).emit("receive-message", message);
        respond(ack, { success: true, message });
      } catch (error) {
        handleError(ack, error);
      }
    });

    socket.on("leave-room", async (roomId) => {
      try {
        joinVersion += 1;
        realtimePresence.clearTyping(socket, roomId);

        if (roomId === socket.data.activeRoomId) {
          await leaveActiveRoom();
        }
      } catch (error) {
        handleError(undefined, error);
      }
    });

    socket.on("disconnect", () => {
      joinVersion += 1;
      clearInterval(sessionTimer);
      realtimePresence.removeSocket(socket);
      removePresence();
    });
  });

  return io;
};

export default initializeSocket;