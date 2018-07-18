//管理自定义事件
import newGuid from './guid'

class EventBusClass {
    constructor() {
        this.data = {};
    }

    on(type, fn) {
        let data = this.data;
        if(!data.handlers) {
            data.handlers = {};
        }
        if(!data.handlers[type]) {
            data.handlers[type] = [];
        }
        if(!fn.guid) {
            fn.guid = newGuid();
        }
        data.handlers[type].push(fn);
    }

    emit(type, params) {
        let data = this.data;
        if(!data.handlers) {
            return;
        }
        let handlers = data.handlers[type];
        if(handlers) {
            handlers.forEach(function(handler){
                handler(params);
            })
        }
    }

    removeType(type) {
        this.data.handlers[type] = [];
    }

    removeEvent(type, fn) {
        let data = this.data;
        if(!type) {
            for(let t in data.handlers){
                this.removeType(t);
            }
        }
        let handlers = data.handlers[type];
        if(!handlers) return;
        if(!fn) {
            this.removeType(type);
            return;
        }

        if(fn.guid) {
            for(let n = 0; n < handlers.length; n++) {
                if(handlers[n].guid === fn.guid) {
                    handlers.splice(n--,1);
                }
            }
        }
    }
}
const EventBus = new EventBusClass();
export default EventBus;
