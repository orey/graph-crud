/*-----------------------------------
 * Simple graph DB
 * Author: rey.olivier@gmail.com
 * Creation date: September10 2020
 * Licence: GNU GPL v3
 *-----------------------------------*/
'use strict';

const graph = require('./simplegraphdb.js');


function test01(dbname, erase){
    console.log(erase);
    let gdb = graph.initDatabase(dbname, erase, true);

    let obj1 = {obj1ref:12, obj1comment: "comment"};
    let obj2 = {obj2ref:25, obj2comment: "comment"};

    let id1 = gdb.addNode(obj1, "Olivier");
    let id2 = gdb.addNode(obj2, "Olivier");

    let myrel1 = {att: "my rel attribute"};

    let rel1 = gdb.addRel(myrel1, obj1, obj2, "Olivier");

    gdb.writeDB();
}

console.log("Test on new DB");
test01("test01", true);

console.log("Test on existing DB");
test01("test02", false);


