const MongoDBService = require('./mongodb.service');
const bcrypt = require('bcrypt');
const Constants = {
    CollectionName: "users"
}
const Methods = {
    createUser: async (user) => {
        const { username, password } = user;
        const hashedPassword = await bcrypt.hash(password, 10);
        const userToStore = {
            username: username,
            password: hashedPassword,
            admin: "0"
        };

        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const result = await collection.insertOne(userToStore);
        return result;
    },
    verifyUser: async (user) => {
        const { username, password } = user;
        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const result = await collection.findOne({ username: username })
        if (result) {
            const match = await bcrypt.compare(password, result.password);
            if (match === true) return result;
        }
        return null;
    },
    verifyExistingUser: async (user) => {
        const { username } = user;
        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const result = await collection.findOne({ username: username });
        return result;
    },
    isUserAdmin: async (user) => {
        const { username } = user;
        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const result = await collection.findOne({ username: username, admin: "1" });
        return result;
    }

}

module.exports = Methods;