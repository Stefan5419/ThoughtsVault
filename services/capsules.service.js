const MongoDBService = require('./mongodb.service');
const Constants = {
    CollectionName: "capsules"
}

const Methods = {
    createCapsule: async (capsule) => {
        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const result = await collection.insertOne(capsule);
        console.log("MongoDB result is", result);

    },
    deleteCapsule: async (id) => {
        console.log("Deleting capsule with id", id);
        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const result = await collection.deleteOne({ id });
        console.log("Delete result is", result);
        return result;

    },
    getCapsules: async () => {

        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const results = await collection.find({}).toArray();
        return results;

    },
    getCapsuleByID: async (id) => {
        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const result = await collection.findOne({ id: id }, { projection: { _id: 0 } });
        return result;
    },
    getCapsuleByUser: async (userId) => {
        const collection = await MongoDBService.getCollection(Constants.CollectionName);
        const result = await collection.find({ author: userId }).toArray();
        return result;
    }
}

module.exports = Methods;