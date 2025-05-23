const webServerService = require('./services/web-server-service')
const mongoDBService = require('./services/mongodb.service');
const init = async () => {
    webServerService.startWebServer();
    await mongoDBService.connectToMongoDB();
}

init();