function toggleNav(){
	let nav = document.getElementsByTagName('nav')[0];
	let list = document.getElementById('nav');
	let btn = nav.getElementsByTagName('button')[0];

	if(list.className != '')
		list.className = '';
	else
		list.className = 'nav-toggled';

	btn.className = list.className;
}
