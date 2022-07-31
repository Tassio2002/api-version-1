const express = require('express')
const app = express()
const verifyUserType = require('./Services/user-type-verify')

//Middlewares
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(verifyUserType)


//Rotas
app.use(require('./Routes/UserRoutes'))
app.use(require('./Routes/AuthorRoutes'))
app.use(require('./Routes/PaperRoutes'))
app.use(require('./Routes/SearchRoutes'))

app.listen(3333)
console.log(`Server running or port 3333`)