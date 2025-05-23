const express = require('express');
const router = require('../routes');
const path = require('path');
const app = express();
const cors = require('cors');

const PORT = 3000;

const Methods = {
    startWebServer: () => {
        app.use(express.json());
        app.use(cors({ origin: '*' }));
        app.use(express.static(path.join(__dirname, '../frontend')));
        app.use(router);
        app.listen(PORT, () => {
            console.log(`Web server started on port ${PORT}. Server running on http://localhost:${PORT}`);

        })
    }
}

module.exports = Methods;