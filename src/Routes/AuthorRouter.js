const { Router } = require('express')
const { verifyJWT } = require('../Services/api-key')
const { createAuthor } = require('../Controllers/AuthorController')

const router = Router()


router.post('/author/:user_id', verifyJWT, createAuthor)

module.exports = router