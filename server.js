const express = require('express');
const bodyParser= require('body-parser');
const fs = require('fs');

const graph = require('./simplegraphdb.js');
const gdb = new graph.GraphDB("web", false, true);

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    //res.send("<html><body><h1>Qui voilà ?</h1><p>" + obj[0].id + "</p></body></html>");
    res.sendFile(__dirname + '/index.html')
});

app.post('/quotes', (req, res) => {
    
    let obj = req.body;
    console.log(obj);
    let id = gdb.addNode(obj, "Olivier");
    res.send("<html><body><h1>OK</h1><p>The object "+ obj.name + "|" + obj.quote + " was written...</p></body></html>");
});

app.post('/save', (req, res) => {
    console.log(req.body);
    gdb.writeDB();
    res.send("<html><body><h1>Database is saved</h1></body></html>");
});


app.listen(3000, function() {
    console.log('listening on 3000')
});






