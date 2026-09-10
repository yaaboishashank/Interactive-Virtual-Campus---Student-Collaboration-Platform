import mongoose from "mongoose";
import Room from "../models/room.model.js";
import Message from "../models/message.model.js";
import {
  accessError,
  requireRoomAccess,
} from "./roomAccess.service.js";
import {
  withRoomQueue,
  withMemberQueue,
} from "./roomQueue.service.js";

export async function saveRoomMessage({
  roomId,
  userId,
  text,
  assertActive,
}) {
  if (
    typeof text !== "string" ||
    !text.trim() ||
    text.trim().length > 500
  ) {
    throw accessError(
      "Message must contain 1–500 characters.",
      400,
      "INVALID_MESSAGE"
    );
  }

  if (
    typeof roomId !== "string" ||
    !mongoose.isObjectIdOrHexString(roomId)
  ) {
    throw accessError("Invalid room ID", 400, "INVALID_ROOM");
  }

  return withRoomQueue(roomId, () =>
    withMemberQueue(userId, async () => {
      assertActive?.();

      let savedMessage;

      await mongoose.connection.transaction(async (session) => {
        assertActive?.();

        const room = await Room.findOneAndUpdate(
          { _id: roomId },
          { $inc: { __v: 1 } },
          {
            session,
            returnDocument: "after",
            timestamps: false,
          }
        );

        if (!room) {
          throw accessError(
            "Room no longer exists.",
            404,
            "ROOM_DELETED"
          );
        }

        await requireRoomAccess(roomId, userId, { session });
        assertActive?.();

        const [message] = await Message.create(
          [
            {
              room: roomId,
              sender: userId,
              text: text.trim(),
            },
          ],
          { session }
        );

        await message.populate({
          path: "sender",
          select: "name avatar",
          options: { session },
        });

        savedMessage = message;
      });

      return savedMessage;
    })
  );
}