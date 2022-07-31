const { Router } = require('express')
const { verifyJWT } = require('../Services/api-key')
const { createAuthor, getAuthors, updateAuthor, deleteAuthor } = require('../Controllers/AuthorController')

const router = Router()

router.post('/author/:user_id', verifyJWT, createAuthor)
router.get('/authors/:user_id', getAuthors)
router.patch('/author/:user_id/:author_id', verifyJWT, updateAuthor)
router.delete('/author/:user_id/:author_id', verifyJWT, deleteAuthor)

module.exports = router