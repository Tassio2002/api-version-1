const pool = require('../Database/DBConnection')

const getAllUsers = async (req, res) => {
    const response = await pool.query('SELECT * FROM users')
    console.log(response.rows)
    res.send('É o braia')
}

module.exports = {
    getAllUsers
}