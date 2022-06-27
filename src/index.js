/*
*   Nas operações de post, patch e delete colocar um where na query para que só usuarios do tipo admim possam acessar aquele endpoint  
*   Tratar caso o usuário não tenha nenhum autor
*/


const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()

const PORT = 3333

const app = express()

app.use(express.json())
app.use(cors())

//Conecta a aplicação ao banco de dados
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
})
//Endpoint raiz
app.get('/', (req, res) => {console.log('Olá node')})
//Pega todos os usuários
app.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users')
        return res.status(200).send(rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//Cria um novo usuário caso o email não esteja cadastrado anteriormente {Só admin}
app.post('/session', async (req, res) => {
    const { user_type } = req.body
    const { user_email } = req.body
    const { password } = req.body
    const { session_expiration } = req.body
    let user = ''
    try {
        user = await pool.query('SELECT * FROM users WHERE user_email = ($1)', [user_email])
        if(!user.rows[0]) {
            user = await pool.query('INSERT INTO users (user_type, user_email, password, session_expiration) VALUES ($1, $2, $3, $4) RETURNING *', [user_type, user_email, password, session_expiration])
        }
        return res.status(200).send(user.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//Cria um novo author {Só admin}
app.post('/authors/:user_id', async (req, res) => {
    const { author_name } = req.body
    const { user_id } = req.body
    try {
    const newAuthor = await pool.query('INSERT INTO authors (author_name, user_id) VALUES ($1, $2) RETURNING *', [author_name, user_id])
    return res.status(200).send(newAuthor.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//Pega todos os autores de um id especifico
app.get('/authors/:user_id', async (req, res) => {
    const { user_id } = req.params
    try {
        const allAuthors = await pool.query('SELECT * FROM authors WHERE user_id = ($1)', [user_id])
        return res.status(200).send(allAuthors.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//Atualiza author {Só admin}
//Fazer apenas uma query
app.patch('/author/:user_id/:author_id', async (req,res) => {
    const { user_id, author_id } = req.params
    const data = req.body
    try {
        const belongsToUser = await pool.query('SELECT * FROM authors WHERE user_id = ($1) AND author_id = ($2)', [user_id, author_id])
        if (!belongsToUser.rows[0]) return res.status(400).send('Operation not allowed, this author does not belong to this user.')
        const updateAuthor = await pool.query('UPDATE authors SET author_name = ($1) WHERE author_id = ($2) RETURNING *', 
        [data.author_name, author_id])
        return res.status(200).send(updateAuthor.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//Deleta autor
app.delete('/author/:user_id/:author_id', async (req, res) => {
    const { user_id, author_id } = req.params
    try {
        const belongsToUser = await pool.query('SELECT * FROM authors WHERE user_id = ($1) AND author_id = ($2)', [user_id, author_id])
        if (!belongsToUser.rows[0]) return res.status(400).send('Operation not allowed, this author does not belong to this user.')
        const deleteAuthor = await pool.query('DELETE FROM authors WHERE author_id = ($1) RETURNING *', [author_id])
        return res.status(200).send({
            message: 'author successfully deleted',
            deleteAuthor
        })
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Cria paper por autor {Só admin}
app.post('/paper/:user_id/:author_id', async (req, res) => {
    const { paper_title, paper_summary } = req.body
    const { author_id } = req.body //trocar por author_id
    try {
        const newPaper = await pool.query('INSERT INTO papers (paper_title, paper_summary, author_id) VALUES ($1, $2, $3) RETURNING *', 
        [paper_title, paper_summary, author_id])
        return res.status(200).send(newPaper.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Atualiza paper por autor


//Mostra todos os papers de um autor


//Deleta paper



app.listen(PORT, () => console.log(`Server running on port ${PORT}`))