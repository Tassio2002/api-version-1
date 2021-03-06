const express = require('express')
const cors = require('cors')
var router = express.Router();
const { Pool } = require('pg')

require('dotenv').config()
const jwt = require('jsonwebtoken');
const { query } = require('express');

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
        if (err) return res.status(401).json({ auth: false, message: 'Failed to authenticate token' })
        req.user_id = decoded.id
        next()
    })
}

// Tempo de expiração da API key em segundos
let expirationTime = 10800

//Converte um numero inteiro em uma string formatada no formato HH:MM:SS
function convertSecondsToTime(time) {
    let dateOBJ = new Date(time * 1000),
        hours = dateOBJ.getUTCHours(),
        minutes = dateOBJ.getUTCMinutes(),
        seconds = dateOBJ.getUTCSeconds(),
        convertString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    return convertString
}

//Pega o tempo de expiração da chave de API e faz uma contagem regressiva
let interval = setInterval(() => {
    expirationTime -= 1

    if (expirationTime <= 0) {clearInterval(interval)}

    convertSecondsToTime()
}, 1000)

//Cria um novo usuário caso o email não esteja cadastrado anteriormente
app.post('/signup', async (req, res) => {
    const { user_name, user_email, user_type, password } = req.body
    let user = ''
    try {
        user = await pool.query('SELECT * FROM users WHERE user_email = ($1)', [user_email])
        if (!user.rows[0]) {
            user = await pool.query('INSERT INTO users (user_name, user_type, user_email, password, session_expiration) VALUES ($1, $2, $3, $4, $5) RETURNING *', [user_name, user_type, user_email, password, convertSecondsToTime(expirationTime)])
        }
        return res.status(201).send(user.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//login
app.post('/login', async (req, res) => {
    const { user_id, user_email, password } = req.body
    try {
        const loginData = await pool.query('SELECT user_email, password FROM users WHERE user_email LIKE ($1) AND password LIKE ($2)',
        [user_email, password])

        if (!loginData.rows[0]) {
            return res.status(401).send({message: 'Invalid login, incorrect email or password, please try again'})
        } else {
            const token = jwt.sign({ user_id }, process.env.SECRET, {
                expiresIn: expirationTime
            })
            return res.json({ auth: true, token: token })
        }
    } catch (err) {
        return res.status(500).send(err)
    }
})

//Vê todos os dados do usuário logado e o tempo até a expiração
app.get('/profile/:user_id', async (req, res) => {
    const { user_id } = req.params
    try {
        await pool.query('UPDATE users SET session_expiration = ($1) WHERE user_id = ($2)', [convertSecondsToTime(expirationTime), user_id])
        const profile = await pool.query('SELECT * FROM users WHERE user_id = ($1)', [user_id])
        return res.status(200).send(profile.rows)
    } catch (err) {
        return res.status(500).send(err)
    }
})

//Deleta user
app.delete('/user/:user_id', verifyJWT, async (req, res) => {
    const { user_id } = req.params
    try {
        await pool.query('DELETE FROM users WHERE user_id = ($1) RETURNING *', [user_id])
        return res.status(200).send({
            message: 'User successfully deleted',
        })
    } catch (err) {
        return res.status(400).send(err)
    }
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

//Atualiza usuário
app.patch('/user/:user_id', verifyJWT, async (req, res) => {
    const { user_id } = req.params
    const { user_name, user_type, password } = req.body

    try {
        const updateUser = await pool.query('UPDATE users SET user_name = ($1), user_type = ($2), password = ($3) WHERE user_id = ($4) RETURNING *', 
            [user_name, user_type, password, user_id])
        return res.status(200).send(updateUser.rows)
    } catch (error) {
        
    }
})

let route = ['/authors/:user_id', '/author/:user_id/:author_id', '/paper/:user_id/:author_id', '/papers/:user_id/:author_id', '/paper/:user_id/:author_id/:paper_id']
app.use(route, async function (req, res, next) {
    const { user_id } = req.params
    try {
        const userType = await pool.query('SELECT user_type FROM users WHERE user_id = ($1)', [user_id])
        if (userType.rows[0].user_type == "admin") {
            return res.status(202), next()
        } else {
            return res.status(403).send({
                message: 'This operation can only be done by an admin user.'
            })
        }
    } catch (err) {
        return res.status(401).send({
            message: 'This user type does not belong to the system'
        })
    }
})

//Cria um novo author {Só admin}
app.post('/authors/:user_id', verifyJWT, async (req, res) => {
    try {
        const { author_name, user_id } = req.body
        const newAuthor = await pool.query('INSERT INTO authors (author_name, user_id) VALUES ($1, $2) RETURNING *', [author_name, user_id])
        return res.status(201).send(newAuthor.rows)
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
        if (!allAuthors.rows[0]) {
            return res.status(404).send({message: 'This user has no authors'})
        } else {
            return res.status(200).send(allAuthors.rows)
        }
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Atualiza author {Só admin}
app.patch('/author/:user_id/:author_id', verifyJWT, async (req, res) => {
    const { user_id, author_id } = req.params
    const { author_name } = req.body
    try {
        const updateAuthor = await pool.query('UPDATE authors SET author_name = ($1) WHERE user_id = ($2) AND author_id = ($3) RETURNING *',
            [author_name, user_id, author_id])
        return res.status(200).send(updateAuthor.rows)
    } catch (err) {
        return res.status(400).send('teste')
    }
})

//Deleta autor {Só admin}
app.delete('/author/:user_id/:author_id', verifyJWT, async (req, res) => {
    const { user_id, author_id } = req.params
    try {
        await pool.query('DELETE FROM authors WHERE user_id = ($1) AND author_id = ($2) RETURNING *', [user_id,author_id])
        return res.status(200).send({
            message: 'author successfully deleted'
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
        return res.status(201).send(newPaper.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Mostra todos os papers de um autor
app.get('/papers/:user_id/:author_id', verifyJWT, async (req, res) => {
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
})

//Atualiza paper por autor {Só admin}
app.patch('/paper/:user_id/:author_id/:paper_id', verifyJWT, async (req, res) => {
    const { author_id, paper_id } = req.params
    const { paper_title, paper_summary } = req.body
    try {
        const updatePaper = await pool.query('UPDATE papers SET paper_title = ($1), paper_summary = ($2), author_id = ($3) WHERE paper_id = ($4) RETURNING *',
            [paper_title, paper_summary, author_id, paper_id])

        return res.status(200).send(updatePaper.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Deleta paper
app.delete('/paper/:user_id/:author_id/:paper_id', verifyJWT, async (req, res) => {
    const { author_id, paper_id } = req.params
    try {
        await pool.query('DELETE FROM papers WHERE author_id = ($1) AND paper_id = ($2) RETURNING *', [author_id, paper_id])
        return res.status(200).send({
            message: 'paper successfully deleted'
        })
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Busca por autores
app.get('/search/author', verifyJWT, async (req, res) => {
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
})

//Busca por papers
app.get('/search/paper', verifyJWT, async (req, res) => {
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
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))