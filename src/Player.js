import m3u8Parser from 'm3u8-parser'
import {resolveUrl} from './utils/resolve-url'
import {getAbsoluteUrl} from './utils/resolve-url'
import window from 'global/window'
import Segment from "./Segment";
import EventBus from './utils/event-bus'
import PlayList from './PlayList'

export default class Player {
    constructor(id) {
        this.playerBox = document.getElementById(id);
        this.mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    }

    loadSource(options) {
        this.clearUp();
        this.bindEvent();
        this.ready1 = false;
        this.ready2 = false;
        this.rendition = 0;
        this.playList0 = new PlayList(options.rendition0, 0);
        this.playList1 = new PlayList(options.rendition1, 1);
    }

    bindEvent() {
        EventBus.on('remuxed', (segment) => {
            console.log('remuxed', segment);
            this.bufferQueue.push(segment);
            if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
                this.flushBufferQueue();
            }
        });
        EventBus.on('getManifest', (signal) => {
            if (signal == 0) {
                this.ready1 = true;
            }
            if (signal == 1) {
                this.ready2 = true;
            }
            if (this.ready1 && this.ready2) {
                this.totalDuration = this.playList1.totalDuration;
                this.initPlay();
            }

        });
    }

    changeRendition() {
        this.rendition = !this.rendition;
        if (this.rendition) {
            this.segments = this.playList1.segments;
        } else {
            this.segments = this.playList0.segments;
        }
    }

    initPlay() {
        if (!window.MediaSource) {
            this.log('Your browser not support MSE');
        }
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('controls', true);
        this.mediaSource = new MediaSource();
        this.mediaSource.addEventListener('sourceopen', () => {
            console.log(this.mediaSource);
            this.mediaSource.duration = this.totalDuration || 0;
            this.log('Creating sourceBuffer');
            this.createSourceBuffer();
        });

        this.videoElement.src = window.URL.createObjectURL(this.mediaSource);
        this.playerBox.appendChild(this.videoElement);
        this.bufferQueue = [];
        this.updatingSegment = null;
    }

    watchVideoOperation() {
        this.videoElement.addEventListener('seeking', (e) => {
            console.log('seeking');
        });
        this.videoElement.addEventListener('timeupdate', (e) => {
            this.downloadUpcomingSegment();
        });
    }

    createSourceBuffer() {
        window.URL.revokeObjectURL(this.videoElement.src);
        this.log('create sourcebuffer');
        this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
        this.sourceBuffer.addEventListener('updateend', () => {
            this.log('Ready');
            this.flushBufferQueue();
        });
        this.watchVideoOperation();
        this.downloadInitSegment();
    }

    downloadInitSegment() {
        this.log('download init');
        this.segments = this.playList0.segments;
        this.segments[0].download();
    }

    downloadUpcomingSegment() {
        let nextSegments = this.segments.filter((segment) => {
            return (!segment.requested && segment.timeStart <= this.videoElement.currentTime + 5 && segment.timeEnd > this.videoElement.currentTime);
        });
        if (nextSegments.length) {
            nextSegments.forEach((segment) => {
                segment.download();
            })
        } else {
            if (this.segments.filter((segment) => {
                    return !segment.requested;
                }).length === 0) {
                this.log("Finished buffering whole video");
            } else {
                this.log("Finished buffering ahead");
            }
        }

    }

    concatBuffer() {
        let bytesLength = 0, offset = 0;
        this.bufferQueue.forEach((segment) => {
            segment.buffered = true;
            bytesLength += segment.bufferData.length;
        });
        let resultsBuffer = new Uint8Array(bytesLength);
        this.bufferQueue.forEach((segment) => {
            bytesLength += segment.bufferData.length;
            resultsBuffer.set(segment.bufferData, offset);
            offset += segment.bufferData.length;
        });
        return resultsBuffer;
    }

    flushBufferQueue() {
        if (this.sourceBuffer.updating || !this.bufferQueue.length) {
            // this.checkEnd();
            return;
        }
        let bufferData = this.concatBuffer();
        //!使用单独transmuxer的时候segment上的时间戳信息会丢失？看一下mux的源码，查找原因。
        this.timestampOffset = this.bufferQueue[0].timeStart;
        this.bufferQueue = [];
        this.appendBuffer(bufferData);
    }

    checkEnd() {
        let unBuffered = this.segments.filter((segment) => {
            return !segment.buffered;
        });
        if (!unBuffered.length) {
            this.mediaSource.endOfStream();
            this.log('MediaSource End');
        }
    }

    appendBuffer(data) {
        this.log('appending buffer');

        this.sourceBuffer.timestampOffset = this.timestampOffset;
        this.sourceBuffer.appendBuffer(data);
    }

    log(text) {
        if (!this.logBox) {
            this.logBox = document.createElement('div');
            this.playerBox.appendChild(this.logBox);
        }
        let rendition = this.rendition ? 'Low' : 'High';
        this.logBox.innerHTML =
            `Rendition: ${rendition} <br>  
             Information: ${text} `;
    }

    clearUp() {
        if (this.videoElement) {
            this.videoElement.remove();
        }
        try {
            EventBus.removeEvent();
            delete this.mediaSource;
            delete this.sourceBuffer;
            delete this.bufferQueue;
        } catch (e) {

        }
    }
}