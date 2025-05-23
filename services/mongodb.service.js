const mongodb = require('mongodb');
require('dotenv').config();

const Constants = {
    MongoConnectionString: process.env.MONGODB_CONNECTION_STRING,
    MainDB: process.env.MONGODB_DATABASE_NAME,
    DB: null,
    Client: null
}

const Methods = {
    connectToMongoDB: async () => {
        try {
            Constants.Client = new mongodb.MongoClient(Constants.MongoConnectionString, { tls: true });
            await Constants.Client.connect();
            console.log("Connected to MongoDB");
            Constants.DB = Constants.Client.db(Constants.MainDB);
        } catch (err) {
            console.error("Error while connecting to mongoDB", err);
            throw err;
        }
    },
    getCollection: async (collectionName) => {
        if (!Constants.DB) {
            await Methods.connectToMongoDB();
        }
        return Constants.DB.collection(collectionName);

    }


}

async function testMongo() {
    // await Methods.connectToMongoDB();
    let testCollection = await Methods.getCollection("test");
    // Insert
    await testCollection.insertOne({ Message: "Test" });
    await testCollection.insertOne({ name: "Ioana" });

    // Get collection data
    const results = await testCollection.find({}).toArray();
    console.log("Results are", results);
}

module.exports = Methods;


//testMongo();