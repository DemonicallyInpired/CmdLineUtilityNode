#!/usr/bin/env node 
"use strict";

var args = require("minimist")(process.argv.slice(2), {
    boolean: ["helper", "in", "streamin", "out", "compress", "uncompress", "start_server", "start_server_with_express", "spin_childprocess"],
    string: ["printfilepath", "readFileSync", "readFileAsync", "readStreams", "others"],
});

function streamecomplete(stream){
    return new Promise(function c(resp){
        stream.on("end", resp);
    })
}
var utils = require("util");
var path = require("path");
var fs = require("fs");
var getstdin = require("get-stdin");
var zlib = require("zlib");
var transform = require("stream").Transform;
var sqlite3 = require("sqlite3");
var http = require("http");
var staticAlias= require("node-static-alias");
var childproc = require("child_process");
const DB_PATH = path.join(__dirname, "my.db");
const DB_SQL_PATH = path.join(__dirname, "mydb.sql");
const HTTP_PORT = process.env.PORT || 8081;
const WEB_PATH = path.join(__dirname, "web");

function helper(){
    console.log("utilities.js usage");
    console.log("");
    console.log("       utilities.js --help");
    console.log("       utilites.js --printfilepath");
    console.log("       utilities.js --readFileSync");
    console.log("       utilities.js --readFileAsync");
    console.log("       utilities.js --readStreams");
    console.log("       utilities.js --out");
    console.log("       cat {FILENAME} | ./utilities.js --in or -");
    console.log("       cat {FILENAME} | ./utilities.js --streamin");
    console.log("       utilities.js --readStreams --out --compress");
    console.log("       cat {FILENAME} | ./utilities.js --streamin --compress");
    console.log("       cat {FILENAME} | ./utilities.js --instreams --uncompress");
    console.log("       utlities.js --start_server");
    console.log("       utilities.js --start_server_with_express");
    console.log("       utilities.js --spin_childprocess");
    console.log("       utilities.js --others");
    console.log("--help                       print the help");
    console.log("--printfilepath={FILENAME}   print the files relative and absolute path");
    console.log("--readFileSync={FILENAME}    print the content of the file Synchronouslly");
    console.log("--readFileAsync={FILENAME}   process file Asynchronouslly");
    console.log("--readStreams={FILENAME}     process Streams");
    console.log("--in, -                      process stdin though the console");
    console.log("--streamin                   process inputing the stream through console");
    console.log("--out                        print the stdout");
    console.log("--compress                   gzip the output");
    console.log("--uncompress                 uncompress the gzipped file");
    console.log("--others                     process the database");
    console.log("--start_server               Start the file server");
    console.log("--start_server_with_express  Start the Express Server");
    console.log("--spin_childprocess          Spin mutliple child process to check the load on the server");
}
var BASE_PATH = path.resolve(process.env.BASE_PATH || __dirname);
var OUT_FILE = path.join(BASE_PATH, "out.txt");
if(args.help){
    helper();
}
else if(args.file){
    console.log(args.file);
}
else if(args.printfilepath){
    printfilepath(args.printfilepath);
}
else if(args.readFileSync){
    readSync(args.readFileSync);
}
else if(args.readFileAsync){
    var content = fs.readFile(path.join(BASE_PATH, args.readFileAsync), function oncontent(err, content){
        if(err){
            error(err);
        }
        else{
            processFile(content);
        }
    })
}
else if(args.readStreams){
    let stream = fs.createReadStream(path.join(BASE_PATH, args.readStreams));
    processStream(stream).then(function ()
    {
        console.log("completed")
    }
);
}
else if(args.in || args._.includes("-")){
    getstdin().then(processFile).catch(error);
}
else if(args.streamin){
    processStream(process.stdin);
}
else if(args.others || args.start_server || args.start_server_with_express){
    main().catch(console.error);
}
else if(args.spin_childprocess){
    childprocess();
}
else{
    error("incorrect usagae", true);
}
function error(msg, ishelper){
    console.log(msg);
    if(ishelper){
        helper();
    }
}
function readSync(filepath){
    var content = fs.readFileSync(path.resolve(filepath));
    console.log(content.toString());
}
function processFile(content){
    content = content.toString().toUpperCase();
    process.stdout.write(content);
}
function printfilepath(filepath){
    console.log(path.resolve(filepath));
    console.log(path.resolve(__dirname));
}
async function processStream(instream){
    var outstream = instream;
    if(args.uncompress){
        let gunzipstream = zlib.createGunzip();
        outstream = outstream.pipe(gunzipstream);
    }
    var upperstream  = new transform({
        transform(chunk, enc, cb){
            this.push(chunk.toString().toUpperCase());
            cb();
        }
    });
    outstream = instream.pipe(upperstream)
    var targetStream;
    if(args.compress){
        let gzipstream = zlib.createGzip();
        outstream = outstream.pipe(gzipstream);
        OUT_FILE = `${OUT_FILE}.gz`;
    }
    if(args.out){
        targetStream = process.stdout;
    }
    else{
        targetStream = fs.createWriteStream(OUT_FILE);
    }
    outstream.pipe(targetStream);
    await streamecomplete(outstream);
}

