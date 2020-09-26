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
const PRESENT = 'P';
const PAST    = 'A';

const INIT_DB = [{ system: "DBStorage", version: 1}];

const INIT_NODES = [{ system: "init node"}];
const INIT_RELS  = [{ system: "init rel" }];

const PREVIOUS_NODE = { system: "PREVN"};
const PREVIOUS_REL = { system: "PREVR"};

const NOT_A_NODE = "Source object is not a node (missing id). Not written.";

const PREVIOUS = "PREVIOUS";

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


function toDateTime(millisecs) {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(Math.round(millisecs/1000));
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
 * Index object
 *=======================================*/
class Index {
    constructor(key) {
        this.key = key;
        this.map = new Map();
    }

    /*
     * elem is an object having a field which name is stored in key
     */
    addElement(elem) {
        if (this.key in elem)
            map.set(item[this.key], elem);
        else
            console.warn("Object that does not have key: %s. Not indexed.", this.key);
    }

    /*
     * key can be not in index, the result is 'undefined'
     */
    getElement(key) {
        return this.map.get(key);
    }

    removeElement(key) {
        if (this.map.has(key))
            this.map.delete(key);
        else
            console.warn("Object is not in index: %s. Not removed.", key);
    }
}


/*=======================================
 * Node and Rel objects
 *=======================================*/

class Node {
    /*
     * The constructor is used for new nodes. So assumptions are made on default values
     * "aid" is the absolute identifier
     */
    constructor(user, obj, type="Node") {
        // technical fields for cloning
        this.aid     = uuidv4(); // this is the absolute id of the node
        this.version = 1;
        this.past    = false;
        // user accesible fields
        this.id   = this.aid
        this.user = user;
        this.date = getDateMilli();
        // the original object is contained into the technical DB object
        // this lets the capacity to enrich technical data
        this.obj  = obj;
        this.type = type; // Type is an optional label
    }

    /*
     * This method acts as a specific kind of factory playing with IDs
     * In terms of data, the clone brutally clones the user data (obj)
     */
    cloneAndLink() {
        let newnode = new Node(this.user,
                               JSON.parse(JSON.stringify(this.obj)),
                               this.type);
        // the clone has the public id of the father, but the aid stays unique
        newnode.id      = this.id;
        newnode.version = this.version + 1;
        this.past       = true;
        return newnode;
    }

};


/*------------------------------------*/

class Rel extends Node {
    // source and dest are nodes
    constructor(user, source, dest, obj, type="Rel") {
        super(user, obj, type);
        if ((!(source instanceof Node)) || (!(dest instanceof Node)))
            throw new Error("Object is not a Node");
        // viewable by the user
        this.sourceid  = source.id;
        this.destid    = dest.id;
        // technical ids
        this.sourceaid = source.aid;
        this.destaid   = dest.aid;
    }

    /*
     * Rewiring method
     */
    cloneAndLink(newnode, source=true) {
        let newrel = undefined;
        if (!(newnode instanceof Node))
            throw new Error("Object is not a Node");
        if (source) {
            newrel = new Rel(this.user,
                             newnode,
                             this.dest,
                             JSON.parse(JSON.stringify(this.obj)),
                             this.type);
            // define new rel as a new version of rel, keeping the same id
            newrel.id = this.id;
            newrel.version = this.version +1;
            this.past = true;
            // sourceid and destid are not changing for newrel
            newrel.sourceaid = newnode.aid
            // destaid has not changed
        }
        // source = false, newnode is a new dest node
        else {
            newrel = new Rel(this.user,
                             this.source,
                             newnode,
                             JSON.parse(JSON.stringify(this.obj)),
                             this.type);
            // define new rel as a new version of rel, keeping the same id
            newrel.id = this.id;
            newrel.version = this.version +1;
            this.past = true;
            // sourceid and destid are not changing for newrel
            newrel.destaid = newnode.aid
            // sourceaid has not changed
        }
        return newrel;
    }

    /*
     * This method can be useful in the future to attach specific semantics (obj)
     * to the PREVIOUS relationship
     */
    createPreviousRel(user, oldnode, newnode) {
        if ((!(oldnode instanceof Node)) || (!(newnode instanceof Node)))
            throw new Error("Object is not a Node");
        return new Rel (user, newnode, oldnode, {}, PREVIOUS);
    }

};


/*
 * This function takes 2 standard nodes and gathers the business rules
 * of archiving.
 */
function updateNode(user, oldnode){
    // standard cloning of the oldnode
    let newnode = oldnode.clone();
    // the newnode has the same id that the old node
    newnode.id = oldnode.id; 
    newnode.version = oldnode.version++;
    newnode.past = false;
    newnode.base = PRESENT;
    // the oldnode must be modified to be stored in the past
    oldnode.past = true;
    oldnode.base = PAST;
    // create the relationship between the new node and the old node
    let rel = new Rel(user, newnode, oldnode,PREVIOUS_NODE, 1, true, PAST);
    // getting the neighborhood of old node in oredr to rewire the new node
    let vois = new Neighborhood(oldnode);
    vois.incoming.forEach((obj) => {
        let oldrel = obj.rel;
        if (!(oldrel instance of Rel))
            thrown new Error("Old rel should be a Rel.");
        let newrel = oldrel.clone();
        newrel.id = oldrel.id;
        newrel.version = oldrel.version++;
        newrel.past = false;
        newrel.base = PRESENT;
        newrel.adestid = oldrel.adestid;
        // updating old rel
        oldrel.past = true;
        oldrel.base = PAST;
    });
    vois.outgoing.forEach((obj) => {
        let oldrel = obj.rel;
        if (!(oldrel instance of Rel))
            thrown new Error("Old rel should be a Rel.");
        let newrel = oldrel.clone();
        newrel.id = oldrel.id;
        newrel.version = oldrel.version++;
        newrel.past = false;
        newrel.base = PRESENT;
        newrel.asourceid = oldrel.asourceid;
        // updating old rel
        oldrel.past = true;
        oldrel.base = PAST;
    });
    


    // newnode will be stored in the PRESENT db and rel in PAST
    return [newnode, rel];
}


/*
 * This class determines a neighborhood _in the standard DB_ only
 */
class Neighborhood {
    /* 
     * Real neighborhood based on "aid" member, the absolute identifier.
     * Consequence, we can get several versions of the same rels pointing
     * if we request on the archive DB.
     * Only one is past=false.
     */
    constructor(root, rels) {
        this.root = root;
        //list of {node, rel} objects
        this.incoming = [];
        //list of {rel, node} objects
        this.outgoing = [];
        rels.forEach((item) => {
            let id = item.target;
            if (id == root.aid)
                this.incoming.push({node: item.source, rel:item});
            id = item.source;
            if (id == root.aid)
                this.outgoing.push({rel:item, node:item.target});
        });
    }


    /*
     * Should be done on active nodes only
     * Not any sense in other cases
     */
    clone(user) {
        if (node.past)
            throw new Error("Archived node cannot be cloned");
        // clone the node
        let newnode = node.clone();
        newnode.id = node.id; //invisible for the user, this is a new version
        newnode.version = node.version++;
        newnode.past = false;
        newnode.base = PRESENT;
        let previousnode = new Rel(user, newnode.aid, node.aid, {});
        // theoretically, all olds rels are archived
        incoming.forEach((rel) => {
            if (rel.past)
                throw new Error("Archived rel should not be in neighborhood of a present node");
            // reprendre ici
        });
    }
    
}


/*=======================================
 * DBStorage object
 * DBStorage stores lists of objects
 *=======================================*/
class DBStorage {
    dnbame  = "";
    dbfile = "";
    dbcontent = {};

    /*
     * Constructor just initialize the DB with a list with one object
     */
    constructor(dbname, location= "/db/", erase=false) {
        // files
        this.dbname = dbname;
        // creating complete filenames
        this.dbfile = __dirname + location + dbname;
        if (VERBOSE)
            console.log("dbfile: " + this.dbdbfile);
        // file management
        try {
            // create new DB
            if (!(fs.existsSync(this.dbfile))) {
                if (VERBOSE)
                    console.log("Create DB %s with file %s", this.dbname, this.dbfile);
                fs.writeFileSync(this.dbfile, JSON.stringify(INIT_DB));
                return;
            }
            // same as above with erase
            if (erase) {
                if (!(fs.existsSync(this.dbfile))) {
                    console.info("DB file %s not existing. Creating", this.dbfile);
                }
                if (VERBOSE)
                    console.log("Create DB %s with file %s", this.dbname, this.dbfile);
                fs.writeFileSync(this.dbfile, JSON.stringify(INIT_DB));
                return;
            }
            if (VERBOSE)
                console.log("DB exists: " + this.dbfile);
        }
        catch(err){
            console.error(err);
        }
    }

    addObject(obj){
        try {
            this.dbcontent = JSON.parse(fs.readFileSync(this.dbfile, 'utf8'));
            this.dbcontent.push(obj);
            fs.writeFileSync(this.dbfile, JSON.stringify(this.dbcontent));
        }
        catch(err){
            console.error(err);
        }
    }
}


/*=======================================
 * SimpleGraphDB
 *=======================================*/
class SimpleGraphDB {
    dbnodesfile = "";
    dbrelsfile  = "";

    nodestorage = undefined;
    relstorage  = undefined;
    
    dbnodes = [];
    dbrels  = [];
    autocommit = true;

    anodesindex = new Index("aid");
    arelsindex  = new Index("aid");
    nodesindes  = new Index("id");
    relsindex   = new Index("aid"); 
    
    constructor(dbname, erase=false) {
        this.dbnodesfile = dbname + NODES;
        this.dbrelsfile  = dbname + RELS;
        this.nodestorage = new DBStorage(this.dbnodesfile, erase);
        this.relstorage  = new DBStorage(this.dbrelsfile,  erase);
        anodesindex = new Index("aid");
        arelsindex  = new Index("aid");
        nodesindes  = new Index("id");
        relsindex   = new Index("aid"); 

    }


}



/*=======================================
 * GraphDB object
 *=======================================*/

class GraphDB {
    constructor(dbname, erase=false,verbose=false) {
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
        // autocommit must be set separately
        this.autocommit = false;
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

    autocommit() {
        this.autocommit = true;
    }

    
    checkId(id) {
        if (VERBOSE)
            console.log(this);
        return id in this.nodesIndex.keys;
    }


    addNode(user, obj) {
        // adding technical info to node
        let node = new Node(user,obj);
        this.nodes.push(node);
        if (VERBOSE) console.log("Nb of nodes in memory: "+ this.nodes.length);
        //recalculate index
        this.nodesIndex = recalculateIndex(this.nodes, this.nodesIndex);
        // autocommit management
        if (this.autocommit)
            this.writeDB()
        //returning node
        return node.id;
    }


    getNeighborhood(nodeid) {
        return new Neighborhood(nodeid, this.rels);
    }

    
    /*
     * En chantier
     */
    updateNode(user, id, newobj) {
        // getting node from index
        let node = this.nodesIndex.get(id);
        if (node == undefined)
            throw new Error ("Unknown node. id = " + id);
        // pumping the node version
        node.version += 1;
        
    }


    addRel(user, source, target, relatt){
        // creating rel
        if ((!this.nodesIndex.has(source)) || (!this.nodesIndex.has(target)))
            throw new Error ("Source or destination Id does not exist.");
        let rel = new Rel(user, source, target, relatt);
        //adding rel to rels
        this.rels.push(rel);
        //recalculate index
        recalculateIndex(this.rels, this.relsIndex);
        // autocommit management
        if (this.autocommit)
            this.writeDB()
        return rel.id;
    }


    writeDB(){
        try {
            fs.writeFileSync(this.dbnodes, JSON.stringify(this.nodes));
            fs.writeFileSync(this.dbrels,  JSON.stringify(this.rels));
        }
        catch(err) {
            console.error(err);
        }
    }
}


/*=======================================
 * HTML displays
 *=======================================*/

function NodeHeader(){
    return "<tr>"
        + "<th><b>ID</b></td>"
        + "<th><b>User</b></td>"
        + "<th><b>Creation date</b></td>"
        + "<th><b>Object</b></td>"
        + "</tr>\n";
}

function Node2HTML(node) {
    return "<tr>"
        + "<td>ID: " + node.id + "</td>"
        + "<td> | user: " + node.user + "</td>"
        + "<td> | creation date: " + toDateTime(node.date) + "</td>"
        + "<td> | object: " + node.obj + "</td>"
        + "</tr>\n";
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
    output += "<table>\n";
    output += NodeHeader();
    db.nodes.forEach( item => { output += Node2HTML(item); });
    output += "</table>";
    output    += "<h2>Relationships</h2>\n";
    db.rels.forEach ( item => { output += Rel2HTML(item); });
    return output;
};


/*=======================================
 * Exports
 *=======================================*/
module.exports = {
    VERBOSE: VERBOSE,
    GraphDB: GraphDB,
    GraphDB2HTML: GraphDB2HTML,
    Node: Node,
    Rel: Rel,
}





