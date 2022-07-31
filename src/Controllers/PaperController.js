const pool = require('../Database/DBConnection')

const createPaper = async (req, res) => {
    const { paper_title, paper_summary, author_id, user_id } = req.body
    try {
        const newPaper = await pool.query('INSERT INTO papers (paper_title, paper_summary, author_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [paper_title, paper_summary, author_id, user_id])
        return res.status(201).send(newPaper.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
}

const getPaper = async (req, res) => {
    const { user_id, author_id } = req.params
    try {
        const allPapers = await pool.query('SELECT * FROM papers WHERE user_id = ($1) AND author_id = ($2)', [user_id, author_id])
        if (!allPapers.rows[0]) {
            return res.status(404).send({message: 'This author has no papers'})
        } else {
            return res.status(200).send(allPapers.rows)
        }
    } catch (err) {
        return res.status(400).send(err)
    }
}

const updatePaper = async (req, res) => {
    const { author_id, paper_id } = req.params
    const { paper_title, paper_summary } = req.body
    try {
        const updatePaper = await pool.query('UPDATE papers SET paper_title = ($1), paper_summary = ($2), author_id = ($3) WHERE paper_id = ($4) RETURNING *',
            [paper_title, paper_summary, author_id, paper_id])

        return res.status(200).send(updatePaper.rows)
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