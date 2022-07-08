/*
*   Nas operações de post, patch e delete colocar um where na query para que só usuarios do tipo admim possam acessar aquele endpoint  
*   Tratar caso o usuário não tenha nenhum autor
*   Mudar nomes das rotas para um mais descritivo
*   Limpar variaveis e parametros não utilizados
*/


const express = require('express')
const cors = require('cors')
var router = express.Router();
const { Pool } = require('pg')

require('dotenv').config()
const jwt = require('jsonwebtoken')

const PORT = 3333

const app = express()

app.use(express.json())
app.use(cors())

//Conecta a aplicação ao banco de dados
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
})

function verifyJWT(req, res, next) {
    const token = req.headers['x-access-token']

    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' })

    jwt.verify(token, process.env.SECRET, function (err, decoded) {
        if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token' })
        req.user_id = decoded.id
        next()
    })
}

//login
app.post('/login', (req, res) => {
    if (req.body.user_email === "admin@gmail.com" && req.body.password === "admin123456") {
        const { user_id } = req.body
        const token = jwt.sign({ user_id }, process.env.SECRET, {
            expiresIn: 1600
        })
        return res.json({ auth: true, token: token })
    }

    res.status(500).json({ message: "Login inválido" })
})

//Pega todos os usuários {só host}
app.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users')
        return res.status(200).send(rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Cria um novo usuário caso o email não esteja cadastrado anteriormente
app.post('/signup', async (req, res) => {
    const { user_type } = req.body
    const { user_email } = req.body
    const { password } = req.body
    const { session_expiration } = req.body
    let user = ''
    try {
        user = await pool.query('SELECT * FROM users WHERE user_email = ($1)', [user_email])
        if (!user.rows[0]) {
            user = await pool.query('INSERT INTO users (user_type, user_email, password, session_expiration) VALUES ($1, $2, $3, $4) RETURNING *', [user_type, user_email, password, session_expiration])
        }
        return res.status(200).send(user.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

let route = ['/authors/:user_id', '/author/:user_id/:author_id', '/paper/:user_id/:author_id', '/papers/:user_id/:author_id', '/paper/:user_id/:author_id/:paper_id']
app.use(route, async function (req, res, next) {
    const { user_id } = req.params
    try {
        const userType = await pool.query('SELECT user_type FROM users WHERE user_id = ($1)', [user_id])

        if (userType.rows[0].user_type == "admin") {
            console.log('Passou')
            return res.status(200), next()
        } else {
            console.log('não passou')
            return res.status(500).send({
                message: 'This operation can only be done by an admin user.'
            })
        }
    } catch (err) {
        return res.status(500).send({
            message: 'This user type does not belong to the system'
        })
    }
})

//Cria um novo author {Só admin}
app.post('/authors/:user_id', verifyJWT, async (req, res) => {
    const { user_id } = req.params//apagar
    try {
        const { author_name } = req.body
        const { user_id } = req.body
        const newAuthor = await pool.query('INSERT INTO authors (author_name, user_id) VALUES ($1, $2) RETURNING *', [author_name, user_id])

        return res.status(200).send(newAuthor.rows)
    } catch (err) {
        return res.status(500).send({
            message: ''
        })
    }
})

//Pega todos os autores de um id especifico
app.get('/authors/:user_id', verifyJWT, async (req, res) => {
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
app.patch('/author/:user_id/:author_id', verifyJWT, async (req, res) => {
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

//Deleta autor {Só admin}
app.delete('/author/:user_id/:author_id', verifyJWT, async (req, res) => {
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
app.post('/paper/:user_id/:author_id', verifyJWT, async (req, res) => {
    const { paper_title, paper_summary, author_id, user_id } = req.body

    try {
        const newPaper = await pool.query('INSERT INTO papers (paper_title, paper_summary, author_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [paper_title, paper_summary, author_id, user_id])
        return res.status(200).send(newPaper.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Mostra todos os papers de um autor
app.get('/papers/:user_id/:author_id', verifyJWT, async (req, res) => {
    const { user_id } = req.params
    const { author_id } = req.params
    try {
        const allPapers = await pool.query('SELECT * FROM papers WHERE user_id = ($1) AND author_id = ($2)', [user_id, author_id])
        return res.status(200).send(allPapers.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Atualiza paper por autor {Só admin}
//Permitir que o usuário consiga alterar apenas alguns dados
//Verificar se o autor existe no banco de dados em caso de o usuário querer atualizar o autor
app.patch('/paper/:user_id/:author_id/:paper_id', verifyJWT, async (req, res) => {
    const { author_id, paper_id } = req.params
    const data = req.body
    try {
        const belongsToUser = await pool.query('SELECT * FROM papers WHERE author_id = ($1) AND paper_id = ($2)', [author_id, paper_id])
        if (!belongsToUser.rows[0]) return res.status(400).send('Operation not allowed, this paper does not belong to this author.')

        const updatePaper = await pool.query('UPDATE papers SET paper_title = ($1), paper_summary = ($2), author_id = ($3) WHERE paper_id = ($4) RETURNING *',
            [data.paper_title, data.paper_summary, data.author_id, paper_id])

        return res.status(200).send(updatePaper.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Deleta paper
app.delete('/paper/:user_id/:author_id/:paper_id', verifyJWT, async (req, res) => {
    const { author_id, paper_id } = req.params
    try {
        const belongsToUser = await pool.query('SELECT * FROM papers WHERE author_id = ($1) AND paper_id = ($2)', [author_id, paper_id])
        if (!belongsToUser.rows[0]) return res.status(400).send('Operation not allowed, this paper does not belong to this author.')
        const deletePaper = await pool.query('DELETE FROM papers WHERE paper_id = ($1) RETURNING *', [paper_id])
        return res.status(200).send({
            message: 'paper successfully deleted',
            deletePaper
        })
    } catch (err) {
        return res.status(400).send(err)
    }
})


//adicionar verifyJWT
//Tratar o caso de não ter nenhum autor para mostrar com rows.lenght = 0
app.get('/search/author', async (req, res) => {
    const { author_search } = req.body

    try {
        const search = await pool.query('SELECT * FROM authors WHERE author_name = ($1)', [author_search])
        return res.status(200).send(search.rows)
    } catch (err) {
        console.log('não achou')
        return res.status(500).send(err)
    }
})
//adicionar verifyJWT
//Tratar o caso de não ter nenhum autor para mostrar com rows.lenght = 0
app.get('/search/paper', async (req, res) => {
    const { paper_search } = req.body

    try {
        const search = await pool.query('SELECT * FROM papers WHERE paper_title = ($1)', [paper_search])
        return res.status(200).send(search.rows)
    } catch (err) {
        console.log('não achou')
        return res.status(500).send(err)
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))