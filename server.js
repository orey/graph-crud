const express = require('express');
const bodyParser= require('body-parser');
const fs = require('fs');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    //res.send("<html><body><h1>Qui voilà ?</h1><p>" + obj[0].id + "</p></body></html>");
    res.sendFile(__dirname + '/index.html')
});

app.post('/quotes', (req, res) => {
    console.log(req.body);
    obj.push(req.body);
    res.send("<html><body><h1>OK</h1></body></html>");
});

app.post('/save', (req, res) => {
    console.log(req.body);
    let data = JSON.stringify(obj);
    fs.writeFileSync('nodes2.json', data);
    res.send("<html><body><h1>SAVED</h1></body></html>");
});


app.listen(3000, function() {
    console.log('listening on 3000')
});


const obj = JSON.parse(fs.readFileSync('nodes.json', 'utf8'));


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }
    );
}


var req = {
    id: uuidv4(), 
    ref: "CCTP 1225",
    version: 2,
    text:"bla bli",
    comment: "blou",
}

var req2 = Object.create(req);
req2.ref = "CCAP 1212";
req2.version = 1;




