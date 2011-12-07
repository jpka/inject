var nStatic = require("node-static"),
    path = require("path"),
    http = require("http"),
    sys = require("sys"),
    paperboy = require("paperboy"),
    serveFromArtifacts = null,
    serveFromExamples = null,
    serveFromTests = null;

// create a static server handler
function createServer(path) {
  return function(req, res) {
    paperboy
    .deliver(path, req, res)
    .addHeader('Expires', 0)
    .error(function(statCode, msg) {
      res.writeHead(statCode, {'Content-Type': 'text/plain'});
      res.end("Error " + statCode);
      log(statCode, req.url, ip, msg);
    })
    .otherwise(function(err) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end("Error 404: File not found");
      log(404, req.url, ip, err);
    });
  };
}

// three serving locations for this project
serveFromArtifacts = createServer(path.normalize("" + __dirname + "/../artifacts/dev"));
serveFromExamples = createServer(path.normalize("" + __dirname + "/../examples"));
serveFromTests = createServer(path.normalize("" + __dirname + "/../tests"));

// live server function, used on multiple ports
function server(request, response) {
  var serve = null,
      options = {};
  
  // select a server to handle this file
  if (request.url.indexOf("/examples") === 0) {
    serve = serveFromExamples;
    request.url = request.url.replace(/^\/examples/, "");
  }
  else if (request.url.indexOf("/tests") === 0) {
    serve = serveFromTests;
    request.url = request.url.replace(/^\/tests/, "");
  }
  else {
    serve = serveFromArtifacts;
  }
  
  // delayed serving calls
  if (request.url === '/requires/modules-1.1.1/ensure-overlap/multiply.js') {
    // delayed server call for the ensure-overlap unit test in modules 1.1.1 spec
    return setTimeout(function() {
      serve(request, response, function(err, result) {});
    }, 300);
  }
  if (request.url === '/deps/jqueryui/jquery.ui.widget.min.js') {
    // delayed server call for the jquery ui example
    return setTimeout(function() {
      serve(request, response, function(err, result) {});
    }, 5000);
  }
  if(request.url === '/requires/amd/delay.js') {
    // delayed server call 2 sec for amd ensure overlap unit test in amd
    return setTimeout(function() {
      unitTestingServer.serve(request, response, function(err, result) {});
    }, 2000);
  }
  if (request.url === '/favicon.ico') {
    // return empty response for favico... keeps the logs clear
    return response.end();
  }
  
  // standard serving call
  return serve(request, response);
}

http.createServer(server).listen(4000);
http.createServer(server).listen(4001);
sys.log("inject() server running on ports 4000 and 4001");
sys.log("-----")
sys.log("access examples: http://localhost:4000/examples/index.html");
sys.log("access tests:    http://localhost:4000/tests/index.html");
