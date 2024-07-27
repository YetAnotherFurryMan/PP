const http = require('http');
const fs = require('fs');

const sqlite3 = require('sqlite3').verbose();

const port = 3030;
const host = 'localhost';
const db = 'db/test.db';

const themes = ['debug', 'onedark', 'catppuccin']
const themeVariants = {
	'debug': ['default'],
	'onedark': ['darker', 'dark', 'cool', 'deep', 'warmer', 'warm', 'light'],
	'catppuccin': ['latte', 'frappe', 'macchiato', 'mocha']
};

let theme = 'debug';
let themeVariant = 'default';

const database = new sqlite3.Database(db, sqlite3.OPEN_READWRITE, (err) => {
	if(err){
		console.error("Failed to connect to the database (" + db + "): " + err);
		process.abort();
	}
	console.log("Connected to database: " + db);
});

function sendFile(res, path, mime){
	let cnt = undefined;

	if(mime == 'text/css'){
		if(path == 'css/theme.css'){
			path = 'css/' + theme + '/' + theme + '.css';
		} else if(path == 'css/variant.css'){
			if(theme == 'debug' || themeVariant == 'default'){
				res.writeHead(200, {'Content-Type': mime});
				res.end();
				return;
			}
			path = 'css/' + theme + '/' + themeVariant + '.css';
		}
	}

	try{
		cnt = fs.readFileSync(path);
	} catch(e){
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.end('404 Not Found');
		console.log(e);
		console.log('Path: ' + path);
		return;
	}

	if(cnt){
		res.writeHead(200, {'Content-Type': mime});
		res.end(cnt);
	}
}

let app = require('./app/app.js');

function setTheme(url){
	for(let e of themes){
		if(url.includes('theme/' + e)){
			theme = e;
			themeVariant = themeVariants[e][0];
			return;
		}
	}
}

function setThemeVariant(url){
	for(let v of themeVariants[theme]){
		if(url.includes('variant/' + v)){
			themeVariant = v;
			return;
		}
	}
	themeVariant = 'default';
}

const server = http.createServer((req, res) => {
	try{
		if(req.method.toUpperCase() == 'GET'){
			if(req.url.endsWith('.css'))
				sendFile(res, 'css' + req.url.substring(req.url.lastIndexOf('/')), 'text/css');
			else if(req.url.endsWith('.js'))
				sendFile(res, 'js' + req.url.substring(req.url.lastIndexOf('/')), 'text/javascript');
			else{
				let url = req.url.toLowerCase();

				if(url.endsWith('app')){
					console.log("Reload");
					delete require.cache[require.resolve('./app/app.js')];
					app = require('./app/app.js');
				}

				if(url.includes('/theme/'))
					setTheme(url);

				if(url.includes('/variant/'))
					setThemeVariant(url);
				
				sendFile(res, 'index.html', 'text/html');
			}
		} else if(req.method.toUpperCase() == 'POST'){
			try{
				app.handlePost(req, res, database);
			} catch(e){
				console.log(e);
				res.writeHead(500);
				res.end("500 Server Internal Error");
			}
		} else{
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end("404 Not Found")
		}
	} catch(e){
		console.log(e);
		res.end();
	}
});

server.on('clientError', (err, socket) => {
	if (err.code === 'ECONNRESET' || !socket.writable)
		return;

	socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(port, host, () => {
	console.log("Listening http://" + host + ":" + port);
});

function death_callback(){
	console.log("I'm dying!");
	server.close((err) => console.log(err));
	database.close((err) => console.log(err));
	process.exit(0);
}

process.on('SIGINT', death_callback);  // CTRL+C
process.on('SIGQUIT', death_callback); // Keyboard quit
process.on('SIGTERM', death_callback); // `kill` command
