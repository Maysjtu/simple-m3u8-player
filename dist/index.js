'use strict';

var _Player = require('./Player.js');

var _Player2 = _interopRequireDefault(_Player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var myPlayer = new _Player2.default('player-box');
var button = document.getElementById('button');
var changeBtn = document.getElementById('change');

button.addEventListener('click', function () {
	myPlayer.loadSource({
		rendition0: 'http://p1yseh5av.bkt.clouddn.com/media/cg.m3u8',
		rendition1: 'http://p1yseh5av.bkt.clouddn.com/media/cg_160.m3u8'
	});
});

changeBtn.addEventListener('click', function () {
	myPlayer.changeRendition();
});