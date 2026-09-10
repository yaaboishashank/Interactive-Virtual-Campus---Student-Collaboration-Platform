import mongoose from "mongoose";
import Campus from "../models/campus.model.js";
import { accessError } from "./roomAccess.service.js";

function getId(value) {
  return String(value?._id || value || "");
}

export default function createRealtimePresence(io) {
  // campusId -> userId -> socketId -> user
  const campuses = new Map();

  // roomId -> socketId -> typing user
  const typingRooms = new Map();

  const typingTimers = new Map();

  function campusChannel(campusId) {
    return `campus-presence:${campusId}`;
  }

  function publicUser(socket) {
    return {
      userId: getId(socket.user),
      name: socket.user?.name || "Student",
      avatar: socket.user?.avatar || "",
    };
  }

  function getOnlineUsers(campusId) {
    const users = campuses.get(String(campusId));

    if (!users) return [];

    return [...users.values()]
      .map((connections) => connections.values().next().value)
      .filter(Boolean)
      .map((user) => ({
        userId: user.userId,
        name: user.name,
        avatar: user.avatar,
      }));
  }

  function emitCampusPresence(campusId) {
    const id = String(campusId);

    io.to(campusChannel(id)).emit("campus-presence", {
      campusId: id,
      users: getOnlineUsers(id),
    });
  }

  async function verifyCampusAccess(campusId, userId) {
    if (!mongoose.isObjectIdOrHexString(campusId)) {
      throw accessError(
        "Invalid campus ID.",
        400,
        "INVALID_CAMPUS"
      );
    }

    const campus = await Campus.findById(campusId)
      .select("owner members");

    if (!campus) {
      throw accessError(
        "Campus not found.",
        404,
        "CAMPUS_NOT_FOUND"
      );
    }

    const id = String(userId);

    const allowed =
      String(campus.owner) === id ||
      campus.members.some(
        (memberId) => String(memberId) === id
      );

    if (!allowed) {
      throw accessError(
        "You are not a member of this campus.",
        403,
        "ROOM_FORBIDDEN"
      );
    }

    return campus;
  }

  function removeCampusPresence(socket) {
    const campusId = socket.data.presenceCampusId;

    if (!campusId) return;

    socket.data.presenceCampusId = null;

    const users = campuses.get(campusId);
    const userId = getId(socket.user);
    const connections = users?.get(userId);

    connections?.delete(socket.id);

    if (connections?.size === 0) {
      users.delete(userId);
    }

    if (users?.size === 0) {
      campuses.delete(campusId);
    }

    socket.leave(campusChannel(campusId));
    emitCampusPresence(campusId);
  }

  function addCampusPresence(socket, campusId) {
    const id = String(campusId);
    const userId = getId(socket.user);

    if (
      socket.data.presenceCampusId &&
      socket.data.presenceCampusId !== id
    ) {
      removeCampusPresence(socket);
    }

    let users = campuses.get(id);

    if (!users) {
      users = new Map();
      campuses.set(id, users);
    }

    let connections = users.get(userId);

    if (!connections) {
      connections = new Map();
      users.set(userId, connections);
    }

    connections.set(socket.id, publicUser(socket));

    socket.data.presenceCampusId = id;
    socket.join(campusChannel(id));

    emitCampusPresence(id);

    return getOnlineUsers(id);
  }

  function emitTyping(roomId) {
    const room = typingRooms.get(roomId);
    const uniqueUsers = new Map();

    for (const typer of room?.values() || []) {
      uniqueUsers.set(typer.userId, {
        userId: typer.userId,
        name: typer.name,
      });
    }

    io.to(roomId).emit("typing-users", {
      roomId,
      users: [...uniqueUsers.values()],
    });
  }

  function clearTyping(socket, roomId = socket.data.activeRoomId) {
    if (!roomId) return;

    const timerKey = `${roomId}:${socket.id}`;
    const timer = typingTimers.get(timerKey);

    if (timer) {
      clearTimeout(timer);
      typingTimers.delete(timerKey);
    }

    const room = typingRooms.get(roomId);
    const removed = room?.delete(socket.id);

    if (room?.size === 0) {
      typingRooms.delete(roomId);
    }

    if (removed) {
      emitTyping(roomId);
    }
  }

  function setTyping(socket, roomId, typing) {
    if (
      !roomId ||
      roomId !== socket.data.activeRoomId ||
      !socket.rooms.has(roomId)
    ) {
      return;
    }

    if (!typing) {
      clearTyping(socket, roomId);
      return;
    }

    let room = typingRooms.get(roomId);

    if (!room) {
      room = new Map();
      typingRooms.set(roomId, room);
    }

    room.set(socket.id, {
      userId: getId(socket.user),
      name: socket.user?.name || "Student",
    });

    const timerKey = `${roomId}:${socket.id}`;
    const oldTimer = typingTimers.get(timerKey);

    if (oldTimer) clearTimeout(oldTimer);

    const timer = setTimeout(() => {
      typingTimers.delete(timerKey);
      clearTyping(socket, roomId);
    }, 3000);

    timer.unref?.();
    typingTimers.set(timerKey, timer);

    emitTyping(roomId);
  }

  function removeSocket(socket) {
    clearTyping(socket);
    removeCampusPresence(socket);
  }

  return {
    verifyCampusAccess,
    addCampusPresence,
    removeCampusPresence,
    getOnlineUsers,
    setTyping,
    clearTyping,
    removeSocket,
  };
}