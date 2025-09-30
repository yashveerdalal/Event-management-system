import Review from "../models/Review.js";
import Event from "../models/Event.js";

// @desc    Get reviews for an event
// @route   GET /api/reviews/:eventId
// @access  Public
export const getReviewsForEvent = async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId }).populate(
      "user",
      "name"
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new review
// @route   POST /api/reviews/:eventId
// @access  Private
export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // --- Recommended Improvement ---
    // Check if the user has already reviewed this event
    const alreadyReviewed = await Review.findOne({
      event: req.params.eventId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Event already reviewed" });
    }
    // ----------------------------

    const review = new Review({
      rating: Number(rating),
      comment,
      user: req.user._id,
      event: req.params.eventId,
    });

    const createdReview = await review.save();
    res.status(201).json(createdReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
