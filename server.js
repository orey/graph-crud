/*-----------------------------------
 * Requirements apps based on simplegraphdb 2
 * Author: rey.olivier@gmail.com
 * Creation date: September10 2020
 * Licence: GNU GPL v3
 *-----------------------------------
 * 
 *-----------------------------------*/
'use strict';


const express = require('express');
const bodyParser= require('body-parser');
const fs = require('fs');

//const graph = require('./simplegraphdb.js');
//const gdb = new graph.GraphDB("web", false, true);

/*=======================================
 * GraphDB
 *=======================================*/
const graph = require('./simplegraphdb2.js');
const gdb = new graph.GraphDB("web2", false, true);


/*=======================================
 * Express app
 *=======================================*/
const app = express();
//to get objects
app.use(bodyParser.urlencoded({ extended: true }));


/*=======================================
 * Composing the display
 *=======================================*/
function res_index(req,res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(compose_index(req));
    return res.end();
}

function compose_index(req) {
    let output = "";
    output += fs.readFileSync('header.html', 'utf-8');
    output += "<p> </p>\n";
    output += fs.readFileSync('createnode.html', 'utf-8');
    output += "<p> </p>\n<hr></hr>\n";
    output += fs.readFileSync('createrel.html', 'utf-8');
    output += "<p> </p>\n<hr></hr>\n";    
    output += fs.readFileSync('savedb.html', 'utf-8');
    output += "<p> </p>\n<hr></hr>\n";
    output += graph.GraphDB2HTML(gdb);
    output += "<p> </p>\n";
    output += fs.readFileSync('footer.html', 'utf-8');
    return output;
}


/*=======================================
 * Entry points
 *=======================================*/
app.get('/', (req, res) => {
    //res.send("<html><body><h1>Qui voilà ?</h1><p>" + obj[0].id + "</p></body></html>");
    //res.sendFile(__dirname + '/index.html')
    res_index(req,res);
});


app.post('/node', (req, res) => {
    let obj = req.body;
    console.log(obj);
    let id = gdb.addNode("Olivier",obj);
    res.send("<html><body><h1>OK</h1><p>The node (id = "
             + id
             + "): ["
             + obj.name
             + "|"
             + obj.quote
             + "] was created...</p></body></html>");
});


app.post('/rel', (req, res) => {
    let obj = req.body;
    console.log(obj);
    let source = obj.source;
    let target = obj.target;
    delete obj.source;
    delete obj.target;
    console.log(obj);
    let id = gdb.addRel("Olivier",source, target, obj);
    res.send("<html><body><h1>OK</h1><p>The relationship (id = "
             + id
             + "): ["
             + obj.name
             + "] was created...</p></body></html>");
});


app.post('/save', (req, res) => {
    console.log(req.body);
    gdb.writeDB();
    res.send("<html><body><h1>Database is saved</h1></body></html>");
});


app.listen(3000, function() {
    console.log('listening on 3000')
});






