const pg = require('pg')

let connString = "postgres://txluvqcy:1bS-72MdK2n4NUn2YHDQTS-Ss0TQT32J@babar.db.elephantsql.com/txluvqcy"
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