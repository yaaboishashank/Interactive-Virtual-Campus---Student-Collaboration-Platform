import express from "express";
import {
  createCampus,
  getMyCampuses,
  joinCampus,
  getCampusById,
  updateCampus,
  deleteCampus,
  getCampusInvite,
  leaveCampus,
} from "../controllers/campus.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createCampus);
router.get("/", getMyCampuses);
router.post("/join", joinCampus);

router.get("/invite/:inviteCode", getCampusInvite);
router.post("/:id/leave", leaveCampus);

router.get("/:id", getCampusById);
router.patch("/:id", updateCampus);
router.delete("/:id", deleteCampus);

export default router;