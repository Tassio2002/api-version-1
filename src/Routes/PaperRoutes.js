const { Router } = require('express')
const { verifyJWT } = require('../Services/api-key')
const { createPaper, getPaper, updatePaper, deletePaper } = require('../Controllers/PaperController')

const router = Router()

router.post('/paper', verifyJWT, createPaper)
router.get('/papers/:user_id/:author_id', verifyJWT, getPaper)
router.patch('/paper/:user_id/:author_id', verifyJWT, updatePaper)
router.delete('/paper/:user_id/:author_id/:paper_id', deletePaper)

module.exports = router