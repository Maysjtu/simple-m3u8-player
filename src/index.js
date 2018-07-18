import Player from './Player.js'

let myPlayer = new Player('player-box');
let button = document.getElementById('button');
let changeBtn = document.getElementById('change');

button.addEventListener('click',function() {
	myPlayer.loadSource({
		rendition0: '../docs/assets/cg.m3u8',
		rendition1: '../docs/assets/cg_160.m3u8'
	});
});

changeBtn.addEventListener('click',function() {
    myPlayer.changeRendition();
});
