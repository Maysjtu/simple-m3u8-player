'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @Author: Mayde
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @Email:  maysjtu@163.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @Date:   2018-07-11 18:57:04
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @Last Modified by:   Mayde
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @Last Modified time: 2018-07-11 20:14:02
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */


var _m3u8Parser = require('m3u8-parser');

var _m3u8Parser2 = _interopRequireDefault(_m3u8Parser);

var _mp = require('mux.js/lib/mp4');

var _mp2 = _interopRequireDefault(_mp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Player = function () {
  function Player(id) {
    _classCallCheck(this, Player);

    this.playerBox = document.getElementById(id);
    this.mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  }

  _createClass(Player, [{
    key: 'initPlay',
    value: function initPlay() {
      var _this = this;

      if (!window.MediaSource) {
        this.log('Your browser not support MSE');
      }
      this.clearUp();
      this.videoElement = document.createElement('video');
      this.videoElement.setAttribute('controls', true);
      this.mediaSource = new MediaSource();
      this.mediaSource.addEventListener('sourceopen', function () {
        _this.mediaSource.duration = _this.totalDuration;
        _this.log('Creating sourceBuffer');
        _this.createSourceBuffer();
      });

      this.videoElement.src = window.URL.createObjectURL(this.mediaSource);
      this.playerBox.appendChild(this.videoElement);
      // this.watchVideoOperation();

      this.transmuxer = new _mp2.default.Transmuxer();
      this.createdInitSegment = false;
      this.remuxedSegments = [];
      this.remuxedInitSegment = null;
    }

    // watchVideoOperation() {
    // 	this.videoElement.addEventListener('seeking',(e) => {
    // 		console.log(e);
    // 		let timeStamp = e.timeStamp/1000;
    //
    // })
    // }

  }, {
    key: 'createSourceBuffer',
    value: function createSourceBuffer() {
      var _this2 = this;

      window.URL.revokeObjectURL(this.videoElement.src);
      this.log('create sourcebuffer');
      this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
      this.sourceBuffer.addEventListener('updateend', function () {
        _this2.log('Ready');
        _this2.updateEnd();
      });

      this.getRemuxedSegments();
      this.index = 0;
      this.fetchSegment(this.index);
    }
  }, {
    key: 'getRemuxedSegments',
    value: function getRemuxedSegments() {
      var _this3 = this;

      this.remuxedIndex = -1;
      this.transmuxer.on('data', function (segment) {
        console.log('get transmuxer segment', _this3.remuxedIndex, segment);
        _this3.remuxedSegments.push(segment);
        if (!_this3.remuxedInitSegment) {
          _this3.remuxedInitSegment = segment.initSegment;
        }
        _this3.appendBuffer();
      });
    }
  }, {
    key: 'updateEnd',
    value: function updateEnd() {
      if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open' && this.index == this.playManifest.segments.length - 1) {
        this.mediaSource.endOfStream();
        // this.videoElement.play();
        return;
      }
      this.index++;
      this.fetchSegment(this.index);
    }
  }, {
    key: 'appendBuffer',
    value: function appendBuffer() {
      this.remuxedIndex++;
      var bytes = null,
          offset = 0;

      if (!this.createdInitSegment) {
        bytes = new Uint8Array(this.remuxedInitSegment.byteLength + this.remuxedSegments[this.remuxedIndex].data.byteLength);
        bytes.set(this.remuxedInitSegment, offset);
        offset += this.remuxedInitSegment.byteLength;
        var segmentOffset = offset;
        bytes.set(this.remuxedSegments[this.remuxedIndex].data, segmentOffset);
        this.sourceBuffer.appendBuffer(bytes);
        this.createdInitSegment = true;
      } else {
        this.sourceBuffer.appendBuffer(this.remuxedSegments[this.remuxedIndex].data);
      }
    }
  }, {
    key: 'parseM3U8',
    value: function parseM3U8(data) {
      var _this4 = this;

      this.parser.push(data);
      this.parser.end();
      this.playManifest = this.parser.manifest;
      this.totalDuration = 0;
      this.playManifest.segments.forEach(function (segment) {
        _this4.totalDuration += segment.duration;
      });
      this.log('Get manifest');
      console.log(this.playManifest);
      this.initPlay();
    }
  }, {
    key: 'fetchM3U8',
    value: function fetchM3U8(sourceFile) {
      var self = this;
      this.sourceFile = sourceFile;
      this.parser = new _m3u8Parser2.default.Parser();
      fetch(this.sourceFile, {}).then(function (response) {
        return response.text();
      }).then(function (data) {
        self.parseM3U8(data);
      });
    }
  }, {
    key: 'fetchSegment',
    value: function fetchSegment(index) {
      var self = this;
      var videoUrl = '../assets/' + this.playManifest.segments[index]['uri'];
      self.log('get ' + self.playManifest.segments[index]['uri']);
      fetch(videoUrl, {}).then(function (response) {
        return response.arrayBuffer();
      }).then(function (arrayBuffer) {
        self.transmuxer.push(new Uint8Array(arrayBuffer));
        self.transmuxer.flush();
      });
    }
  }, {
    key: 'log',
    value: function log(text) {
      if (!this.logBox) {
        this.logBox = document.createElement('div');
        this.playerBox.appendChild(this.logBox);
      }
      this.logBox.innerHTML = text;
    }
  }, {
    key: 'clearUp',
    value: function clearUp() {
      if (this.videoElement) {
        this.videoElement.remove();
        delete this.mediaSource;
        delete this.sourceBuffer;
        delete this.parser;
        delete this.transmuxer;
      }
    }
  }]);

  return Player;
}();

exports.default = Player;