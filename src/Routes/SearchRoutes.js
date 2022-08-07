const { Router } = require('express')
const { verifyJWT } = require('../Services/api-key')
const { searchAuthor, searchPaper } = require('../Controllers/SearchController')

const router = Router()

router.get('/search/author', verifyJWT, searchAuthor)
router.get('/search/paper', verifyJWT, searchPaper)

module.exports = router