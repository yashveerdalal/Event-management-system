import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// --- START: Universal CORS Configuration for Development (FINAL FIX) ---
// WARNING: This allows ALL domains to access your API.
// This is necessary because Vercel preview URLs change frequently.
// If you move to a stable production domain, revert 'origin' to process.env.FRONTEND_URL.
const corsOptions = {
  // SETTING ORIGIN TO '*' FIXES THE FINAL "ORIGIN IS NOT ALLOWED" ERROR.
  origin: "*", 
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

// Handle CORS preflight requests
app.options("*", cors(corsOptions)); 
// Apply CORS to all requests
app.use(cors(corsOptions));
// --- END: Universal CORS Configuration for Development ---

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
