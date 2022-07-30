const express = require('express')
const app = express()

//Middlewares

app.use(express.json())
app.use(express.urlencoded({extended: false}))



//Rotas
app.use(require('./Routes/UserRoutes'))


app.listen(3333)
console.log(`Server running or port 3333`)