var SQL3;
async function main(){
    var myDB = new sqlite3.Database(DB_PATH);
    SQL3 = {
        run(...args){
            return new Promise(function c(resolve, reject){
                myDB.run(...args, function onresult(err){
                    if(err){reject(err);}
                    else{resolve(this);}
                });
            });
        },
        get: utils.promisify(myDB.get.bind(myDB)),
        all: utils.promisify(myDB.all.bind(myDB)),
        exec: utils.promisify(myDB.exec.bind(myDB)),
    };
    var intial_sql = fs.readFileSync(DB_SQL_PATH,"utf-8");
    await SQL3.exec(intial_sql);

    var other = args.other;
    var something = Math.trunc(Math.random()*1E9);

    var otherId = await insertOrLookupOther(other);
    if(otherId){
        var result = await insertSomething(otherId, something);
        if(result){
            var records = await getAllRecords();
            if(records && records.length >0){
                console.table(records);
                return;
            }
        }
    }
    error("opps");
}

async function insertOrLookupOther(other){
    var result = await SQL3.get(
        `
            SELECT id FROM other WHERE data = ?
        `, 
        other
    );
    if(result && result.id){
        return result.id;
    }
    else{
        result = await SQL3.run(
            `
                INSERT INTO Other (data) VALUES (?)
            `, 
            other
        );
        if(result && result.lastID){
            return result.lastID;
        }
    }
}

async function insertSomething(otherID, something){
    var result = await SQL3.run(
        `
            INSERT INTO Something (otherID, data) VALUES (?, ?)
        `, 
        otherID, 
        something
    );
    if(result && result.changes > 0){
        return true;
    }
    return false;
}

async function getAllRecords(){
    var result = await SQL3.all(
        `
            SELECT Other.data AS 'other', Something.data as 'something' FROM Something Join Other
            ON (something.otherID = Other.id)
            ORDER BY Other.id DESC, Something.data ASC
        `
    );
    return result;
}
var fileServer = new staticAlias.Server(WEB_PATH,{
    cache: 100,
    serverInfo: "A lightweight cmdline utility",
    alias: [
		{
			match: /^\/(?:index\/?)?(?:[?#].*$)?$/,
			serve: "index.html",
			force: true,
		},
		{
			match: /^\/js\/.+$/,
			serve: "<% absPath %>",
			force: true,
		},
		{
			match: /^\/(?:[\w\d]+)(?:[\/?#].*$)?$/,
			serve: function onMatch(params) {
				return `${params.basename}.html`;
			},
		},
		{
			match: /[^]/,
			serve: "404.html",
		},
	],
})
var httpserv = http.createServer(handleRequest);
if(args.start_server){
    server();
}
function server(){
    httpserv.listen(HTTP_PORT);
    console.log(`listening to the port ${HTTP_PORT}`);
}
// async function handleRequest(req, res){
//     if(req.url == "/hello"){
//         res.writeHead(200, {"content-type": "text/plain"});
//         res.end("Hello world");
//     }
//     else{
//         res.writeHead(404);
//         res.end();
//     }
// }

async function handleRequest(req, res){
    if(req.url == "/get-record"){
        let record = await getAllRecords();
        res.writeHead(200, {"content-type":"appication/json", "Cache-Control":"no-cache"});
        res.end(JSON.stringify(record));
    }
    else{
        fileServer.serve(req, res);
    }
}

var express = require("express");
var app = express();

var express_server = http.createServer(app);
if(args.start_server_with_express){
    run_with_express();
}
function run_with_express(){
    defineRoute(app);
    express_server.listen(HTTP_PORT);
    console.log(`listening to http://localhost/${HTTP_PORT}`);
}
function defineRoute(app){
    app.get("/get-record", async function(req, res){
        var record = await getAllRecords();
        res.writeHead(200, {
            "Content-type" : "application/json",
            "Cache-Control":"no-cache"
        });
        res.end(JSON.stringify(record));
    })
}
app.use(function(req, res, next){
    if (/^\/(?:index\/?)?(?:[?#].*$)?$/.test(req.url)) {
        req.url = "/index.html";
    }
    else if (/^\/js\/.+$/.test(req.url)) {
        next();
        return;
    }
    else if (/^\/(?:[\w\d]+)(?:[\/?#].*$)?$/.test(req.url)) {
        let [,basename] = req.url.match(/^\/([\w\d]+)(?:[\/?#].*$)?$/);
        req.url = `${basename}.html`;
    }
    next();
})
app.use(express.static(WEB_PATH, {
    maxAge: 100,
    setHeaders: function setHeaders(res){
        res.setHeader("Server", "cmdlineutiliy: ex");
    }
}));

async function childprocess(){
    try{
        let res = await fetch("https://localhost:8081/get-record/")
        if(res && res.ok){
            let record = await res.JSON();
            if(record && record.length >0){
                process.exitCode = 0;
            }
        }
        process.exitCode = 1;

    }
    catch(err){}
    var child = childproc.spawn("node", ["child.js"]);
    child.on("exit", function(code){console.log("child finished", code)});
}
