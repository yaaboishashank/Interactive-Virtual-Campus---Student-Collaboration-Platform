import crypto from "crypto";
import mongoose from "mongoose";
import Campus from "../models/campus.model.js";
import Room from "../models/room.model.js";
import Message from "../models/message.model.js";
import {
  withMemberQueue,
} from "../services/roomQueue.service.js";


export const createCampus = async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Campus name is required",
      });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex");

    const campus = await Campus.create({
      name,
      description,
      isPrivate,
      inviteCode,
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      success: true,
      message: "Campus created successfully",
      campus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyCampuses = async (req, res) => {
  try {
    const campuses = await Campus.find({
      members: req.user._id,
    }).populate("owner", "name email avatar");

    res.status(200).json({
      success: true,
      count: campuses.length,
      campuses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const joinCampus = async (req, res) => {
  try {
    const rawCode = req.body?.inviteCode;

    if (
      typeof rawCode !== "string" ||
      !/^[a-f0-9]{8}$/i.test(rawCode.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 8-character invite code.",
      });
    }

    const inviteCode = rawCode.trim().toLowerCase();

    const campus = await withMemberQueue(
      req.user._id,
      async () => {
        // Repeated join requests do not duplicate membership.
        return Campus.findOneAndUpdate(
          { inviteCode },
          { $addToSet: { members: req.user._id } },
          { returnDocument: "after", runValidators: true }
        ).populate("owner", "name avatar");
      }
    );

    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Invalid invite code or campus no longer exists.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Campus membership confirmed.",
      campus,
    });
  } catch (error) {
    console.error("Join campus failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to join campus. Please try again.",
    });
  }
};

export const getCampusById = async (req, res) => {
  try {
    const campus = await Campus.findById(req.params.id);

    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Campus not found",
      });
    }

    const userId = String(req.user._id);
    const isOwner = String(campus.owner) === userId;
    const isMember = campus.members.some(
      (memberId) => String(memberId) === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Join this campus to view its details.",
      });
    }

    await campus.populate([
      { path: "owner", select: "name avatar" },
      { path: "members", select: "name avatar" },
    ]);

    return res.status(200).json({
      success: true,
      campus,
    });
  } catch (error) {
    const invalidId = error.name === "CastError";

    if (!invalidId) {
      console.error("Get campus failed:", error);
    }

    return res.status(invalidId ? 400 : 500).json({
      success: false,
      message: invalidId
        ? "Invalid campus ID"
        : "Unable to load campus.",
    });
  }
};

export const updateCampus = async (req, res) => {
  try {
    // Check ownership before populating the owner.
    const campus = await Campus.findById(req.params.id);

    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Campus not found",
      });
    }

    if (String(campus.owner) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only owner can update this campus",
      });
    }

    const { name, description, isPrivate } = req.body || {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 80
      ) {
        return res.status(400).json({
          success: false,
          message: "Campus name must contain 1–80 characters.",
        });
      }

      campus.name = name.trim();
    }

    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        description.trim().length > 300
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be at most 300 characters.",
        });
      }

      campus.description = description.trim();
    }

    if (isPrivate !== undefined) {
      if (typeof isPrivate !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Privacy must be true or false.",
        });
      }

      campus.isPrivate = isPrivate;
    }

    await campus.save();

    // Return the same shape as the campus details endpoint.
    await campus.populate([
      { path: "owner", select: "name avatar" },
      { path: "members", select: "name avatar" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Campus updated successfully",
      campus,
    });
  } catch (error) {
    const invalidInput =
      error.name === "CastError" ||
      error.name === "ValidationError";

    if (!invalidInput) {
      console.error("Update campus failed:", error);
    }

    return res.status(invalidInput ? 400 : 500).json({
      success: false,
      message: invalidInput
        ? "Invalid campus ID or campus details."
        : "Unable to update campus.",
    });
  }
};

