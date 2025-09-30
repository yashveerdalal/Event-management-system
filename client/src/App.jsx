import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import "./App.css";

// --- IMPORTANT ---
// Make sure you have images in src/assets/ for the slider
import image1 from "./assets/image1.jpg";
import image2 from "./assets/image2.jpg";
import image3 from "./assets/image3.jpg";
import image4 from "./assets/image4.jpg";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Context & Auth ---
const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({ id: payload.id, name: payload.name });
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // NOTE: Assuming your backend now returns { _id, name, email, token }
  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser({ id: userData._id, name: userData.name });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  const authContextValue = { user, login, logout, isAuthenticated: !!user };
  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
const useAuth = () => useContext(AuthContext);

// --- Reusable UI Components ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ id, type, placeholder, value, onChange, ...props }) => (
  <input
    id={id}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="form-input"
    {...props}
  />
);

const Button = ({
  children,
  onClick,
  type = "button",
  className,
  ...props
}) => (
  <button
    onClick={onClick}
    type={type}
    className={`button ${className || ""}`}
    {...props}
  >
    {children}
  </button>
);

const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);

// --- Navigation ---
const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isCreateEventModalOpen, setCreateEventModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-container">
          <Link to="/" className="navbar-brand">
            EventSphere
          </Link>
          <div className="navbar-menu">
            {isAuthenticated ? (
              <>
                <span className="navbar-user">Welcome, {user.name}!</span>
                <Button onClick={() => setCreateEventModalOpen(true)}>
                  Create Event
                </Button>
                <Button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="button-secondary"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => setAuthModalOpen(true)}>
                Login / Register
              </Button>
            )}
          </div>
        </div>
      </nav>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      {isAuthenticated && (
        <CreateEventModal
          isOpen={isCreateEventModalOpen}
          onClose={() => setCreateEventModalOpen(false)}
        />
      )}
    </>
  );
};

// --- Modals ---
const AuthModal = ({ isOpen, onClose }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // ✅ API Path Fix: Uses the correct /api prefix
      const endpoint = isLoginView ? "/api/auth/login" : "/api/auth/register";

      const payload = isLoginView
        ? { email, password }
        : { name, email, password };

      const { data } = await api.post(endpoint, payload);

      // Pass the necessary user data to the login context
      login(data.token, data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred. Check server logs."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLoginView ? "Login" : "Create Account"}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="error-message">{error}</p>}
        {!isLoginView && (
          <Input
            id="name"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <Input
          id="email"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Processing..." : isLoginView ? "Login" : "Create Account"}
        </Button>
        <p className="auth-form-switch">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}
          <button type="button" onClick={() => setIsLoginView(!isLoginView)}>
            {/* ✅ LOGIC FIX: Text shows the action the button will perform (switch to register, or switch to login) */}
            {isLoginView ? "Register" : "Login"} 
          </button>
        </p>
      </form>
    </Modal>
  );
};

const CreateEventModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // ✅ API Path Fix: Uses the correct /api prefix
      await api.post("/api/events", {
        title,
        description,
        date,
        location,
        image,
      });

      onClose();
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Event">
      <form onSubmit={handleSubmit} className="create-event-form">
        {error && <p className="error-message">{error}</p>}
        <Input
          id="title"
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          id="description"
          placeholder="Event Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-textarea"
          required
        />
        <Input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Input
          id="location"
          type="text"
          placeholder="Location (e.g., Campus Auditorium)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <Input
          id="image"
          type="text"
          placeholder="Image URL (optional)"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Event"}
        </Button>
      </form>
    </Modal>
  );
};

