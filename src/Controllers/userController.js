const bcrypt = require("bcrypt");
require("dotenv").config({ path: '../../.env' });
const jwtToken = require("../Helpers/tokenGen");

const userModel = require("../Models/userModel");
const mailSender = require("../Helpers/mailSender");

const soltRounds = process.env.SOLT_ROUNDS || 10;
console.log(soltRounds);

async function register(req, res) {
    const data = req.body;
    try {
        const userNameUniqueness = await userModel.find({ userName: data.userName }).countDocuments();
        const emailUniqueness = await userModel.find({ email: data.email }).countDocuments();
        if (userNameUniqueness === 0 && emailUniqueness === 0) {
            const validData = {
                name: data.name,
                email: data.email,
                password: await bcrypt.hash(data.password, soltRounds),
                userType: data.userType,
                userName: data.userName
            };
            const result = await userModel.create(validData);
            res.status(200).send({
                name: result.name,
                email: result.email,
                password: result.password,
                userType: result.userType,
                userName: result.userName
            });
        } else if (userNameUniqueness != 0) { res.status(422).send({ message: "User name already taken" }); }
        else { res.status(422).send({ message: "email already taken" }); }
    } catch (error) { res.status(500).send({ message: error }); }
}

async function login(req, res) {
    const data = req.body;
    let validateField;
    if (data.email === '') { validateField = { userName: data.userName }; }
    else { validateField = { email: data.email }; }
    try {
        const registerdUser = await userModel.findOne(validateField);
        if (registerdUser != null) {
            const passwordMatch = bcrypt.compareSync(data.password, registerdUser.password);
            if (passwordMatch) {
                const token = jwtToken.generateToken(registerdUser.email, registerdUser.userType, registerdUser.name);

                const updateResult = await userModel.updateOne(validateField, { $addToSet: { tokens: token } });

                if (updateResult.nModified === 1 && updateResult.ok === 1) {
                    res.status(200).send({
                        name: registerdUser.name,
                        email: registerdUser.email,
                        userName: registerdUser.userName,
                        userType: registerdUser.userType,
                        token: token
                    });
                } else { res.status(500).send({ message: 'dataase error' }); }
            } else { res.status(401).send({ message: 'incorrect password' }); }
        } else { res.status(422).send({ message: 'user not registerd' }); }
    } catch (error) { res.status(500).send({ message: error }); }
}

async function logout(req, res) {
    const data = req.body;
    try {
        const registerdUser = await userModel.updateOne(
            { email: data.email },
            { $pull: { tokens: data.token } });
        console.log(registerdUser);
        if (registerdUser.nModified === 1 && registerdUser.ok === 1) {
            res.status(200).send({ message: 'success' });
        } else { res.status(500).send({ message: 'database error' }); }
    } catch (error) { res.status(500).send({ message: error }); }
}

async function forgotPassword(req, res) {
    const data = req.body;
    let validateField;
    if (data.email === '') validateField = { userName: data.userName }
    else validateField = { email: data.email }
    try {
        const registerdUser = await userModel.findOne(validateField);
        if (registerdUser != null) {
            console.log(registerdUser.email);
            const emailData = await mailSender.sendOTPMail(registerdUser.email);

            const addOTPResult = await userModel.updateOne({ email: registerdUser.email }, { otp: emailData.otp })

            if (addOTPResult.nModified === 1 && addOTPResult.ok === 1) {
                res.status(200).send({
                    email: registerdUser.email,
                    userName: registerdUser.userName,
                    userType: registerdUser.userType,
                    url: emailData.url,
                    name: registerdUser.name
                });
            } else { res.status(500).send({ message: 'database error' }); }
        } else { res.status(422).send({ message: 'user not registerd' }); }
    } catch (error) { res.status(500).send({ message: error }); }
}
async function verifyOTP(req, res) {
    const data = req.body;
    try {
        const registerdUser = await userModel.findOne({ email: data.email });
        if (registerdUser != null || registerdUser.otp != null || registerdUser.otp != undefined) {
            if (registerdUser.otp == data.otp) {
                const removeOTPResult = await userModel.updateOne({ email: registerdUser.email }, { $unset: { otp: 1 } });
                if (removeOTPResult.nModified === 1 && removeOTPResult.ok === 1) {
                    res.status(200).send({
                        email: registerdUser.email,
                        userName: registerdUser.userName,
                        userType: registerdUser.userType,
                        name: registerdUser.name
                    });
                } else { res.status(500).send({ message: 'database error' }); }
            } else { res.status(422).send({ message: 'invalid otp' }); }
        } else { res.status(422).send({ message: 'user not registerd' }); }
    } catch (error) { res.status(500).send({ message: error }); }
}

async function resetPassword(req, res) {
    const data = req.body;
    try {
        const registerdUser = await userModel.findOne({ email: data.email });
        if (registerdUser != null) {
            const passwordUpdateResult = await userModel.updateOne({ email: data.email }, { password: data.newPassword });
            if (passwordUpdateResult.nModified === 1 && passwordUpdateResult.ok === 1) {
                res.status(200).send({
                    email: registerdUser.email,
                    userName: registerdUser.userName,
                    userType: registerdUser.userType,
                    name: registerdUser.name
                });
            } else { res.status(500).send({ message: 'database error' }); }
        } else { res.status(422).send({ message: 'user not registerd' }); }
    } catch (error) { res.status(500).send({ message: error }); }
}
module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    verifyOTP,
    resetPassword,
}