export const deleteCampus = async (req, res) => {
  const campusId = req.params.id;

  if (!mongoose.isObjectIdOrHexString(campusId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid campus ID.",
    });
  }

  try {
    let deletedRoomIds = [];
    let deletedCampusName = "";

    await mongoose.connection.transaction(async (session) => {
      const campus = await Campus.findById(campusId).session(session);

      if (!campus) {
        const error = new Error("Campus not found.");
        error.status = 404;
        throw error;
      }

      if (String(campus.owner) !== String(req.user._id)) {
        const error = new Error(
          "Only the campus owner can delete this campus."
        );
        error.status = 403;
        throw error;
      }

      deletedCampusName = campus.name;

      const rooms = await Room.find({
        campus: campus._id,
      })
        .select("_id")
        .session(session);

      deletedRoomIds = rooms.map((room) => String(room._id));

      if (deletedRoomIds.length > 0) {
        await Message.deleteMany(
          {
            room: {
              $in: deletedRoomIds,
            },
          },
          { session }
        );

        await Room.deleteMany(
          {
            _id: {
              $in: deletedRoomIds,
            },
          },
          { session }
        );
      }

      await Campus.deleteOne(
        {
          _id: campus._id,
        },
        { session }
      );
    });

    const io = req.app.get("io");

    io?.deleteCampusConnections?.({
      campusId,
      roomIds: deletedRoomIds,
      message: `"${deletedCampusName}" was deleted by its owner.`,
    });

    return res.status(200).json({
      success: true,
      message: "Campus, rooms and messages deleted successfully.",
      campusId,
      deletedRooms: deletedRoomIds.length,
    });
  } catch (error) {
    const status = error.status || 500;

    if (status === 500) {
      console.error("Campus deletion failed:", error);
    }

    return res.status(status).json({
      success: false,
      message:
        status === 500
          ? "Campus could not be deleted. Please try again."
          : error.message,
    });
  }
};

export const getCampusInvite = async (req, res) => {
  try {
    const inviteCode = req.params.inviteCode.trim().toLowerCase();

    if (!/^[a-f0-9]{8}$/.test(inviteCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invite code.",
      });
    }

    const campus = await Campus.findOne({ inviteCode })
      .select("name description owner members isPrivate")
      .populate("owner", "name");

    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "This invite is invalid or the campus was deleted.",
      });
    }

    const userId = String(req.user._id);
    const alreadyMember =
      String(campus.owner?._id) === userId ||
      campus.members.some((id) => String(id) === userId);

    // Preview exposes campus information, not the member roster.
    return res.status(200).json({
      success: true,
      campus: {
        _id: campus._id,
        name: campus.name,
        description: campus.description,
        isPrivate: campus.isPrivate,
        ownerName: campus.owner?.name || "Campus Admin",
      },
      alreadyMember,
    });
  } catch (error) {
    console.error("Invite preview failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load this invite.",
    });
  }
};

export const leaveCampus = async (req, res) => {
  try {
    const campusId = req.params.id;
    const userId = req.user._id;

    await withMemberQueue(userId, async () => {
      const campus = await Campus.findById(campusId);

      if (!campus) {
        const error = new Error("Campus not found.");
        error.status = 404;
        throw error;
      }

      if (String(campus.owner) === String(userId)) {
        const error = new Error(
          "The campus owner cannot leave their own campus."
        );
        error.status = 403;
        throw error;
      }

      const io = req.app.get("io");

      if (typeof io?.removeCampusMember !== "function") {
        const error = new Error(
          "Campus connection service is unavailable. Please try again."
        );
        error.status = 503;
        throw error;
      }

      // Repeated leave requests are safe.
      await Campus.updateOne(
        {
          _id: campusId,
          owner: { $ne: userId },
        },
        {
          $pull: { members: userId },
        }
      );

      io.removeCampusMember(campusId, userId);
    });

    return res.status(200).json({
      success: true,
      message: "You have left the campus.",
      campusId,
    });
  } catch (error) {
    const status =
      error.status || (error.name === "CastError" ? 400 : 500);

    if (status === 500) {
      console.error("Leave campus failed:", error);
    }

    return res.status(status).json({
      success: false,
      message:
        status === 500
          ? "Unable to leave campus. Please try again."
          : error.name === "CastError"
            ? "Invalid campus ID."
            : error.message,
    });
  }
};