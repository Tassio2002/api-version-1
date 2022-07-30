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

module.exports = {
    expirationTime,
    convertSecondsToTime
}