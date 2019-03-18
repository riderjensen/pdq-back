const express = require('express');
const {
    fetchUrl,
    FetchStream
} = require('fetch');
const PORT = process.env.PORT || 8080;
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Methods', 'GET POST');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});


io.on('connection', (socket) => {
    app.get('/', (req, res, next) => {
        socket.broadcast.emit('loadingOne', 'loadingOne');
        fetchUrl('https://pdqweb.azurewebsites.net/api/brain', (error, meta, body) => {
            if (error) {
                socket.broadcast.emit('myError', 'The server sent a bad response');
                return res.send({
                    error: 'Error fetching employee picture'
                })
            }
            if (meta.status !== 200) {
                socket.broadcast.emit('myError', 'The server sent a bad response');
                return res.send({
                    error: 'The server sent a bad response, please try again'
                })
            }
            try {
                JSON.parse(body)
            } catch (err) {
                socket.broadcast.emit('myError', 'Issue parsing the JSON');
                return res.send({
                    error: 'The server was not able to parse the response'
                })
            }
            getPicture(JSON.parse(body), res, socket);
        })
    })
})



function getPicture(body, res, socket) {
    let largeString = '';
    let myFetch = new FetchStream('https://www.pdq.com/about-us/')
    myFetch.on("data", function (chunk) {
        largeString += chunk.toString();
    })
    myFetch.on("end", function () {
        let getPictureString = largeString.split(`alt="${body.name}"`)
        let picString = getPictureString[0].split('<img src="');
        let pingString = picString[picString.length - 1].split('"')[0].split('/');
        pingString.shift();
        pingString.shift();
        const theImg = pingString.join('/');
        body.personImg = theImg;
        res.send(body);
        socket.broadcast.emit('information', body);
    })
    myFetch.on("error", function () {
        socket.broadcast.emit('myError', 'Could not get employee picture');
        res.send({
            error: 'Error fetching employee picture'
        })
    })
}

server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
})
