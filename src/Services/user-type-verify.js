const express = require('express')
const app = express()

let route = ['/authors/:user_id', '/author/:user_id/:author_id', '/paper/:user_id/:author_id', '/papers/:user_id/:author_id', '/paper/:user_id/:author_id/:paper_id']
const isAdimin = app.use(route, async function (req, res, next) {
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

module.exports = isAdimin