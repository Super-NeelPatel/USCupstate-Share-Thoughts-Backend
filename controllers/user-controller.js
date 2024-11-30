const express = require("express");
const UserModal = require("../models/userModel");
const { body, validationResult } = require("express-validator");

exports.getStartingPage = (req, res) => {
  res.send("<h1>Home page after login</h1>");
};

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

  // STEP-2) IF USER ALREADY EXISTS, THEN RETURN WITH JSON RESPONSE THAT "USER ALRADY EXISTS."

  let userExist = await UserModal.findOne({ email });
  if (userExist) {
    return res.json({ message: "User Already exist. Please Log in." });
  }

  // STEP-3) BY THE TIME, WE KNOW THAT OUR DATA IS VALID AND IT IS NEW EMAIL;THERFORE, THEN CREATE NEW USER
  let newUser;
  try {
    newUser = new UserModal({ name, email, password });
    await newUser.save();
    return res.json({
      message: "🥳User has been created!",
    });
  } catch (err) {
    res.json({
      message: err,
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // STEP-1)) CHECK IF USER IS EXIST IN DATABASE

  if (!email || !password) {
    return res.json({
      message: "Invalid email or password. Or email or password is empty.",
    });
  }
  // STEP-2)) IF EXIST THEN REDIRECT TO HOME PAGE
  let user;
  try {
    user = await UserModal.findOne({ email });

    //USER THEN CHECK IF PASSWORD MATCHS
    console.log(user);

    if (!user) {
      return res.json({
        message: "User does not exist. Please Sign up.",
      });
    }
    if (user.email === email && user.password === password) {
      return res.redirect("/api/users/");
    } else {
      return res.json({
        message: "Wrong email or password.",
      });
    }
  } catch (err) {
    //RUNS CATCH BLOCK WHEN USER IS NOT FOUND
    res.json({
      message: "Something went wrong, try again later.",
    });
  }
};
