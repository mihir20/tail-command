const fs = require('fs');
const logFile = './sample.log';
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const arrCons = [];

let lastModifyTime = new Date(0);

let _end = fs.statSync(logFile).size;
let _start = _end - Math.min(_end-200,0);
fs.watch(logFile, (event, filename) => {
    if (filename) {
      const stats = fs.statSync(filename);
    //   if (stats.mtime.valueOf() === lastModifyTime.valueOf()) {
    //     return;
    //   }
      lastModifyTime = stats.mtime;
      _end = stats.size;
      console.log(`${filename} file Changed ${_start}:${_end}`);
      if(_start<_end)getModifiedLog(_start,_end,arrCons);
    }
});

let getModifiedLog = (start,end,arrCons) => {
    var fileStream = fs.createReadStream(logFile, {start: start, end: end});

    fileStream.on('data', function(data) {
      _start = _end;
      console.log(data.toString());
      arrCons.forEach(socket=>{socket.send(data.toString())});
    });

    fileStream.on('error', function(err) {
      console.log(err);
    });
}
readFirstMsg = async (socket)=>{
    let end = fs.statSync(logFile).size;
    var readable = fs.createReadStream(logFile, {start: end - Math.min(end-200,0), end: end});
    const chunks = [];
    for await (let chunk of readable) {
      chunks.push(chunk);
    }
    let msg = Buffer.concat(chunks).toString();
    console.log(Buffer.concat(chunks).toString("utf-8"));
    socket.send(msg);
}
function getStream(stream) {
    return new Promise(resolve => {
      const chunks = [];
  
    //   # Buffer.from is required if chunk is a String, see comments
      stream.on("data", chunk => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString()));
    });
  }
wss.on('connection',(socket)=>{
    arrCons.push(socket);
    let end = fs.statSync(logFile).size;
    
    fs.open(logFile, 'r', function(status, fd) {
        if (status) {
            console.log(status.message);
            return;
        }
        var buffer = new Buffer(200);
        fs.read(fd, buffer, 0, 200, Math.min(end-200,0), function(err, num) {
            // console.log(buffer.toString('utf-8', 0, num));
            socket.send(buffer.toString('utf-8', 0, num))
        });
    });
    
    
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
    const stats = fs.statSync(logFile);
    // getModifiedLog(0,stats.size)
});