const pool = require('../Database/DBConnection')


const createAuthor = async (req, res) => {
    const { author_name, user_id } = req.body
    try {
        const newAuthor = await pool.query('INSERT INTO authors (author_name, user_id) VALUES ($1, $2) RETURNING *', [author_name, user_id])
        return res.status(201).send(newAuthor.rows)
    } catch (err) {
        return res.status(500).send({
            message: ''
        })
    }
}

const getAuthors = async (req, res) => {
    const { user_id } = req.params
    try {
        const allAuthors = await pool.query('SELECT * FROM authors WHERE user_id = ($1)', [user_id])
        if (!allAuthors.rows[0]) {
            return res.status(404).send({message: 'This user has no authors'})
        } else {
            return res.status(200).send(allAuthors.rows)
        }
    } catch (err) {
        return res.status(400).send(err)
    }
}

const updateAuthor = async (req, res) => {
    const { user_id, author_id } = req.params
    const { author_name } = req.body
    try {
        const updateAuthor = await pool.query('UPDATE authors SET author_name = ($1) WHERE user_id = ($2) AND author_id = ($3) RETURNING *',
            [author_name, user_id, author_id])
        return res.status(200).send(updateAuthor.rows)
    } catch (err) {
        return res.status(400).send('teste')
    }
}

const deleteAuthor = async (req, res) => {
    const { user_id, author_id } = req.params
    try {
        await pool.query('DELETE FROM authors WHERE user_id = ($1) AND author_id = ($2) RETURNING *', [user_id,author_id])
        return res.status(200).send({
            message: 'author successfully deleted'
        })
    } catch (err) {
        return res.status(400).send(err)
    }
}

module.exports = {
    createAuthor,
    getAuthors,
    updateAuthor,
    deleteAuthor
}