import mp4 from 'mux.js/lib/mp4';
import EventBus from './utils/event-bus'

export default class Segment {
    constructor(index, url, isInitSegment, timeStart, timeEnd, timeline) { //[timeStart, timeEnd)
        this.index = index;
        this.url = url;
        this.isInitSegment = isInitSegment;
        this.timeStart = timeStart;
        this.timeEnd = timeEnd;
        this.timeline = timeline;
        this.remuxedSegment = null;
        this.bufferData = null;

        this.abort = false;
        this.requested = false; //是否已经请求过了
        this.remuxed = false; //是否已经转封装过了
        this.buffered = false; //是否已经加入buffer了
    }

    initTransmuxer(callback) {
        this.transmuxer = new mp4.Transmuxer();
        this.transmuxer.on('data', (segment) => {
            this.getRemuxedData(segment);
        });
    }

    getRemuxedData(segment) {
        this.remuxedSegment = segment;
        if(this.isInitSegment) {
            let initSegment = segment.initSegment;
            let bytes = null, offset = initSegment.byteLength;
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
        EventBus.emit('remuxed', this);
    }

    download(callback) {
        this.requested = true;
        this.initTransmuxer(callback);
        let self = this;
        fetch(this.url, {})
            .then(function(response){
                return response.arrayBuffer();
            })
            .then(function(arrayBuffer){
                console.log(`get${self.url}`);
                self.transmuxer.push(new Uint8Array(arrayBuffer));
                self.transmuxer.flush();
            })

    }
}