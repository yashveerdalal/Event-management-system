// File: server/controllers/eventController.js
import Event from "../models/Event.js";

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email")
      .populate("attendees", "name email"); // This line was added

    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
export const createEvent = async (req, res) => {
  const { title, description, date, location, image } = req.body;
  try {
    const event = new Event({
      title,
      description,
      date,
      location,
      image: image || "/images/sample.jpg",
      organizer: req.user._id,
      attendees: [],
    });
    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an event's leaderboard
// @route   PUT /api/events/:id
// @access  Private (Organizer only)
export const updateEventLeaderboard = async (req, res) => {
  const { name, score } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "User not authorized" });
    }
    event.leaderboard.push({ name, score: Number(score) });
    event.leaderboard.sort((a, b) => b.score - a.score);
    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Organizer only)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "User not authorized" });
    }
    await event.deleteOne();
    res.json({ message: "Event removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register user for an event
// @route   POST /api/events/:id/register
// @access  Private
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (
      event.attendees.some(
        (attendeeId) => attendeeId.toString() === req.user._id.toString()
      )
    ) {
      return res
        .status(400)
        .json({ message: "Already registered for this event" });
    }

    event.attendees.push(req.user._id);
    await event.save();
    res.status(200).json({ message: "Successfully registered for event" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