// --- Page Components ---
const ImageSlider = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setCurrentIndex((prev) => (prev + 1) % images.length),
      5000
    );
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="slider-container">
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Slide ${index}`}
          className={index === currentIndex ? "slide active" : "slide"}
        />
      ))}
    </div>
  );
};

const EventCard = ({ event }) => (
  <div className="event-card">
    <div className="event-card-image-wrapper">
      <img
        className="event-card-image"
        src={
          event.image ||
          `https://source.unsplash.com/random/400x300?university,event,${event.title}`
        }
        alt={event.title}
      />
    </div>
    <div className="event-card-body">
      <h3 className="event-card-title">{event.title}</h3>
      <div className="event-card-meta">
        <span>📅 {new Date(event.date).toLocaleDateString()}</span>
        <span>📍 {event.location}</span>
      </div>
      <Link to={`/events/${event._id}`} className="button">
        View Details
      </Link>
    </div>
  </div>
);

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const slideImages = [image1, image2, image3, image4];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // ✅ API Path Fix: Uses the correct /api prefix
        const { data } = await api.get("/api/events");
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <Spinner />;
  return (
    <>
      <ImageSlider images={slideImages} />
      <div className="container page-container">
        <h1 className="page-title">Upcoming University Events 📒</h1>
        <p className="page-subtitle">
          Discover, connect, and participate in the vibrant life of our campus.
          Here's what's happening next.
        </p>
        {events.length === 0 ? (
          <p className="page-subtitle">
            No events found. Why not create the first one?
          </p>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const EventDetailPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState("idle");
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchEvent = async () => {
    try {
      setLoading(true);
      // ✅ API Path Fix: Uses the correct /api prefix
      const { data } = await api.get(`/api/events/${id}`);
      setEvent(data);
    } catch (error) {
      console.error("Failed to fetch event:", error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        // ✅ API Path Fix: Uses the correct /api prefix
        await api.delete(`/api/events/${id}`);
        navigate("/");
      } catch (error) {
        alert("Failed to delete event.");
      }
    }
  };

  const handleRegister = async () => {
    setRegistrationStatus("registering");
    try {
      // ✅ API Path Fix: Uses the correct /api prefix
      await api.post(`/api/events/${id}/register`);
      setRegistrationStatus("registered");
      setTimeout(() => {
        fetchEvent();
      }, 1500);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to register.");
      setRegistrationStatus("idle");
    }
  };

  if (loading) return <Spinner />;
  if (!event)
    return (
      <div className="container page-container">
        <p className="error-message">Event not found.</p>
      </div>
    );

  const isOrganizer = user?.id === event.organizer._id;
  const isRegistered =
    event.attendees?.some((attendee) => attendee._id === user?.id) ||
    registrationStatus === "registered";

  const getRegisterButtonContent = () => {
    if (isRegistered) return <>✔ Registered</>;
    if (registrationStatus === "registering") return "Registering...";
    return "Register for Event";
  };

  return (
    <div className="container page-container">
      <div className="event-detail-card">
        <img
          className="event-detail-image"
          src={
            event.image ||
            `https://source.unsplash.com/random/1200x400?university,event,${event.title}`
          }
          alt={event.title}
        />
        <div className="event-detail-body">
          <h1 className="event-detail-title">{event.title}</h1>
          <div className="event-detail-meta">
            <p>📅 {new Date(event.date).toLocaleString()}</p>
            <p>📍 {event.location}</p>
            <p>
              👤 Organized by <strong>{event.organizer.name}</strong>
            </p>
          </div>

          <div className="event-actions">
            {isAuthenticated && !isOrganizer && (
              <Button
                onClick={handleRegister}
                className={isRegistered ? "button-success" : ""}
                disabled={isRegistered || registrationStatus === "registering"}
              >
                {getRegisterButtonContent()}
              </Button>
            )}
            {isOrganizer && (
              <Button className="button-danger" onClick={handleDelete}>
                Delete Event
              </Button>
            )}
          </div>

          <p className="event-detail-description">{event.description}</p>

          {isOrganizer && (
            <div className="attendees-section">
              <h2 className="section-title">
                Event Attendees ({event.attendees.length})
              </h2>
              {event.attendees.length > 0 ? (
                <ul className="attendees-list">
                  {event.attendees.map((attendee) => (
                    <li key={attendee._id} className="attendee-item">
                      <span className="attendee-name">{attendee.name}</span>
                      <span className="attendee-email">{attendee.email}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No one has registered for this event yet.</p>
              )}
            </div>
          )}

          <div className="event-detail-sections">
            <ReviewSection eventId={event._id} />
            <LeaderboardSection event={event} setEvent={setEvent} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewSection = ({ eventId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // ✅ API Path Fix: Uses the correct /api prefix
      const { data } = await api.get(`/api/reviews/${eventId}`);
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [eventId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
    try {
      // ✅ API Path Fix: Uses the correct /api prefix
      await api.post(`/api/reviews/${eventId}`, { comment, rating });
      setComment("");
      setRating(0);
      setHover(0);
      fetchReviews();
    } catch (error) {
      alert("Failed to post review.");
    }
  };

  return (
    <div className="detail-section">
      <h2 className="section-title">Reviews</h2>
      {isAuthenticated ? (
        <form onSubmit={handleReviewSubmit} className="review-form">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="form-textarea"
            required
          />
          <div className="star-rating">
            {[...Array(5)].map((star, index) => {
              const ratingValue = index + 1;
              return (
                <button
                  type="button"
                  key={ratingValue}
                  className={ratingValue <= (hover || rating) ? "on" : "off"}
                  onClick={() => setRating(ratingValue)}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                >
                  <span className="star">★</span>
                </button>
              );
            })}
          </div>
          <Button type="submit">Post Review</Button>
        </form>
      ) : (
        <p className="login-prompt">Please log in to post a review.</p>
      )}

      <div className="reviews-list">
        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r._id} className="review-item">
              <p>"{r.comment}"</p>
              <span className="review-author">
                - {r.user.name} ({"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)})
              </span>
            </div>
          ))
        ) : (
          <p>No reviews yet. Be the first to leave one!</p>
        )}
      </div>
    </div>
  );
};

const LeaderboardSection = ({ event, setEvent }) => {
  const [name, setName] = useState("");
  const [score, setScore] = useState("");
  const { user } = useAuth();
  const isOrganizer = user?.id === event.organizer._id;

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      // ✅ API Path Fix: Uses the correct /api prefix
      const { data } = await api.put(`/api/events/${event._id}`, {
        name,
        score,
      });
      setEvent(data);
      setName("");
      setScore("");
    } catch (error) {
      alert("Failed to update leaderboard.");
    }
  };

  return (
    <div className="detail-section">
      <h2 className="section-title">Leaderboard</h2>
      {isOrganizer && (
        <form onSubmit={handleAddEntry} className="leaderboard-form">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="number"
            placeholder="Score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
          />
          <Button type="submit">Add</Button>
        </form>
      )}
      <ol className="leaderboard-list">
        {event.leaderboard?.length > 0 ? (
          event.leaderboard.map((entry, i) => (
            <li key={i} className="leaderboard-item">
              <span>{entry.name}</span>
              <span className="leaderboard-score">{entry.score}</span>
            </li>
          ))
        ) : (
          <p>No entries yet.</p>
        )}
      </ol>
    </div>
  );
};

// --- Main App Component ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-wrapper">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<EventListPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
            </Routes>
          </main>
          <footer className="footer">
            <p>
              &copy; {new Date().getFullYear()} EventSphere. All rights
              reserved.
            </p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
