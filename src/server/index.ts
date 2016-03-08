import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as path from 'path';
import * as Express from 'express';

/// Start point of your application
export function serve() {
	var app = Express();

	app.use(bodyParser.json());

	app.use(Express.static('public'));

	// E.g. When going to /api
	app.get('/api', function(req, res, next) {
		return res.json({ title: "Kareem" });
	});

	/// All routes return the index page
	app.get('/*', function(req, res, next) {
	  return res.sendFile(path.join(__dirname, 'index.html'));
	});

  var server = http.createServer(app);

  server.listen(3000, function() {
  	console.log('Server is listening on port 3000');
  });

  return server;
}