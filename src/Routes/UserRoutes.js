const { Router } = require('express')

const { getAllUsers, patchUser, deleteUser, signup, profile, login } = require('../Controllers/UserController')
const { verifyJWT } = require('../Services/api-key')

const router = Router()

router.get('/getusers', getAllUsers)
router.post('/signup', signup)
router.patch('/user/:user_id', verifyJWT, patchUser)
router.delete('/user/:user_id', verifyJWT, deleteUser)
router.get('/profile/:user_id', profile)
router.post('/login', login)

module.exports = router