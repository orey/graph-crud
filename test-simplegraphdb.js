/*-----------------------------------
 * Simple graph DB
 * Author: rey.olivier@gmail.com
 * Creation date: September10 2020
 * Licence: GNU GPL v3
 *-----------------------------------*/
'use strict';

//const graph = require('./simplegraphdb.js');
const graph = require('./simplegraphdb2.js');


function test01(dbname, erase){
    console.log(erase);
    let gdb = new graph.GraphDB(dbname, erase, true);

    let obj1 = {obj1ref:12, obj1comment: "comment1"};
    let obj2 = {obj2ref:25, obj2comment: "comment2"};

    let id1 = gdb.addNode("Olivier", obj1);
    let id2 = gdb.addNode("Olivier", obj2);

    let myrel1 = {att: "my rel attribute", and: "et puis un autre"};

    let rel1 = gdb.addRel("Olivier", id1, id2, myrel1);

    gdb.writeDB();
    console.log(gdb);
    console.log(graph.GraphDB2HTML(gdb));
}

console.log("Test on new DB");
test01("test01", true);

console.log("Test on existing DB");
test01("test03", false);


