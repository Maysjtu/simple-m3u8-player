'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _m3u8Parser = require('m3u8-parser');

var _m3u8Parser2 = _interopRequireDefault(_m3u8Parser);

var _resolveUrl = require('./utils/resolve-url');

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _Segment = require('./Segment');

var _Segment2 = _interopRequireDefault(_Segment);

var _eventBus = require('./utils/event-bus');

var _eventBus2 = _interopRequireDefault(_eventBus);

var _PlayList = require('./PlayList');

var _PlayList2 = _interopRequireDefault(_PlayList);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Player = function () {
    function Player(id) {
        _classCallCheck(this, Player);

        this.playerBox = document.getElementById(id);
        this.mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    }

    _createClass(Player, [{
        key: 'loadSource',
        value: function loadSource(options) {
            this.clearUp();
            this.bindEvent();
            this.ready1 = false;
            this.ready2 = false;
            this.rendition = 0;
            this.playList0 = new _PlayList2.default(options.rendition0, 0);
            this.playList1 = new _PlayList2.default(options.rendition1, 1);
        }
    }, {
        key: 'bindEvent',
        value: function bindEvent() {
            var _this = this;

            _eventBus2.default.on('remuxed', function (segment) {
                console.log('remuxed', segment);
                _this.bufferQueue.push(segment);
                if (!_this.sourceBuffer.updating && _this.mediaSource.readyState === 'open') {
                    _this.flushBufferQueue();
                }
            });
            _eventBus2.default.on('getManifest', function (signal) {
                if (signal == 0) {
                    _this.ready1 = true;
                }
                if (signal == 1) {
                    _this.ready2 = true;
                }
                if (_this.ready1 && _this.ready2) {
                    _this.totalDuration = _this.playList1.totalDuration;
                    _this.initPlay();
                }
            });
        }
    }, {
        key: 'changeRendition',
        value: function changeRendition() {
            this.rendition = !this.rendition;
            if (this.rendition) {
                this.segments = this.playList1.segments;
            } else {
                this.segments = this.playList0.segments;
            }
        }
    }, {
        key: 'initPlay',
        value: function initPlay() {
            var _this2 = this;

            if (!_window2.default.MediaSource) {
                this.log('Your browser not support MSE');
            }
            this.videoElement = document.createElement('video');
            this.videoElement.setAttribute('controls', true);
            this.mediaSource = new MediaSource();
            this.mediaSource.addEventListener('sourceopen', function () {
                console.log(_this2.mediaSource);
                _this2.mediaSource.duration = _this2.totalDuration || 0;
                _this2.log('Creating sourceBuffer');
                _this2.createSourceBuffer();
            });

            this.videoElement.src = _window2.default.URL.createObjectURL(this.mediaSource);
            this.playerBox.appendChild(this.videoElement);
            this.bufferQueue = [];
            this.updatingSegment = null;
        }
    }, {
        key: 'watchVideoOperation',
        value: function watchVideoOperation() {
            var _this3 = this;

            this.videoElement.addEventListener('seeking', function (e) {
                console.log('seeking');
            });
            this.videoElement.addEventListener('timeupdate', function (e) {
                _this3.downloadUpcomingSegment();
            });
        }
    }, {
        key: 'createSourceBuffer',
        value: function createSourceBuffer() {
            var _this4 = this;

            _window2.default.URL.revokeObjectURL(this.videoElement.src);
            this.log('create sourcebuffer');
            this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
            this.sourceBuffer.addEventListener('updateend', function () {
                _this4.log('Ready');
                _this4.flushBufferQueue();
            });
            this.watchVideoOperation();
            this.downloadInitSegment();
        }
    }, {
        key: 'downloadInitSegment',
        value: function downloadInitSegment() {
            this.log('download init');
            this.segments = this.playList0.segments;
            this.segments[0].download();
        }
    }, {
        key: 'downloadUpcomingSegment',
        value: function downloadUpcomingSegment() {
            var _this5 = this;

            var nextSegments = this.segments.filter(function (segment) {
                return !segment.requested && segment.timeStart <= _this5.videoElement.currentTime + 5 && segment.timeEnd > _this5.videoElement.currentTime;
            });
            if (nextSegments.length) {
                nextSegments.forEach(function (segment) {
                    segment.download();
                });
            } else {
                if (this.segments.filter(function (segment) {
                    return !segment.requested;
                }).length === 0) {
                    this.log("Finished buffering whole video");
                } else {
                    this.log("Finished buffering ahead");
                }
            }
        }
    }, {
        key: 'concatBuffer',
        value: function concatBuffer() {
            var bytesLength = 0,
                offset = 0;
            this.bufferQueue.forEach(function (segment) {
                segment.buffered = true;
                bytesLength += segment.bufferData.length;
            });
            var resultsBuffer = new Uint8Array(bytesLength);
            this.bufferQueue.forEach(function (segment) {
                bytesLength += segment.bufferData.length;
                resultsBuffer.set(segment.bufferData, offset);
                offset += segment.bufferData.length;
            });
            return resultsBuffer;
        }
    }, {
        key: 'flushBufferQueue',
        value: function flushBufferQueue() {
            if (this.sourceBuffer.updating || !this.bufferQueue.length) {
                // this.checkEnd();
                return;
            }
            var bufferData = this.concatBuffer();
            //!使用单独transmuxer的时候segment上的时间戳信息会丢失？看一下mux的源码，查找原因。
            this.timestampOffset = this.bufferQueue[0].timeStart;
            this.bufferQueue = [];
            this.appendBuffer(bufferData);
        }
    }, {
        key: 'checkEnd',
        value: function checkEnd() {
            var unBuffered = this.segments.filter(function (segment) {
                return !segment.buffered;
            });
            if (!unBuffered.length) {
                this.mediaSource.endOfStream();
                this.log('MediaSource End');
            }
        }
    }, {
        key: 'appendBuffer',
        value: function appendBuffer(data) {
            this.log('appending buffer');

            this.sourceBuffer.timestampOffset = this.timestampOffset;
            this.sourceBuffer.appendBuffer(data);
        }
    }, {
        key: 'log',
        value: function log(text) {
            if (!this.logBox) {
                this.logBox = document.createElement('div');
                this.playerBox.appendChild(this.logBox);
            }
            var rendition = this.rendition ? 'Low' : 'High';
            this.logBox.innerHTML = 'Rendition: ' + rendition + ' <br>  \n             Information: ' + text + ' ';
        }
    }, {
        key: 'clearUp',
        value: function clearUp() {
            if (this.videoElement) {
                this.videoElement.remove();
            }
            try {
                _eventBus2.default.removeEvent();
                delete this.mediaSource;
                delete this.sourceBuffer;
                delete this.bufferQueue;
            } catch (e) {}
        }
    }]);

    return Player;
}();

exports.default = Player;