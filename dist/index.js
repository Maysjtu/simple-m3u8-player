'use strict';

var _Player = require('./Player.js');

var _Player2 = _interopRequireDefault(_Player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var myPlayer = new _Player2.default('player-box'); /*
                                                   * @Author: Mayde
                                                   * @Email:  maysjtu@163.com
                                                   * @Date:   2018-07-11 19:39:27
                                                   * @Last Modified by:   Mayde
                                                   * @Last Modified time: 2018-07-11 19:44:30
                                                   */

var button = document.getElementById('button');

button.addEventListener('click', function () {
	myPlayer.fetchM3U8('../assets/cg.m3u8');
});