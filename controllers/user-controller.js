const express = require("express");
const UserModal = require("../models/userModel");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_TOKEN = process.env.JWT_TOKEN;

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  // STEP-1) VALIDATING DATA, IF ERROS? THEN RETURN RESPONSE, ELSE KEEP GOING
  await body("name")
    .isLength({ min: 4, max: undefined, discreteLengths: undefined })
    .withMessage("Put Valid name")
    .run(req);
  await body("email").isEmail().withMessage("Invalid email format").run(req);
  await body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Step 2: Check if User Already Exists
  try {
    const userExist = await UserModal.findOne({ email });
    if (userExist) {
      return res
        .status(409)
        .json({ message: "User already exists. Please log in." });
    }
  } catch (err) {
    return res.status(500).json({ error: "Database query failed." });
  }

  // Step 3: Create New User
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Could not hash the password. Please try again." });
  }

  const newUser = new UserModal({ name, email, password: hashedPassword });
  try {
    await newUser.save();
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Saving user failed. Please try again." });
  }

  // Step 4: Generate JWT Token
  let token;
  try {
    token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      JWT_TOKEN, // Use env variable for security
      { expiresIn: "1h" }
    );
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Token generation failed. Please try again." });
  }

  // Step 5: Respond with Success
  return res.status(201).json({
    message: "🥳 User has been created!",
    data: {
      userId: newUser.id,
      email: newUser.email,
      token,
    },
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Step 1: Validate Input
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  // Step 2: Check if User Exists
  let user;
  try {
    user = await UserModal.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User does not exist. Please sign up.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Database query failed. Please try again later.",
    });
  }

  // Step 3: Validate Password
  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid credentials. Please try again.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Password validation failed. Please try again.",
    });
  }

  // Step 4: Generate JWT Token
  let token;
  try {
    token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_TOKEN, // Use an environment variable for security
      { expiresIn: "1h" }
    );
  } catch (err) {
    return res.status(500).json({
      message: "Token generation failed. Please try again.",
    });
  }

  // Step 5: Respond with Success
  return res.status(200).json({
    userId: user.id,
    email: user.email,
    token,
  });
};

exports.logout = (req, res) => {
  res.json({
    message: "Logout successfully.",
  });
};
