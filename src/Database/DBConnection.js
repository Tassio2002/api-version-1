const pg = require('pg')

let connString = "postgres://lawztqah:tp1Qu0TmxUksjeDgPpFL7HQs7dVyIFm0@kesavan.db.elephantsql.com/lawztqah"
let client = new pg.Client(connString)

client.connect(function(err){
    if(err){
        return console.error('could not connect to postgres', err)
    }
    client.query('SELECT NOW() AS "theTime"', function(err, result) {
        if(err) {
        return console.error('error running query', err);
        }
        console.log(result.rows[0].theTime);
    })
})

module.exports = client