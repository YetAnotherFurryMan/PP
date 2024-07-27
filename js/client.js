/* global fetchProjects, fetchFrames, fetchAddProject */
/* global showFrame */
/* global showPopup, showErrorPopup */

const nav = document.getElementById('nav');
const main = document.getElementsByTagName('main')[0];
let currentProjectId = null;

function reloadProject(){
	main.innerHTML = '';
	
	let header = document.createElement('header');
	
	let title = document.createElement('span');
	title.innerHTML = '?';

	let cnt = document.createElement('section');
	cnt.className = 'cnt';
	cnt.addEventListener('wheel', (e) => {
		e.preventDefault();
		const scrollFactor = 0.001;
		const scrollF = (toScroll) => {
			let amount = toScroll*scrollFactor;
			if(amount > 0)
				amount = Math.ceil(amount);
			else
				amount = Math.floor(amount);
			cnt.scrollLeft += amount;
			toScroll -= amount;
			if(toScroll < -1 || toScroll > 1)
				setTimeout(scrollF, 2, toScroll);
		};
		scrollF(e.deltaY);
	});
	
	header.appendChild(title);
	main.appendChild(header);
	main.appendChild(cnt);

	fetchProjects(currentProjectId)
		.then(data => data[0])
		.then(project => {
			title.innerHTML = project.title;
			fetchFrames(currentProjectId, 0)
				.then(data => data[0])
				.then(frame => {
					showFrame(0, frame.id);
				}
			);
		}
	);
}

function reloadAll(){
	nav.innerHTML = '';
	fetchProjects().then(projects => {
		if(currentProjectId == null)
			currentProjectId = parseInt(projects[0].id);

		for(let proj of projects){
			let div = document.createElement('div');
			div.innerHTML = proj.title;
			div.addEventListener('click', () => {
				if(currentProjectId == proj.id) 
					return;
				
				let selected = nav.getElementsByClassName('selected')[0];
				selected.className = '';
				div.className = 'selected';
				currentProjectId = proj.id;
				reloadProject();
			});

			if(currentProjectId == proj.id)
				div.className = 'selected';
			
			nav.appendChild(div);
		}
	});

	reloadProject();
}

function addProjectCallback(){
	showPopup('Add New Project', 'Title: <input type="text"/><br />Description:<br /><textarea></textarea>', async cnt => {
		let title = cnt.getElementsByTagName('input')[0].value;
		let description = cnt.getElementsByTagName('textarea')[0].value;
		if(title.length <= 0 || !title.match('([A-Za-z0-9_-].*\\w?)+')){
			showErrorPopup('Failed to create new project', 'Words in the title cannot start with special symbol and cannot be empty.');
		} else{
			let ret = await fetchAddProject(title, description);
			if(!ret.good){
				showErrorPopup('Failed to create new project', 'Database error.');
			} else{
				currentProjectId = ret.id;
				reloadAll();
			}
		}
	});
}

reloadAll();
