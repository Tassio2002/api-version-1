const { Router } = require('express')
const router = Router()

//Controllers
const { getAllUsers } = require('../Controllers/UserController')

router.get('/users', getAllUsers)

module.exports = router