const jwt = require('jsonwebtoken')

function verifyJWT(req, res, next) {
    const token = req.headers['x-access-token']

    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' })

    jwt.verify(token, 'secret', function (err, decoded) {
        if (err) return res.status(401).json({ auth: false, message: 'Failed to authenticate token' })
        req.user_id = decoded.id
        next()
    })
}

module.exports = {
    verifyJWT
}