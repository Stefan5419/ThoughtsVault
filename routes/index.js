const path = require('path');
const router = require('express').Router();
const capsuleController = require('../controllers/capsule.controller');
const userController = require('../controllers/user.controller');
const Auth = require('../auth/auth-middleware');


router.get('/api/capsules', Auth.authenticateToken, capsuleController.
    getCapsulesByUsername);
router.get('/api/capsules/:id', Auth.authenticateToken, capsuleController.
    getOneCapsule);
router.post('/api/capsules', Auth.authenticateToken, capsuleController.
    createCapsule);
router.delete('/api/capsules/:id', Auth.authenticateToken,
    capsuleController.removeCapsule);
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
router.post('/register', userController.
    registerUser);
router.post('/login', userController.
    loginUser);
module.exports = router;