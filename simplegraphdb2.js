/*-----------------------------------
 * Simple graph DB 2
 * Author: rey.olivier@gmail.com
 * Creation date: September10 2020
 * Licence: GNU GPL v3
 *-----------------------------------
 * The DB is primitive.
 * The option taken is to embed the object
 * when the version 1 was just decorating it
 * with new attributes
 *-----------------------------------*/
'use strict';

// Requires
const fs = require('fs');


//Constants
const NODES = '_nodes.json';
const RELS  = '_rels.json';

const INIT_NODES = [{ system: "init node"}];
const INIT_RELS  = [{ system: "init rel" }];

const NOT_A_NODE = "Source object is not a node (missing id). Not written.";

let VERBOSE = false;

/*=======================================
 * Utilities
 *=======================================*/

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


function toDateTime(secs) {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);
    return t;
}

/*------------------------------------*/

function recalculateIndex(array, mymap){
    if (VERBOSE) {
        let len = array.length;
        if (len == 0) {
            console.log("New file");
            return;
        }
        else
            console.log("Index: Number of elements in source array: " + len);
    }
    array.forEach((item, index) => {
        if (VERBOSE)
            console.log("Id: " + item["id"]);
        if (!("id" in item)){
            if (VERBOSE)
                console.log("This element will not be indexed (no id): " + item);
        }
        else
            mymap.set(item["id"], item);
    }
                 );
    if (VERBOSE) {
        console.log("Index size: " + mymap.size);
        //console.log("Index");
        //console.log(mymap);
    }
    
    return mymap;
}


/*=======================================
 * Node and Rel objects
 *=======================================*/

function Node(user, obj) {
    this.id   = uuidv4();
    this.user = user;
    this.date = getDateMilli();
    // the original object is contained into the technical DB object
    // This lets the capacity to enrich technical data
    this.obj  = obj;
};


Node.prototype.getId = () => { return this.id; };

/*------------------------------------*/

function Rel(user, source, dest, obj) {
    this.id   = uuidv4();
    this.user = user;
    this.date = getDateMilli();
    this.obj = obj;
    // TODO: control if source and target ID are existing
    this.source = source;
    this.dest = dest;
};

//Should be inheritated
Rel.prototype.getId = () => { return this.id; };


/*=======================================
 * GraphDB object
 *=======================================*/

/*
 * Constructor
 */
function GraphDB(dbname, erase=false,verbose=false) {
    VERBOSE = verbose;
    // files
    this.dbname = dbname;
    // creating complete filenames
    this.dbnodes = __dirname + '/db/' + dbname + NODES;
    //if (VERBOSE) console.log("dbnodes: " + this.dbnodes);
    this.dbrels  = __dirname + '/db/' + dbname + RELS;
    //if (VERBOSE) console.log("dbrels: " + this.dbrels);
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
    this.nodesIndex = recalculateIndex(this.nodes, this.nodesIndex);

    if (VERBOSE)
        console.log("Loading rels file: " + this.dbrels);
    this.rels = JSON.parse(fs.readFileSync(this.dbrels,  'utf8'));
    this.relsIndex = recalculateIndex(this.rels, this.relsIndex);
}


GraphDB.prototype.checkId  = (id) => {
    if (VERBOSE)
        console.log(this);
    return id in this.nodesIndex.keys;
};


GraphDB.prototype.addNode = function(user, obj) {
    // adding technical info to node
    let node = new Node(user,obj);
    this.nodes.push(node);
    if (VERBOSE) console.log("Nb of nodes in memory: "+ this.nodes.length);
    //recalculate index
    this.nodesIndex = recalculateIndex(this.nodes, this.nodesIndex);
    //returning node
    return node.id;
};


/*
 * En chantier
 */
GraphDB.prototype.updateNode = function(gid, user) {
    // getting node from index
    let node = this.nodesIndex.get(gid);
    if (node == undefined)
        throw new Error ("Unknown node. id = " + gid);
    // reprendre ici
    
};


GraphDB.prototype.addRel = function (user, source, target, relatt){
    // creating rel
    if ((!this.nodesIndex.has(source)) || (!this.nodesIndex.has(target)))
        throw new Error ("Source or destination Id does not exist.");
    let rel = new Rel(user, source, target, relatt);
    //adding rel to rels
    this.rels.push(rel);
    //recalculate index
    recalculateIndex(this.rels, this.relsIndex);
    return rel.id;
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


/*=======================================
 * HTML displays
 *=======================================*/

function Node2HTML(node) {
    return "<p>ID: " + node.id
        + " | user: " + node.user
        + " | creation date: " + toDateTime(node.date)
        + " | object: " + node.obj
        + "</p>\n";
};


function Rel2HTML(rel) {
    return "<p>ID: " + rel.id
        + " | user: " + rel.user
        + " | creation date: " + toDateTime(rel.date)
        + " | source: " + rel.source
        + " | destination: " + rel.dest
        + " | object: " + rel.obj
        + "</p>\n";
};


function GraphDB2HTML(db) {
    let output = "<h2>Nodes</h2>\n";
    db.nodes.forEach( item => { output += Node2HTML(item); });
    output    += "<h2>Relationships</h2>\n";
    db.rels.forEach ( item => { output += Rel2HTML(item); });
    return output;
};


/*=======================================
 * Exports
 *=======================================*/
module.exports = {
    GraphDB: GraphDB,
    GraphDB2HTML: GraphDB2HTML,
}





