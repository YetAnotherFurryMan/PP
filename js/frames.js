/* global fetchFrames, fetchAddFrame, fetchSetStatus, fetchSetFrame, fetchDeleteFrame */
/* global showPopup, showErrorPopup */
/* global main */

let frames = [];
function createFrameList(index, id, description, list, menuStatus){
	return fetchFrames(null, id).then(data => {
		if(data.length == 0){
			description.className += '-grow';
			list.style.display = 'none';
			
		} else{
			for(let e of data){
				let item = document.createElement('div');
				item.addEventListener('click', () => {
					let selected = list.getElementsByClassName('selected')[0];
					if(selected)
						selected.className = '';
					item.className = 'selected';
					showFrame(index + 1, e.id);
				});

				let title = document.createElement('span');
				title.innerHTML = e.title;

				let status = document.createElement('section');
				status.className = 'frame-status-' + e.status;

				item.appendChild(title);
				item.appendChild(status);
				list.appendChild(item);
			}
		}

		return list;
	});
}

function generateFrameAddBtn(index, id, description, list, menuStatus){
	let btn = document.createElement('button');
	btn.innerHTML = '+';
	btn.addEventListener('click', () => {
		showPopup('Add New Item', 'Title: <input type="text"/><br />Description:<br /><textarea></textarea>', async (cnt) => {
			let title = cnt.getElementsByTagName('input')[0].value;
			let desc = cnt.getElementsByTagName('textarea')[0].value;
			if(title.length <= 0 || !title.match('([A-Za-z0-9_-].*\\w?)+')){
				showErrorPopup('Failed to create new frame', 'Words in the title cannot start with special symbol and cannot be empty.');
			} else{
				let ret = await fetchAddFrame(title, desc, id);
				if(!ret.good){
					showErrorPopup('Failed to create new frame', 'Database error.');
				} else{
					list.innerHTML = '';
					list.style.display = 'block';
					description.className = 'frame-description';
					createFrameList(index, id, description, list, menuStatus).then(list => {
						let item = list.children[list.childElementCount - 1];
						item.click();
					});
				}
			}
		});
	});
	return btn;
}

function createElementWithClassName(tag, className, innerHTML = ''){
	let element = document.createElement(tag);
	element.className = className;
	element.innerHTML = innerHTML;
	return element;
}

function showFrame(index, id){
	if(frames[index]){
		for(let i = index; frames[i]; i++){
			frames[i].parentElement.removeChild(frames[i]);
			frames[i] = undefined;
		}
	}

	let frame = createElementWithClassName('section', 'frame');
	let header = document.createElement('header');
	let title = createElementWithClassName('span', '', '?');
	let cnt = createElementWithClassName('section', 'frame-cnt');
	let description = createElementWithClassName('section', 'frame-description');
	let list = createElementWithClassName('section', 'frame-list');
	let status = createElementWithClassName('section', 'frame-status');
	let menuStatus = document.createElement('span');
	let menuEdit = createElementWithClassName('span', '', 'E');
	let menuRemove = createElementWithClassName('span', '', 'R');
	let btn = generateFrameAddBtn(index, id, description, list, menuStatus, menuRemove);
	let footer = document.createElement('footer');
	let menu = createElementWithClassName('section', 'frame-menu');
	let menuIcon = createElementWithClassName('span', '', '<');
	let menuBar = createElementWithClassName('span', 'frame-menu-bar');
	
	main.getElementsByClassName('cnt')[0].appendChild(frame);
	frames[index] = frame;
	
	description.style.display = 'none';
	menu.style.width = '2em';
	menuBar.style.display = 'none';

	fetchFrames(null, null, id)
		.then(data => data[0])
		.then(data => {
			title.innerHTML = data.title;
			status.className += '-' + data.status;
			if(data.description){
				description.innerHTML = data.description;
				description.style.display = 'block';
			}

			createFrameList(index, id, description, list, menuStatus);

			menuEdit.addEventListener('click', () => {
				showPopup('Edit Frame', `Title: <input type="text" value="${data.title}"/><br />Description:<br /><textarea>${data.description?data.description:""}</textarea>`, cnt => {
					let t = cnt.getElementsByTagName('input')[0].value;
					let desc = cnt.getElementsByTagName('textarea')[0].value;
					if(t.length <= 0 || !t.match('([A-Za-z0-9_-].*\\w?)+')){
						showErrorPopup('Failed to edit the frame', 'Words in the title cannot start with special symbol and cannot be empty.');
					} else{
						if(!fetchSetFrame(id, t, desc)){
							showErrorPopup('Failed to edit the frame', 'Database error.');
						} else{
							title.innerHTML = t;
							if(desc.length > 0){
								description.innerHTML = desc;
								description.style.display = 'block';
							} else{
								description.innerHTML = '';
								description.style.display = 'none';
							}
							if(index > 0)
								frames[index - 1].getElementsByClassName('selected')[0].getElementsByTagName('span')[0].innerHTML = t;
						}
					}
				});
			});
			
			if(index <= 0){
				menuRemove.addEventListener('click', () => {
					showErrorPopup('Failed to remove frame', 'Cannot remove root frame of a project.');
				});
			} else{
				menuRemove.addEventListener('click', () => {
					let itemCount = list.children.length;
					if(itemCount > 0){
						showErrorPopup('Failed to remove frame', 'Cannot remove non-empty frame.');
					} else{
						showPopup('Remove Frame', 'Are you shure, you want to pernamently remove the frame?', () => {
							if(!fetchDeleteFrame(id)){
								showErrorPopup('Failed to remove frame', 'Database error.');
							} else{
								showFrame(index - 1, data.parent_id);
							}
						});
					}
				});
			}
		}
	);
	
	menuIcon.addEventListener('click', () => {
		if(menu.style.width == '2em'){
			menuBar.style.display = 'grid';
			menuIcon.innerHTML = '>';
			menu.style.width = 'calc(max(30%, 6em) + 2em)';
		} else{
			menuBar.style.display = 'none';
			menuIcon.innerHTML = '<';
			menu.style.width = '2em';
		}
	});

	menuStatus.addEventListener('click', () => {
		if(list.children.length <= 0){
			showPopup('Change Status', 'New Status: <select><option value="0">Leaved</option><option value="1">In Progress</option><option value="2">Done</option></select>', cnt => {
				let newStatus = cnt.getElementsByTagName('select')[0].value;
				if(!fetchSetStatus(id, newStatus)){
					showErrorPopup('Failed to change frame status', 'Database error.');
				} else{
					const className = 'frame-status-' + newStatus;
					menuStatus.children[0].className = className;
					if(index > 0)
						frames[index - 1].getElementsByClassName('selected')[0].getElementsByTagName('section')[0].className = className;
				}
			});
		}
	});
	
	frame.appendChild(header);
	frame.appendChild(cnt);
	frame.appendChild(footer);
	
	header.appendChild(title);
	header.appendChild(btn);

	cnt.appendChild(description);
	cnt.appendChild(list);

	footer.appendChild(menu);
	
	menu.appendChild(menuIcon);
	menu.appendChild(menuBar);

	menuBar.appendChild(menuRemove);
	menuBar.appendChild(menuEdit);
	menuBar.appendChild(menuStatus);
	
	menuStatus.appendChild(status);
}
