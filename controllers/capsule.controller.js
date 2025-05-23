//const { request, json } = require("express");
const CapsulesService = require('../services/capsules.service');
const UserService = require('../services/user.service');
const Joi = require('joi');

const Methods = {
    getAllCapsules: async (req, res) => {
        const user = req.userInfo;
        // console.log(user);
        const allowAcces = await UserService.isUserAdmin(user);
        if (!allowAcces) {
            return res.status(404).json({ message: "Access forbidden" });
        }
        const result = await CapsulesService.getCapsules();
        res.status(200).send(result);

    },

    getCapsulesByUsername: async (req, res) => {
        const username = req.userInfo.userId;
        console.log(username);
        const capsules = await CapsulesService.getCapsuleByUser(username);

        res.status(200).send(capsules);
    },

    getOneCapsule: async (req, res) => {
        const id = req.params.id;
        // const capsule = Capsules.capsules[id];
        const user = req.userInfo;
        const capsule = await CapsulesService.getCapsuleByID(id);


        if (!capsule) {
            return res.status(404).json('Capsule ' + "'" + id + "'" + ' not found!');
        }

        if (!(capsule.author.toString() === user.userId)) {
            return res.status(403).json("Acces denied. Capsule must belong to you.");

        }

        console.log('Date now is: ' + new Date().toISOString())
        console.log('Capsule unlock date is ', capsule.unlockDate);

        if (new Date(capsule.unlockDate) > new Date()) {

            return res.status(200).json({ message: "Capsule is not unlocked yet" });

        }
        res.status(200).json(capsule);
    },
    createCapsule: async (req, res) => {
        const requestBody = req.body;
        const { message, unlockDate } = requestBody;
        const id = Date.now().toString();

        const schema = Joi.object({
            // message -  a string with length minimum 3 and required
            message: Joi.string().min(3).max(300).required(),
            unlockDate: Joi.date().iso().greater("now").required()

        })

        const validationResult = schema.validate(requestBody);
        // console.log(validationResult);
        // console.log(JSON.stringify(validationResult, null, 2));
        if (validationResult.error) {
            return res.status(400).json({ message: validationResult.error.details[0].message })
        }
        // console.log(validationResult);

        await CapsulesService.createCapsule(
            {
                id: id,
                message,
                createDate: new Date().toISOString(),
                unlockDate: requestBody.unlockDate,
                author: req.userInfo.userId
            }

        );
        return res.status(201).json({ message: "Your capsule has been created succesfully", id: id });

    },

    removeCapsule: async (req, res) => {

        const id = req.params.id;
        const username = req.userInfo.userId;
        const capsule = await CapsulesService.getCapsuleByID(id);
        if (capsule.author !== username) {
            return res.status(403).json({ message: "Access forbidden" });
        }
        const deleteResult = await CapsulesService.deleteCapsule(id);
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json('Capsule' + id + 'not found');
        }

        return res.status(200).json('ok!');
    }
}

module.exports = Methods;