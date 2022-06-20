const express = require('express')
const { Pool } = require('pg')
require('dotenv').config()

const PORT = 3333

const app = express()

app.use(express.json())
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
//Cria um novo usuário caso o email não esteja cadastrado anteriormente
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
//Cria um novo author
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

app.get('/authors/:user_id', async (req, res) => {
    const { user_id } = req.params
    try {
        const allAuthors = await pool.query('SELECT * FROM authors WHERE user_id = ($1)', [user_id])
        return res.status(200).send(allAuthors.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))