'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); //管理自定义事件


var _guid = require('./guid');

var _guid2 = _interopRequireDefault(_guid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventBusClass = function () {
    function EventBusClass() {
        _classCallCheck(this, EventBusClass);

        this.data = {};
    }

    _createClass(EventBusClass, [{
        key: 'on',
        value: function on(type, fn) {
            var data = this.data;
            if (!data.handlers) {
                data.handlers = {};
            }
            if (!data.handlers[type]) {
                data.handlers[type] = [];
            }
            if (!fn.guid) {
                fn.guid = (0, _guid2.default)();
            }
            data.handlers[type].push(fn);
        }
    }, {
        key: 'emit',
        value: function emit(type, params) {
            var data = this.data;
            if (!data.handlers) {
                return;
            }
            var handlers = data.handlers[type];
            if (handlers) {
                handlers.forEach(function (handler) {
                    handler(params);
                });
            }
        }
    }, {
        key: 'removeType',
        value: function removeType(type) {
            this.data.handlers[type] = [];
        }
    }, {
        key: 'removeEvent',
        value: function removeEvent(type, fn) {
            var data = this.data;
            if (!type) {
                for (var t in data.handlers) {
                    this.removeType(t);
                }
            }
            var handlers = data.handlers[type];
            if (!handlers) return;
            if (!fn) {
                this.removeType(type);
                return;
            }

            if (fn.guid) {
                for (var n = 0; n < handlers.length; n++) {
                    if (handlers[n].guid === fn.guid) {
                        handlers.splice(n--, 1);
                    }
                }
            }
        }
    }]);

    return EventBusClass;
}();

var EventBus = new EventBusClass();
exports.default = EventBus;