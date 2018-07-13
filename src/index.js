/*
* @Author: Mayde
* @Email:  maysjtu@163.com
* @Date:   2018-07-11 19:39:27
* @Last Modified by:   Mayde
* @Last Modified time: 2018-07-11 19:44:30
*/

import Player from './Player.js'

let myPlayer = new Player('player-box');
let button = document.getElementById('button');

button.addEventListener('click',function() {
	myPlayer.fetchM3U8('../assets/cg.m3u8');
});
