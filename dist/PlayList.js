'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _m3u8Parser = require('m3u8-parser');

var _m3u8Parser2 = _interopRequireDefault(_m3u8Parser);

var _resolveUrl = require('./utils/resolve-url');

var _Segment = require('./Segment');

var _Segment2 = _interopRequireDefault(_Segment);

var _eventBus = require('./utils/event-bus');

var _eventBus2 = _interopRequireDefault(_eventBus);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PlayList = function () {
    function PlayList(url, signal) {
        _classCallCheck(this, PlayList);

        this.fetchM3U8(url);
        this.signal = signal;
    }

    _createClass(PlayList, [{
        key: 'fetchM3U8',
        value: function fetchM3U8(sourceFile) {
            var self = this;
            console.log('sourceFile', sourceFile);
            this.sourceFile = (0, _resolveUrl.getAbsoluteUrl)(sourceFile);
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
            var timeline = -1;
            this.playManifest.segments.forEach(function (segment, index) {
                var isInitSegment = false;
                if (segment.timeline != timeline) {
                    isInitSegment = true;
                    timeline = segment.timeline;
                }
                segment.uri = (0, _resolveUrl.resolveUrl)(_this.sourceFile, segment.uri);
                var segmentInstance = new _Segment2.default(index, segment.uri, isInitSegment, _this.totalDuration, _this.totalDuration + segment.duration, segment.timeline);
                _this.totalDuration += segment.duration;
                if (!_this.segments) {
                    _this.segments = [];
                }
                _this.segments.push(segmentInstance);
            });

            console.log(this.playManifest, this.signal);
            _eventBus2.default.emit('getManifest', this.signal);
        }
    }]);

    return PlayList;
}();

exports.default = PlayList;