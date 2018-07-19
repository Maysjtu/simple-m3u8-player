'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mp = require('mux.js/lib/mp4');

var _mp2 = _interopRequireDefault(_mp);

var _eventBus = require('./utils/event-bus');

var _eventBus2 = _interopRequireDefault(_eventBus);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Segment = function () {
    function Segment(index, url, isInitSegment, timeStart, timeEnd, timeline) {
        _classCallCheck(this, Segment);

        //[timeStart, timeEnd)
        this.index = index;
        this.url = url;
        this.isInitSegment = isInitSegment;
        this.timeStart = timeStart;
        this.timeEnd = timeEnd;
        this.timeline = timeline;
        this.remuxedSegment = null;
        this.bufferData = null;
        // this.baseMediaDecodeTime = timeStart;

        this.abort = false;
        this.requested = false; //是否已经请求过了
        this.remuxed = false; //是否已经转封装过了
        this.buffered = false; //是否已经加入buffer了
    }

    _createClass(Segment, [{
        key: 'initTransmuxer',
        value: function initTransmuxer() {
            var _this = this;

            this.transmuxer = new _mp2.default.Transmuxer({
                // baseMediaDecodeTime: this.baseMediaDecodeTime*1000
            });
            this.transmuxer.on('data', function (segment) {
                _this.getRemuxedData(segment);
                delete _this.transmuxer;
            });
        }
    }, {
        key: 'getRemuxedData',
        value: function getRemuxedData(segment) {
            this.remuxedSegment = segment;
            if (this.isInitSegment) {
                var initSegment = segment.initSegment;
                var bytes = null,
                    offset = initSegment.byteLength;
                bytes = new Uint8Array(initSegment.byteLength + segment.data.byteLength);
                bytes.set(initSegment, 0);
                bytes.set(segment.data, offset);
                this.bufferData = bytes;
            } else {
                this.bufferData = segment.data;
            }
            // console.log(this.bufferData);
            // console.log(this.bufferData.length);
            this.remuxed = true;
            _eventBus2.default.emit('remuxed', this);
        }
    }, {
        key: 'download',
        value: function download() {
            if (this.requested) {
                return;
            }
            this.requested = true;
            this.initTransmuxer();
            var self = this;
            fetch(this.url, {}).then(function (response) {
                return response.arrayBuffer();
            }).then(function (arrayBuffer) {
                console.log('get' + self.url);
                self.transmuxer.push(new Uint8Array(arrayBuffer));
                self.transmuxer.flush();
            });
        }
    }]);

    return Segment;
}();

exports.default = Segment;