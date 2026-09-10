import express from "express";
import {
    createRoom,
    getCampusRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
} from "../controllers/room.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/:campusId", createRoom);
router.get("/:campusId", getCampusRooms);

router.get("/details/:id", getRoomById);
router.patch("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;