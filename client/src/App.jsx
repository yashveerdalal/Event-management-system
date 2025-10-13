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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
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
      const endpoint = isLoginView ? "/api/auth/login" : "/api/auth/register";
      const payload = isLoginView
        ? { email, password }
        : { name, email, password };

      const { data } = await api.post(endpoint, payload);
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

// --- (Remaining Components unchanged, same as your original) ---

// Keep the rest of your EventListPage, EventDetailPage, ReviewSection, LeaderboardSection, and App() code identical.
