/* eslint no-unused-vars: ["warn", {"varsIgnorePattern":"show"}]*/

function showPopup(title, content, callback){
	let popup = document.createElement('section');
	popup.className = 'popup';

	let body = document.createElement('section');
	body.className = 'popup-body';

	let header = document.createElement('header');
	header.innerHTML = title;

	let cnt = document.createElement('section');
	cnt.className = 'popup-cnt';
	cnt.innerHTML = content;

	let footer = document.createElement('section');
	footer.className = 'popup-footer';

	let closeCallback = () => {
		document.body.removeChild(popup);
	};

	let okBtn = document.createElement('button');
	okBtn.className = 'popup-btn';
	okBtn.innerHTML = 'ok';
	okBtn.addEventListener('click', 
		(callback)? () => {
			callback(cnt);
			document.body.removeChild(popup);
		}: closeCallback);

	let noBtn = document.createElement('button');
	noBtn.className = 'popup-btn';
	noBtn.innerHTML = 'close';
	noBtn.addEventListener('click', closeCallback);

	footer.appendChild(okBtn);
	if(callback) footer.appendChild(noBtn);
	body.appendChild(header);
	body.appendChild(cnt);
	body.appendChild(footer);
	popup.appendChild(body);
	document.body.appendChild(popup);

	return popup;
}

function showErrorPopup(title, content){
	let popup = showPopup(title, content);
	popup.getElementsByTagName('header')[0].className = 'popup-error';
	return popup;
}
