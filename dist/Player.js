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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Player = function () {
    function Player(id) {
        _classCallCheck(this, Player);

        this.playerBox = document.getElementById(id);
        this.mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    }

    _createClass(Player, [{
        key: 'fetchM3U8',
        value: function fetchM3U8(sourceFile) {
            var self = this;
            this.sourceFile = (0, _resolveUrl.getAbsoluteUrl)(sourceFile);
            console.log('sourceFile', this.sourceFile);
            this.parser = new _m3u8Parser2.default.Parser();
            fetch(this.sourceFile, {}).then(function (response) {
                return response.text();
            }).then(function (data) {
                self.parseM3U8(data);
            });
        }
    }, {
        key: 'parseM3U8',
        value: function parseM3U8(data) {
            var _this = this;

            this.parser.push(data);
            this.parser.end();
            this.playManifest = this.parser.manifest;
            this.totalDuration = 0;
            this.playManifest.segments.forEach(function (segment, index) {
                segment.uri = (0, _resolveUrl.resolveUrl)(_this.sourceFile, segment.uri);
                var segmentInstance = new _Segment2.default(index, segment.uri, true, _this.totalDuration, _this.totalDuration + segment.duration, segment.timeline);
                _this.totalDuration += segment.duration;
                if (!_this.segments) {
                    _this.segments = [];
                }
                _this.segments.push(segmentInstance);
            });
            this.log('Get manifest');
            console.log(this.playManifest);
            this.initPlay();
        }
    }, {
        key: 'bindEvent',
        value: function bindEvent() {
            var _this2 = this;

            _eventBus2.default.on('remuxed', function (segment) {
                console.log('remuxed', segment);
                _this2.bufferQueue.push(segment);
                if (!_this2.sourceBuffer.updating && _this2.mediaSource.readyState === 'open') {
                    _this2.flushBufferQueue();
                }
            });
        }
    }, {
        key: 'initPlay',
        value: function initPlay() {
            var _this3 = this;

            if (!_window2.default.MediaSource) {
                this.log('Your browser not support MSE');
            }
            this.clearUp();
            this.bindEvent();
            this.videoElement = document.createElement('video');
            this.videoElement.setAttribute('controls', true);
            this.mediaSource = new MediaSource();
            this.mediaSource.addEventListener('sourceopen', function () {
                _this3.mediaSource.duration = _this3.totalDuration;
                _this3.log('Creating sourceBuffer');
                _this3.createSourceBuffer();
            });

            this.videoElement.src = _window2.default.URL.createObjectURL(this.mediaSource);
            this.playerBox.appendChild(this.videoElement);
            this.bufferQueue = [];
            this.updatingSegment = null;
        }
    }, {
        key: 'watchVideoOperation',
        value: function watchVideoOperation() {
            var _this4 = this;

            this.videoElement.addEventListener('seeking', function (e) {
                console.log('seeking');
            });
            this.videoElement.addEventListener('timeupdate', function (e) {
                _this4.downloadUpcomingSegment();
            });
        }
    }, {
        key: 'createSourceBuffer',
        value: function createSourceBuffer() {
            var _this5 = this;

            _window2.default.URL.revokeObjectURL(this.videoElement.src);
            this.log('create sourcebuffer');
            this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
            this.sourceBuffer.addEventListener('updateend', function () {
                _this5.log('Ready');
                // this.updateEnd();
                _this5.flushBufferQueue();
            });
            this.watchVideoOperation();
            this.downloadInitSegment();
        }
    }, {
        key: 'downloadInitSegment',
        value: function downloadInitSegment() {
            console.log('download init');
            this.segments[0].isInitSegment = true;
            this.segments[0].download();
        }
    }, {
        key: 'downloadUpcomingSegment',
        value: function downloadUpcomingSegment() {
            var _this6 = this;

            var nextSegments = this.segments.filter(function (segment) {
                return !segment.requested && segment.timeStart <= _this6.videoElement.currentTime + 5 && segment.timeEnd > _this6.videoElement.currentTime;
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
                this.checkEnd();
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
        key: 'updateEnd',
        value: function updateEnd() {
            if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open' && this.index == this.playManifest.segments.length - 1) {
                // this.videoElement.play();
                return;
            }
        }
    }, {
        key: 'appendBuffer',
        value: function appendBuffer(data) {
            console.log('apendding');

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
            this.logBox.innerHTML = text;
        }
    }, {
        key: 'clearUp',
        value: function clearUp() {
            if (this.videoElement) {
                this.videoElement.remove();
                delete this.mediaSource;
                delete this.sourceBuffer;
                delete this.bufferQueue;
            }
        }
    }]);

    return Player;
}();

exports.default = Player;