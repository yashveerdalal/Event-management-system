import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEventLeaderboard,
  deleteEvent,
  registerForEvent, //
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getAllEvents).post(protect, createEvent);

router
  .route("/:id")
  .get(getEventById)
  .put(protect, updateEventLeaderboard)
  .delete(protect, deleteEvent);

// --- ADD THIS NEW ROUTE AT THE BOTTOM ---
router.route("/:id/register").post(protect, registerForEvent);

export default router;
