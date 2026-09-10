import Message from "../models/message.model.js";
import { requireRoomAccess } from "../services/roomAccess.service.js";
import { saveRoomMessage } from "../services/message.service.js";

function sendError(res, error) {
  const status = error.status || 500;

  if (status === 500) {
    console.error("Message request failed:", error);
  }

  return res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Unable to process messages. Please try again."
        : error.message,
  });
}

export const sendMessage = async (req, res) => {
  try {
    const message = await saveRoomMessage({
      roomId: req.params.roomId,
      userId: req.user._id,
      text: req.body?.text,
    });

    // REST se send kiya toh connected room users ko bhi milega.
    req.app
      .get("io")
      ?.to(req.params.roomId)
      .emit("receive-message", message);

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    await requireRoomAccess(req.params.roomId, req.user._id);

    const messages = await Message.find({
      room: req.params.roomId,
    })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1, _id: -1 })
      .limit(100);

    // Latest 100 select karke chat order old → new.
    messages.reverse();

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    return sendError(res, error);
  }
};