const express = require("express");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
require('dotenv').config();

const User = require("../models/userSchema");

// Email regex for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET all users (for dev only — remove in production)
router.get("/", async (req, res) => {
  try {
    const allUsers = await User.find().select('-password'); // exclude password
    return res.status(200).json({ data: allUsers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Register
router.post("/auth/register", async (req, res) => {
  const { name, email, password, role = "" } = req.body;

  // Validate name
  if (!name || !/^[A-Za-z.\s]{2,50}$/.test(name.trim())) {
    return res.status(400).json({ message: "Name must be 2-50 letters, spaces, or dots" });
  }

  // Validate email
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Email is invalid" });
  }

  // Validate password
  if (!password || password.length < 6 || password.length > 50) {
    return res.status(400).json({ message: "Password must be 6-50 characters" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // ✅ FIX: Hash the ACTUAL user password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    // Don't send password back
    const { password: _, ...userResponse } = newUser.toObject();
    return res.status(201).json({ data: userResponse });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Login
router.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Email is not registered" });
    }

    // ✅ Compare actual provided password with hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // ✅ Include user ID in token (more secure)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '3h' }
    );

    return res.status(200).json({
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;