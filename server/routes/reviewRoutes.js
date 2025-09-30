import express from "express";
import {
  getReviewsForEvent,
  createReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.route("/:eventId").get(getReviewsForEvent).post(protect, createReview);

export default router;
