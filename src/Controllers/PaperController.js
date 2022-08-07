const pool = require('../Database/DBConnection')

const createPaper = async (req, res) => {
    const { user_id, author_id } = req.params
    const { paper_title, paper_summary, first_paragraph, body } = req.body
    try {
        const getAuthor = await pool.query('SELECT * FROM authors WHERE author_id = $1', [author_id])
        const newPaper = await pool.query('INSERT INTO papers (paper_title, paper_summary, first_paragraph, body, author_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [paper_title, paper_summary, first_paragraph, body, author_id, user_id])

            let authorId = getAuthor.rows[0].author_id
            let id = getAuthor.rows[0].id
            let authorName = getAuthor.rows[0].author_name
            let pictureURL = getAuthor.rows[0].picture

            let paperTitle = newPaper.rows[0].paper_title
            let paperSummary = newPaper.rows[0].paper_summary
            let firstPargraph = newPaper.rows[0].first_paragraph
            let Body = newPaper.rows[0].body
    
            resJSON = {
                "id": id,
                "author":{
                    "author_id": authorId,
                    "author_name": authorName,
                    "picture":pictureURL
                },
                "title": paperTitle,
                "summary": paperSummary,
                "first_paragraph": firstPargraph,
                "body": Body
            }

        return res.status(201).send(resJSON)
    } catch (err) {
        return res.status(400).send(err)
    }
}

const getPaper = async (req, res) => {
    const { user_id, author_id } = req.params
    try {
        const getAuthors = await pool.query('SELECT * FROM authors')
        const papers = await pool.query('SELECT * FROM papers WHERE user_id = ($1) AND author_id = ($2)', [user_id, author_id])
        let papersCount = papers.rowCount

        if (!papers.rows[0]) {
            return res.status(404).send({
                message: 'This author has no papers'
            })
        } else {
            let authorId = getAuthors.rows[0].author_id
            let id = getAuthors.rows[0].id
            let authorName = getAuthors.rows[0].author_name
            let pictureURL = getAuthors.rows[0].picture

            let paperTitle = papers.rows[0].paper_title
            let paperSummary = papers.rows[0].paper_summary
            let firstPargraph = papers.rows[0].first_paragraph
            let Body = papers.rows[0].body

            const allPapers = []

            for (let i = 0; i < papersCount; i++) {
                authorId = getAuthors.rows[i].author_id
                id = getAuthors.rows[i].id
                authorName = getAuthors.rows[i].author_name
                pictureURL = getAuthors.rows[i].picture

                paperTitle = papers.rows[i].paper_title
                paperSummary = papers.rows[i].paper_summary
                firstPargraph = papers.rows[i].first_paragraph
                Body = papers.rows[i].body

                resJSON = {
                    "id": id,
                    "author":{
                        "author_id": authorId,
                        "author_name": authorName,
                        "picture":pictureURL
                    },
                    "title": paperTitle,
                    "summary": paperSummary,
                    "first_paragraph": firstPargraph,
                    "body": Body
                }
                allPapers.push(resJSON)
            }
            return res.status(200).send(allPapers)
        }
    } catch (err) {
        return res.status(400).send(err)
    }
}

const updatePaper = async (req, res) => {
    const { author_id, paper_id } = req.params
    const { paper_title, paper_summary, first_paragraph, body } = req.body
    try {
        const updatePaper = await pool.query('UPDATE papers SET paper_title = ($1), paper_summary = ($2), first_paragraph = ($3), body = ($4), author_id = ($5) WHERE paper_id = ($6) RETURNING *',
            [paper_title, paper_summary, first_paragraph, body, author_id, paper_id])

            let authorId = updatePaper.rows[0].author_id
            let id = updatePaper.rows[0].id
            let authorName = updatePaper.rows[0].author_name
            let pictureURL = updatePaper.rows[0].picture

            let paperTitle = updatePaper.rows[0].paper_title
            let paperSummary = updatePaper.rows[0].paper_summary
            let firstPargraph = updatePaper.rows[0].first_paragraph
            let Body = updatePaper.rows[0].body
    
            resJSON = {
                "id": id,
                "author":{
                    "author_id": authorId,
                    "author_name": authorName,
                    "picture":pictureURL
                },
                "title": paperTitle,
                "summary": paperSummary,
                "first_paragraph": firstPargraph,
                "body": Body
            }

        return res.status(200).send(resJSON)
    } catch (err) {
        return res.status(400).send(err)
    }
}

const deletePaper = async (req, res) => {
    const { author_id, paper_id } = req.params
    try {
        await pool.query('DELETE FROM papers WHERE author_id = ($1) AND paper_id = ($2) RETURNING *', [author_id, paper_id])
        return res.status(200).send({
            message: 'paper successfully deleted'
        })
    } catch (err) {
        return res.status(400).send(err)
    }
}

module.exports = {
    createPaper,
    getPaper,
    updatePaper,
    deletePaper
}