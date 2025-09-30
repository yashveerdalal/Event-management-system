import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();

connectDB();

const app = express();

// --- START: Robust CORS Configuration ---
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
};

// This line explicitly handles the browser's security check (the OPTIONS request)
// that was causing the 404 preflight error.
app.options("*", cors(corsOptions));

app.use(cors(corsOptions));
// --- END: Robust CORS Configuration ---

app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
