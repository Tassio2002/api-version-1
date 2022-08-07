const pool = require('../Database/DBConnection')

const createAuthor = async (req, res) => {
    const { author_name, user_id, picture } = req.body
    try {
        const newAuthor = await pool.query('INSERT INTO authors (author_name, user_id, picture) VALUES ($1, $2, $3) RETURNING *', [author_name, user_id, picture])
        
        let authorId = newAuthor.rows[0].author_id
        let id = newAuthor.rows[0].id
        let authorName = newAuthor.rows[0].author_name
        let pictureURL = newAuthor.rows[0].picture
        return res.status(201).json({
            "id": id,
            "author":{
                "author_id": authorId,
                "author_name": authorName,
                "picture":pictureURL
            }
        })
    } catch (err) {
        return res.status(500).send({
            message: ''
        })
    }
}

const getAuthors = async (req, res, next) => {
    const { user_id } = req.params
    try {
        const authors = await pool.query('SELECT * FROM authors WHERE user_id = ($1)', [user_id])
        let authorsCount = authors.rowCount
        
        if (!authors.rows[0]) {
            return res.status(404).send({message: 'This user has no authors'})
        } else {
            //Colocar cada resultado num array e iterar
            
            let authorId = authors.rows[0].author_id
            let id = authors.rows[0].id
            let authorName = authors.rows[0].author_name
            let pictureURL = authors.rows[0].picture

            const allAuthors = []

            for (let i = 0; i < authorsCount; i++) {
                authorId = authors.rows[i].author_id
                id = authors.rows[i].id
                authorName = authors.rows[i].author_name
                pictureURL = authors.rows[i].picture

                let json = {
                    "id": id,
                    "author":{
                        "author_id": authorId,
                        "author_name": authorName,
                        "picture":pictureURL
                    }
                }
                allAuthors.push(json)
            }

            return res.status(200).json(allAuthors)
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