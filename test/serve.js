const finalhandler = require('finalhandler');
const http = require('http');
const serveStatic = require('serve-static');

const serve = serveStatic('dist');
const server = http.createServer((req, res) => serve(req, res, finalhandler(req, res)));
server.listen(3000);
