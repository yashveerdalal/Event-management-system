// File: server/models/Event.js
import mongoose from "mongoose";

const leaderboardEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true },
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    image: { type: String },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaderboard: [leaderboardEntrySchema],
    // --- THIS LINE WAS ADDED ---
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
