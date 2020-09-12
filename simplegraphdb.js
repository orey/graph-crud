/*-----------------------------------
 * Simple graph DB
 * Author: rey.olivier@gmail.com
 * Creation date: September10 2020
 * Licence: GNU GPL v3
 *-----------------------------------
 * The DB is very primitive
 *-----------------------------------*/
'use strict';

// Requires
const fs = require('fs');


//Constants
const NODES = '_nodes.json';
const RELS  = '_rels.json';

const INIT_NODES = [{ system: "init node"}];
const INIT_RELS  = [{ system: "init rel" }];

const NOT_A_NODE = "Source object is not a node (missing gdbid). Not written.";

let VERBOSE = false;

function GraphDB(dbname) {
    //files
    this.dbname = dbname;
    this.dbnodes = __dirname + '/db/' + dbname + NODES;
    if (VERBOSE) console.log("dbnodes: " + this.dbnodes);
    this.dbrels  = __dirname + '/db/' + dbname + RELS;
    if (VERBOSE) console.log("dbrels: " + this.dbrels);
    //arrays of nodes and rels
    this.nodes = [];
    this.rels = [];
}

GraphDB.prototype.getNodes = () => {return this.nodes;};
GraphDB.prototype.getRels  = () => {return this.rels;},

GraphDB.prototype.addNode = function(obj, user) {
    // adding technical info to node
    obj.gdbid = uuidv4();
    obj.gdbvalid = true;
    obj.gdbuser = user;
    obj.gdbdate = getDateMilli();
    //adding node to the list
    this.nodes.push(obj);
    if (VERBOSE) console.log("Nb of nodes in memory: "+ this.nodes.length);
    //returning node
    return obj.gdbid;
};

GraphDB.prototype.addRel = function (relatt, obj_source, obj_target, user){
    // creating rel
    relatt.gdbid = uuidv4();
    relatt.gdbvalid = true;
    relatt.gdbuser = user;
    relatt.dgbdate = getDateMilli();
    if (!('gdbid' in obj_source)) {
        console.error(NOT_A_NODE);
        return 0;
    }
    if (!('gdbid' in obj_target)) {
        console.error(NOT_A_NODE);
        return 0;
    }
    relatt.gdbs = obj_source.gdbid;
    relatt.gdbt = obj_target.gdbid;
    //adding rel to rels
    this.rels.push(relatt);
    return relatt.gdbid;
};

GraphDB.prototype.writeDB = function (){
    try {
        fs.writeFileSync(this.dbnodes, JSON.stringify(this.nodes));
        fs.writeFileSync(this.dbrels,  JSON.stringify(this.rels));
    }
    catch(err) {
        console.error(err);
    }
};

/*function printNode(item

GraphDB.prototype.dumpMemory = function(){
    output = "Dump\n";
    this.nodes.forEach(
}*/


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }
    );
}

function getDateMilli(){
    let today = new Date();
    return today.getTime();
}


/*
 * Warning there can be only one DB
 */
function initDatabase(dbn, erase=false, verbose=false){
    VERBOSE = verbose;
    // Create the DB object
    let thedb = new GraphDB(dbn);
    if (VERBOSE) console.log(erase);
    try {
        if ((!(fs.existsSync(thedb.dbnodes))) || erase) {
            if (VERBOSE) console.log("Creating nodes file: " + thedb.dbnodes);
            fs.writeFileSync(thedb.dbnodes, JSON.stringify(INIT_NODES));
        }
        else
            if (VERBOSE) console.log("File exists: " + thedb.dbnodes);
        if ((!(fs.existsSync(thedb.dbrels))) || erase) {
            if (VERBOSE) console.log("Creating rels file: " + thedb.dbrels);
            fs.writeFileSync(thedb.dbrels, JSON.stringify(INIT_RELS));
        }
        else
            if (VERBOSE) console.log("file exists: " + thedb.dbrels);
        if (VERBOSE) console.log("Loading nodes file: " + thedb.dbnodes);
        thedb.nodes = JSON.parse(fs.readFileSync(thedb.dbnodes, 'utf8'));
        if (VERBOSE) console.log("Loading rels file: " + thedb.dbrels);
        thedb.rels  = JSON.parse(fs.readFileSync(thedb.dbrels,  'utf8'));
    }
    catch(err){
        console.error(err);
    }
    return thedb;
}


/*=======================================
 * Exports
 *=======================================*/
module.exports = {
    initDatabase: initDatabase,
    GraphDB: GraphDB,
}





