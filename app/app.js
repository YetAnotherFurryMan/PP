function e400(res){
	res.writeHead(400, {'Content-Type': 'text/plain'});
	res.end('400 Bad Request');
}

function e500(res){
	res.writeHead(500, {'Content-Type': 'text/plain'});
	res.end('500 Internal Server Error');
}

function ok200(res){
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('OK');
}

function ok200JSON(res, data){
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.end(JSON.stringify(data));
}

function ifE500(res, err){
	if(err){
		e500(res);
		console.log(err);
		return true;
	}
	return false;
}

function handleProjects(req, res, db){
	let body = '';
	req.on('data', chunk => {
		body += chunk;
	});

	let callback = (err, rows) => {
		if(ifE500(res, err)) return;

		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write('{"projects":[');

		let addComma = false;
		rows.forEach(row => {
			if(addComma) res.write(',');
			else addComma = true;
			res.write(JSON.stringify(row));
		});
		res.end(']}');
	};
		
	req.on('end', () => {
		body = JSON.parse(body);
		if(body.id)
			db.all('SELECT OID as id, * FROM project WHERE OID = ?;', body.id, callback);
		else
			db.all('SELECT OID as id, * FROM project;', [], callback);
	});
}

function handleFrames(req, res, db){
	let body = '';
	req.on('data', chunk => {
		body += chunk;
	});

	let callback = (err, rows) => {
		if(ifE500(res, err)) return;

		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write('{"frames":[');

		let addComma = false;
		rows.forEach(row => {
			if(addComma) res.write(',');
			else addComma = true;
			res.write(JSON.stringify(row));
		});
		res.end(']}');
	};
		
	req.on('end', () => {
		body = JSON.parse(body);
		if(body.id)
			db.all('SELECT OID as id, * FROM frame WHERE OID = ?;', body.id, callback);
		else if(body.parent)
			db.all('SELECT OID as id, * FROM frame WHERE parent_id = ?;', body.parent, callback);
		else if(body.project)
			db.all('SELECT OID as id, * FROM frame WHERE project_id = ?;', body.project, callback);
		else
			db.all('SELECT OID as id, * FROM frame;', [], callback);
	});
}

function handleAddProject(req, res, db){
	let body = '';

	req.on('data', chunk => {
		body += chunk;
	});
		
	req.on('end', () => {
		body = JSON.parse(body);
		if(!body.title){
			e400(res);
			return;
		}

		db.run('INSERT INTO project (title) VALUES (?);', body.title, err => {
			if(ifE500(res, err))
				return;
			db.all('SELECT max(OID) as id FROM project;', [], (err, rows) => {
				rows.forEach(row =>{
					db.run('INSERT INTO frame (title, description, project_id) VALUES (?, ?, ?);', [body.title, body.description, row.id], err => {
						if(ifE500(res, err))
							return;
						db.all('SELECT max(OID) as id FROM frame;', [], (err, rows) => {
							if(ifE500(res, err))
								return;
							rows.forEach(row2 => {
								ok200JSON(res, {id: row.id, frame: row2.id});
							});
						});
					});
				});
			});
		});
	});
}

function handleAddFrame(req, res, db){
	let body = '';

	req.on('data', chunk => {
		body += chunk;
	});
		
	req.on('end', () => {
		body = JSON.parse(body);
		if(!body.title || !body.parent){
			e400(res);
			return;
		}

		db.run('INSERT INTO frame (title, description, project_id, parent_id) VALUES (?, ?, (SELECT project_id FROM frame WHERE OID = ?), ?);', [body.title, body.description, body.parent, body.parent], err => {
			if(ifE500(res, err))
				return;
			db.all('SELECT max(OID) as id FROM frame;', [], (err, rows) => {
				if(ifE500(res, err))
					return;

				rows.forEach(row => {
					recalculateParentStatus(row.id, res, db, false);
					ok200JSON(res, {id: row.id});
				});
			});
		});
	});
}

function recalculateParentStatus(id, res, db, ok = true){
	if(id <= 0){
		if(ok)
			ok200(res);
		return;
	}

	db.all('SELECT OID as id, status FROM frame WHERE OID = (SELECT parent_id FROM frame WHERE OID = ?);', id, (err, rows) => {
		if(ifE500(res, err))
			return;

		let parent = { id: 0, status: 0};

		rows.forEach(row => {
			parent.id = row.id;
			parent.status = row.status;
		});

		db.all('SELECT status, COUNT(OID) as count FROM frame WHERE parent_id = ? GROUP BY status;', parent.id, (err, rows) => {
			if(ifE500(res, err))
				return;

			let statuses = [0, 0, 0];
	
			rows.forEach(row => {
				statuses[row.status] = row.count;
			});

			let newStatus = 2;
			if(statuses[1] > 0)
				newStatus = 1;
			else if(statuses[0] > 0)
				newStatus = 0;

			if(newStatus != parent.status){
				db.run('UPDATE frame SET status = ? WHERE OID = ?;', [newStatus, parent.id], err => {
					if(ifE500(res, err))
						return;
					recalculateParentStatus(parent.id, res, db);
				});
			} else{
				if(ok)
					ok200(res);
			}
		});
	});
}

function handleSetStatus(req, res, db){
	let body = '';

	req.on('data', chunk => {
		body += chunk;
	});

	req.on('end', () => {
		body = JSON.parse(body);
		if(!body.frame || !body.new){
			e400(res);
			return;
		}

		db.run('UPDATE frame SET status = ? WHERE OID = ?;', [body.new, body.frame], err => {
			if(ifE500(res, err))
				return;
			recalculateParentStatus(body.frame, res, db);
		});
	});
}

function handleSetFrame(req, res, db){
	let body = '';

	req.on('data', chunk => {
		body += chunk;
	});

	req.on('end', () => {
		body = JSON.parse(body);
		if(!body.id || !body.title){
			e400(res);
			return;
		}

		db.run('UPDATE frame SET title = ?, description = ? WHERE OID = ?;', [body.title, body.description, body.id], err => {
			if(!ifE500(res, err))
				ok200(res);
		});
	});
}

function handleDeleteFrame(req, res, db){
	let body = '';

	req.on('data', chunk => {
		body += chunk;
	});

	req.on('end', () => {
		body = JSON.parse(body);
		if(!body.id){
			e400(res);
			return;
		}

		db.run('DELETE FROM frame WHERE OID = ?', body.id, err => {
			if(!ifE500(res, err))
				ok200(res);
		});
	});
}

function handlePost(req, res, db){
	if(req.url == '/projects'){
		handleProjects(req, res, db);
	} else if(req.url == '/frames'){
		handleFrames(req, res, db);
	} else if(req.url == '/add/project'){
		handleAddProject(req, res, db);
	} else if(req.url == '/add/frame'){
		handleAddFrame(req, res, db);
	} else if(req.url == '/set/status'){
		handleSetStatus(req, res, db);
	} else if(req.url == '/set/frame'){
		handleSetFrame(req, res, db);
	} else if(req.url == '/delete/frame'){
		handleDeleteFrame(req, res, db);
	} else{
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.end("404 Not Found");
	}
}

module.exports = {
	handlePost: handlePost
};
