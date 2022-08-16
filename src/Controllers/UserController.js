const pool = require('../Database/DBConnection')
let { convertSecondsToTime, expirationTime } = require('../Services/session-expiration')
const jwt = require('jsonwebtoken')

//Pega o tempo de expiração da chave de API e faz uma contagem regressiva
let interval = setInterval(() => {
    expirationTime -= 1

    if (expirationTime <= 0) {clearInterval(interval)}

    convertSecondsToTime()
}, 1000)

const signup = async (req,res) => {
    const { user_name, user_email, user_type, password } = req.body
    
    try {
        const user = await pool.query('SELECT * FROM users WHERE user_email = ($1)', [user_email])
        if (!user.rows[0]) {
            const createUser = await pool.query('INSERT INTO users (user_name, user_type, user_email, password) VALUES ($1, $2, $3, $4) RETURNING *', [user_name, user_type, user_email, password])
            return res.status(201).send(createUser.rows)
        }else {
            return res.status(400).send({
                message: 'A user with this email already exists in the system, please enter your email and password'
            })
        }
        
    } catch (err) {
        return res.status(500).send(err)
    }
}

const login = async (req, res) => {
    const { user_id, user_email, password } = req.body
    try {
        const loginData = await pool.query('SELECT user_email, password FROM users WHERE user_email LIKE ($1) AND password LIKE ($2)',
        [user_email, password])
        if (!loginData.rows[0]) {
            return res.status(401).send({message: 'Invalid login, incorrect email or password, please try again'})
        } else {
            const token = jwt.sign({ user_id }, 'secret', {
                expiresIn: expirationTime
            })
            return res.json({ auth: true, token: token })
        }
    } catch (err) {
        return res.status(500).send(err)
    }
}

const profile = async (req, res) => {
    const { user_id } = req.params
    try {
        await pool.query('UPDATE users SET session_expiration = ($1) WHERE user_id = ($2)', [convertSecondsToTime(expirationTime), user_id])
        const profile = await pool.query('SELECT * FROM users WHERE user_id = ($1)', [user_id])
        return res.status(200).send(profile.rows)
    } catch (err) {
        return res.status(500).send(err)
    }
}

const getAllUsers = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users')
        return res.status(200).send(rows)
    } catch (err) {
        return res.status(400).send(err)
    }
}

const patchUser = async (req, res) => {
    const { user_id } = req.params
    const { user_name, user_type, password } = req.body

    try {
        const updateUser = await pool.query('UPDATE users SET user_name = ($1), user_type = ($2), password = ($3) WHERE user_id = ($4) RETURNING *', 
            [user_name, user_type, password, user_id])
        return res.status(200).send(updateUser.rows)
    } catch (error) {
        res.status(400).send('bad request')
    }
}

const deleteUser = async (req, res) => {
    const { user_id } = req.params
    try {
        await pool.query('DELETE FROM users WHERE user_id = ($1) RETURNING *', [user_id])
        return res.status(200).send({
            message: 'User successfully deleted',
        })
    } catch (err) {
        return res.status(400).send(err)
    }
}



module.exports = {
    signup,
    login,
    profile,
    getAllUsers,
    patchUser,
    deleteUser
}