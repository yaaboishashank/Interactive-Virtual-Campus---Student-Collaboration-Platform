import express from "express";
import {
  sendMessage,
  getRoomMessages,
} from "../controllers/message.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/:roomId", sendMessage);
router.get("/:roomId", getRoomMessages);

export default router;