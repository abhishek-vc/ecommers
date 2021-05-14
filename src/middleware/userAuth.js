const userModel = require("../Models/userModel");
const jwt = require("jsonwebtoken");

async function userAuth(req, res, next) {
    const jwtKey = process.env.JWT_KEY;
    const token = req.header("Authorization").replace("Bearer ", "");
    const payload = jwt.verify(token, jwtKey);
    const registerdUser = await userModel.findOne({ email: payload.email });
    if (registerdUser != null) {
        if (registerdUser.userType === payload.userType && registerdUser.tokens.length != 0) {
            req.user = registerdUser;
            next();
        } else { return res.status(401).json({ message: "user is unauthorized" }); }
    } else { return res.status(422).json({ message: 'User not registered' }); }
}

module.exports = {
    userAuth
}