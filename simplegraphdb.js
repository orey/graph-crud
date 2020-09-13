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

/*------------------------------------*/

function recalculateIndex(array, mymap){
    if (VERBOSE) {
        let len = array.length;
        if (len=0) {
            console.out("New file");
            return;
        }
        else
            console.out("Index: Number of elements in source array: " + len.toString());
    }
    array.forEach((item, index) => {
        if (item.gdbid == undefined)
            if (VERBOSE)
                console.log("This element will not be indexed (no id): " + item);
        else
            mymap.set(item["gdbid"], item);} );
    if (VERBOSE) 
        console.log("Index length: " + mymap.length);
}

/*------------------------------------*/

/*
 * Constructor
 */
function GraphDB(dbname, erase=false,verbose=false) {
    // files
    this.dbname = dbname;
    // creating complete filenames
    this.dbnodes = __dirname + '/db/' + dbname + NODES;
    if (VERBOSE) console.log("dbnodes: " + this.dbnodes);
    this.dbrels  = __dirname + '/db/' + dbname + RELS;
    if (VERBOSE) console.log("dbrels: " + this.dbrels);
    // arrays of nodes and rels
    this.nodes = [];
    this.rels = [];
    // init indexes
    this.nodesIndex = new Map();
    this.relsIndex = new Map();
    // file management
    try {
        // create new DB
        if ((!(fs.existsSync(this.dbnodes))) || erase) {
            if (VERBOSE)
                console.log("Creating nodes file: " + this.dbnodes);
            fs.writeFileSync(this.dbnodes, JSON.stringify(INIT_NODES));
        }
        else
            if (VERBOSE)
                console.log("File exists: " + this.dbnodes);
        if ((!(fs.existsSync(this.dbrels))) || erase) {
            if (VERBOSE)
                console.log("Creating rels file: " + this.dbrels);
            fs.writeFileSync(this.dbrels, JSON.stringify(INIT_RELS));
        }
        else
            if (VERBOSE) console.log("file exists: " + this.dbrels);
    }
    catch(err){
        console.error(err);
    }   
    // nodes management
    if (VERBOSE)
        console.log("Loading nodes file: " + this.dbnodes);
    this.nodes = JSON.parse(fs.readFileSync(this.dbnodes, 'utf8'));
    recalculateIndex(this.nodes, this.nodesIndex);
    if (VERBOSE)
        console.log("Loading rels file: " + this.dbrels);
    this.rels = JSON.parse(fs.readFileSync(this.dbrels,  'utf8'));
    recalculateIndex(this.rels, this.relsIndex);
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
    //recalculate index
    recalculateIndex(this.nodes, this.nodesIndex);
    //returning node
    return obj.gdbid;
};


/*
 *  Warning: this clone function clones the data object and not
 * its prototypes and methods
 */
function clone(obj){
    return JSON.parse(JSON.stringify(obj));
}

GraphDB.prototype.updateNode = function(gid, user) {
    // getting node from index
    let node = this.nodesIndex.get(gid);
    if (node == undefined)
        throw new Error ("Unknown node. gdbid = " + gid);
    // reprendre ici
    
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
    //recalculate index
    recalculateIndex(this.rels, this.relsIndex);
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


/*=======================================
 * Exports
 *=======================================*/
module.exports = {
    GraphDB: GraphDB,
}





