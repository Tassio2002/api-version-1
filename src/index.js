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

const expirationTime = 10800
let timeLeft = expirationTime
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
    timeLeft -= 1

    if (timeLeft <= 0) {clearInterval(interval)}

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
        return res.status(200).send(user.rows)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//login
// colocar o user_email e a password em variáveis
app.post('/login', (req, res) => {
    if (req.body.user_email === "admin@gmail.com" && req.body.password === "admin123456") {
        const { user_id } = req.body
        const token = jwt.sign({ user_id }, process.env.SECRET, {
            expiresIn: expirationTime
        })
        return res.json({ auth: true, token: token })
    }
    res.status(500).json({ message: "Login inválido" })
})

//Vê todos os dados do usuário logado e o tempo até a expiração
app.get('/profile/:user_id', async (req, res) => {
    const { user_id } = req.params
    try {
        await pool.query('UPDATE users SET session_expiration = ($1) WHERE user_id = ($2)', [convertSecondsToTime(timeLeft), user_id])
        const profile = await pool.query('SELECT * FROM users WHERE user_id = ($1)', [user_id])
        return res.status(200).send(profile.rows)
    } catch (err) {
        return res.status(500).send(err)
    }
})

//Deleta user
//verifyJWT
app.delete('/user/:user_id', async (req, res) => {
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

//Só um user admin pode mudar o user type de um usario default
//verifyJWT
app.patch('/user/:user_id', async (req, res) => {
    const { user_id } = req.params
    const { user_name, user_type, password } = req.body

    try {
        const updateUser = await pool.query('UPDATE users SET user_name = ($1), user_type = ($2), password = ($3) WHERE user_id = ($4) RETURNING *', 
            [user_name, user_type, password, user_id])
        return res.status(200).send(updateUser.rows)
    } catch (error) {
        
    }
})

//Get all user não pode ser usado por default
let route = ['/authors/:user_id', '/author/:user_id/:author_id', '/paper/:user_id/:author_id', '/papers/:user_id/:author_id', '/paper/:user_id/:author_id/:paper_id']
app.use(route, async function (req, res, next) {
    const { user_id } = req.params
    try {
        const userType = await pool.query('SELECT user_type FROM users WHERE user_id = ($1)', [user_id])
        if (userType.rows[0].user_type == "admin") {
            return res.status(200), next()
        } else {
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
    const { paper_title, paper_summary, author_id, user_id } = req.body//Colocar todos nesse formato

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
//Não precisa mandar o author id no body da requisição
//Permitir que o usuário consiga alterar apenas alguns dados
//Verificar se o autor existe no banco de dados em caso de o usuário querer atualizar o autor
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


//adicionar verifyJWT
//Tratar o caso de não ter nenhum autor para mostrar com rows.lenght = 0
app.get('/search/author', async (req, res) => {
    const { author_search } = req.body

    try {
        const searchAuthor = await pool.query('SELECT * FROM authors WHERE author_name LIKE ($1)', [`%${author_search}%`])
        return res.status(200).send(searchAuthor.rows)
    } catch (err) {
        return res.status(500).send(err)
    }
})
//adicionar verifyJWT
//Tratar o caso de não ter nenhum autor para mostrar com rows.lenght = 0
app.get('/search/paper', async (req, res) => {
    const { paper_search } = req.body

    try {
        const searchPaper = await pool.query('SELECT * FROM papers WHERE paper_title LIKE ($1) OR paper_summary LIKE ($1)', [`%${paper_search}%`])
        return res.status(200).send(searchPaper.rows)
    } catch (err) {
        return res.status(500).send(err)
    }
})



app.listen(PORT, () => console.log(`Server running on port ${PORT}`))