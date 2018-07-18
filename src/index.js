import Player from './Player.js'

let myPlayer = new Player('player-box');
let button = document.getElementById('button');
let changeBtn = document.getElementById('change');

button.addEventListener('click',function() {
	myPlayer.loadSource({
		rendition0: 'http://p1yseh5av.bkt.clouddn.com/media/cg.m3u8',
		rendition1: 'http://p1yseh5av.bkt.clouddn.com/media/cg_160.m3u8'
	});
});

changeBtn.addEventListener('click',function() {
    myPlayer.changeRendition();
});
