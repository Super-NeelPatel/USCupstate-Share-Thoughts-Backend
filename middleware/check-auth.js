const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_TOKEN = process.env.JWT_TOKEN;

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; //Authorization: "Bearer TOKEN"
    if (!token) {
      console.log("Authentication Failed");
    }

    const decodedToken = jwt.verify(token, JWT_TOKEN);
    // console.log("After token checked: ", decodedToken);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    res.status(401).json({
      err: "Authentication failed",
    });
  }
};
