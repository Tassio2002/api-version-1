const pool = require('../Database/DBConnection')

const searchAuthor = async (req, res) => {
    const { author_search } = req.body

    try {
        const searchAuthor = await pool.query('SELECT * FROM authors WHERE author_name LIKE ($1)', [`%${author_search}%`])
        
        if(searchAuthor.rows.length !== 0){
            return res.status(200).send(searchAuthor.rows)
        } else {
            return res.status(404).send({message: 'No author found'})
        }
    } catch (err) {
        return res.status(500).send(err)
    }
}

const searchPaper = async (req, res) => {
    const { paper_search } = req.body

    try {
        const searchPaper = await pool.query('SELECT * FROM papers WHERE paper_title LIKE ($1) OR paper_summary LIKE ($1)', [`%${paper_search}%`])
        
        if(searchPaper.rows.length !== 0){
            return res.status(200).send(searchPaper.rows)
        } else {
            return res.status(404).send({message: 'No paper found'})
        }

    } catch (err) {
        return res.status(500).send(err)
    }
}

module.exports = {
    searchAuthor,
    searchPaper
}