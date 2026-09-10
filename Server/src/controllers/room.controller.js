import mongoose from "mongoose";
import Campus from "../models/campus.model.js";
import Room from "../models/room.model.js";
import Message from "../models/message.model.js";
import {
  accessError,
  requireRoomAccess,
} from "../services/roomAccess.service.js";
import { withRoomQueue } from "../services/roomQueue.service.js";

function sendError(res, error) {
  const validationError =
    error.name === "ValidationError" ||
    error.name === "CastError";

  const status = error.status || (validationError ? 400 : 500);

  if (status === 500) {
    console.error("Room request failed:", error);
  }

  return res.status(status).json({
    success: false,
    code: error.code || "ROOM_REQUEST_FAILED",
    message:
      status === 500 ? "Unable to complete room request." : error.message,
  });
}

async function getCampusAccess(campusId, userId, ownerOnly = false) {
  const campus = await Campus.findById(campusId);

  if (!campus) {
    throw accessError("Campus not found.", 404, "CAMPUS_NOT_FOUND");
  }

  const isOwner = String(campus.owner) === String(userId);
  const isMember = campus.members.some(
    (memberId) => String(memberId) === String(userId)
  );

  if (ownerOnly && !isOwner) {
    throw accessError(
      "Only the campus owner can manage rooms.",
      403,
      "ROOM_FORBIDDEN"
    );
  }

  if (!isOwner && !isMember) {
    throw accessError(
      "Join this campus to view its rooms.",
      403,
      "ROOM_FORBIDDEN"
    );
  }

  return campus;
}

function getRoomValues(body = {}) {
  const values = {};

  for (const field of [
    "name",
    "description",
    "type",
    "capacity",
    "isLocked",
  ]) {
    if (body[field] !== undefined) {
      values[field] = body[field];
    }
  }

  if (
    values.capacity !== undefined &&
    (!Number.isInteger(values.capacity) ||
      values.capacity < 2 ||
      values.capacity > 100)
  ) {
    throw accessError(
      "Capacity must be a whole number between 2 and 100.",
      400,
      "INVALID_CAPACITY"
    );
  }

  if (
    values.isLocked !== undefined &&
    typeof values.isLocked !== "boolean"
  ) {
    throw accessError(
      "Room lock must be true or false.",
      400,
      "INVALID_LOCK"
    );
  }

  return values;
}

export const createRoom = async (req, res) => {
  try {
    const campus = await getCampusAccess(
      req.params.campusId,
      req.user._id,
      true
    );

    const room = await Room.create({
      ...getRoomValues(req.body),
      campus: campus._id,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getCampusRooms = async (req, res) => {
  try {
    await getCampusAccess(req.params.campusId, req.user._id);

    const rooms = await Room.find({
      campus: req.params.campusId,
    }).populate("createdBy", "name avatar");

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getRoomById = async (req, res) => {
  try {
    // Members may view room metadata.
    // Actual entry and message access still enforce the lock.
    const room = await requireRoomAccess(
      req.params.id,
      req.user._id,
      { allowLocked: true }
    );

    await room.populate([
      { path: "campus", select: "name" },
      { path: "createdBy", select: "name avatar" },
    ]);

    return res.status(200).json({ success: true, room });
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateRoom = async (req, res) => {
  try {
    const room = await withRoomQueue(req.params.id, async () => {
      const existingRoom = await Room.findById(req.params.id);

      if (!existingRoom) {
        throw accessError("Room not found.", 404, "ROOM_DELETED");
      }

      const campus = await getCampusAccess(
        existingRoom.campus,
        req.user._id,
        true
      );

      Object.assign(existingRoom, getRoomValues(req.body));
      await existingRoom.save();

      // Immediately remove non-owner connections if the room is locked.
      const io = req.app.get("io");
      io?.applyRoomUpdate?.(existingRoom, campus.owner);

      return existingRoom;
    });

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const deleteRoom = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      throw accessError("Invalid room ID.", 400, "INVALID_ROOM");
    }

    const roomId = req.params.id.toLowerCase();

    await withRoomQueue(roomId, async () => {
      await mongoose.connection.transaction(async (session) => {
        const room = await Room.findById(roomId).session(session);

        if (!room) {
          throw accessError("Room not found.", 404, "ROOM_DELETED");
        }

        const campus = await Campus.findById(room.campus)
          .select("owner")
          .session(session);

        if (
          !campus ||
          String(campus.owner) !== String(req.user._id)
        ) {
          throw accessError(
            "Only the campus owner can delete rooms.",
            403,
            "ROOM_FORBIDDEN"
          );
        }

        await Room.deleteOne({ _id: roomId }, { session });
        await Message.deleteMany({ room: roomId }, { session });
      });

      const io = req.app.get("io");

      if (io) {
        io.to(roomId).emit("room-deleted", {
          roomId,
          code: "ROOM_DELETED",
          message: "This room was deleted by the campus owner.",
        });

        io.in(roomId).disconnectSockets(true);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Room and its messages deleted successfully",
    });
  } catch (error) {
    return sendError(res, error);
  }
};