const { Router } = require('express')
const { verifyJWT } = require('../Services/api-key')
const { searchAuthor, searchPaper } = require('../Controllers/SearchController')

const router = Router()

router.get('/search/author', searchAuthor)
router.get('/search/paper', searchPaper)

module.exports = router