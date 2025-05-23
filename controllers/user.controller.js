const UserService = require('../services/user.service');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Methods = {
    registerUser: async (req, res) => {
        const requestBody = req.body;
        const { username, password } = requestBody;
        const schema = Joi.object({
            username: Joi.string().alphanum().min(3).max(20).required(),
            password: Joi.string().min(8).max(100).required()
        })
        const { error, value } = schema.validate(requestBody);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const verifyUser = await UserService.verifyExistingUser(value);
        if (!verifyUser) {
            UserService.createUser(value);
            return res.status(201).json({ message: "User was created succesfully." });
        }
        else return res.status(409).json({ message: "Username already exists." });
    },

    loginUser: async (req, res) => {
        const requestBody = req.body;
        const schema = Joi.object({
            username: Joi.string().alphanum().min(3).max(20).required(),
            password: Joi.string().min(8).max(100).required()
        })
        const { error, value } = schema.validate(requestBody);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const verifyUser = await UserService.verifyUser(value);
        if (!verifyUser) {
            return res.status(401).json({ message: "Invalid name or password." });
        }
        else {
            const token = jwt.sign(
                {
                    userId: verifyUser._id, username: verifyUser.username,
                },
                process.env.ACCES_TOKEN_SECRET, { expiresIn: '24h' }
            );
            return res.status(200).json(
                {
                    message: "Login was succesful",
                    token: token
                });
        }
    }

}

module.exports = Methods;