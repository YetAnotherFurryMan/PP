/* eslint no-unused-vars: ["warn", {"varsIgnorePattern":"fetch"}]*/

function fetchProjects(id){
	return fetch("http://localhost:3030/projects", {
		headers: {'Content-Type': 'application/json'},
		method: 'post',
		body: JSON.stringify({
			'id': id
		})
	}).then(data => data.json())
	.then(data => data.projects);
}

function fetchFrames(projectId, parentId, id){
	return fetch("http://localhost:3030/frames", {
		headers: {'Content-Type': 'application/json'},
		method: 'post',
		body: JSON.stringify({
			'project': projectId,
			'parent': parentId,
			'id': id
		})
	}).then(data => data.json())
	.then(data => data.frames);
}

async function fetchAddProject(title, description){
	let good = await fetch('http://localhost:3030/add/project', {
		headers: {'Content-Type': 'application/json'},
		method: 'post',
		body: JSON.stringify({
			title: title,
			description: description
		})
	}).then(async data => { 
		let json = await data.json();
		return {
			good: data.status == 200, 
			id: json.id,
			frame: json.frame
		};
	});
	return good;
}

async function fetchAddFrame(title, description, parentId){
	let good = await fetch('http://localhost:3030/add/frame', {
		headers: {'Content-Type': 'application/json'},
		method: 'post',
		body: JSON.stringify({
			title: title,
			description: description,
			parent: parentId
		})
	}).then(async data => {
		let json = await data.json();
		return {
			good: data.status == 200,
			id: json.id
		};
	});
	return good;
}

async function fetchSetStatus(id, newStatus){
	let good = await fetch('http://localhost:3030/set/status', {
		headers: {'Content-Type': 'application/json'},
		method: 'post',
		body: JSON.stringify({
			frame: id,
			'new': newStatus
		})
	}).then(data => {
		return data.status == 200;
	});

	return good;
}

async function fetchSetFrame(id, title, description){
	let good = await fetch('http://localhost:3030/set/frame', {
		headers: {'Content-Type': 'application/json'},
		method: 'post',
		body: JSON.stringify({
			id: id,
			title: title,
			description: description
		})
	}).then(data => {
		return data.status == 200;
	});

	return good;
}

async function fetchDeleteFrame(id){
	let good = await fetch('http://localhost:3030/delete/frame', {
		headers: {'Content-Type': 'application/json'},
		method: 'post',
		body: JSON.stringify({
			id: id
		})
	}).then(data => {
		return data.status == 200;
	});
	return good;
}
