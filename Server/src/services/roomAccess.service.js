import mongoose from "mongoose";
import Room from "../models/room.model.js";
import Campus from "../models/campus.model.js";

export function accessError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export async function requireRoomAccess(
  roomId,
  userId,
  { session = null, allowLocked = false } = {}
) {
  if (
    typeof roomId !== "string" ||
    !mongoose.isObjectIdOrHexString(roomId)
  ) {
    throw accessError("Invalid room ID", 400, "INVALID_ROOM");
  }

  const room = await Room.findById(roomId).session(session);

  if (!room) {
    throw accessError("Room not found", 404, "ROOM_DELETED");
  }

  const campus = await Campus.findById(room.campus)
    .select("owner members")
    .session(session);

  if (!campus) {
    throw accessError("Campus not found", 404, "CAMPUS_NOT_FOUND");
  }

  const isOwner = String(campus.owner) === String(userId);
  const isMember = campus.members.some(
    (memberId) => String(memberId) === String(userId)
  );

  if (!isOwner && !isMember) {
    throw accessError(
      "Join this campus to access its rooms.",
      403,
      "ROOM_FORBIDDEN"
    );
  }

  if (room.isLocked && !isOwner && !allowLocked) {
    throw accessError(
      "This room is locked. Only the campus owner can enter.",
      403,
      "ROOM_LOCKED"
    );
  }

  return room;
}