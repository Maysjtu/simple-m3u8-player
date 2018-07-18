
import m3u8Parser from 'm3u8-parser'
import {resolveUrl} from './utils/resolve-url'
import {getAbsoluteUrl} from './utils/resolve-url'
import window from 'global/window'
import Segment from "./Segment";
import EventBus from './utils/event-bus'

export default class Player {
    constructor(id) {
        this.playerBox = document.getElementById(id);
        this.mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    }

    fetchM3U8(sourceFile) {
        let self = this;
        this.sourceFile = getAbsoluteUrl(sourceFile);
        console.log('sourceFile', this.sourceFile);
        this.parser = new m3u8Parser.Parser();
        fetch(this.sourceFile, {})
            .then(function (response) {
                return response.text();
            }).then(function (data) {
            self.parseM3U8(data);
        });
    }

    parseM3U8(data) {
        this.parser.push(data);
        this.parser.end();
        this.playManifest = this.parser.manifest;
        this.totalDuration = 0;
        this.playManifest.segments.forEach((segment, index) => {
            segment.uri = resolveUrl(this.sourceFile, segment.uri);
            let segmentInstance = new Segment(index, segment.uri, true, this.totalDuration, this.totalDuration + segment.duration, segment.timeline);
            this.totalDuration += segment.duration;
            if (!this.segments) {
                this.segments = [];
            }
            this.segments.push(segmentInstance);
        });
        this.log('Get manifest');
        console.log(this.playManifest);
        this.initPlay();
    }

    bindEvent() {
        EventBus.on('remuxed', (segment) => {
            console.log('remuxed', segment);
            this.bufferQueue.push(segment);
            if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
                this.flushBufferQueue();
            }
        });
    }

    initPlay() {
        if (!window.MediaSource) {
            this.log('Your browser not support MSE');
        }
        this.clearUp();
        this.bindEvent();
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('controls', true);
        this.mediaSource = new MediaSource();
        this.mediaSource.addEventListener('sourceopen', () => {
            this.mediaSource.duration = this.totalDuration;
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
        this.segments[0].isInitSegment = true;
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
            this.checkEnd();
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
        if(!unBuffered.length) {
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
        this.logBox.innerHTML = text;
    }

    clearUp() {
        if (this.videoElement) {
            this.videoElement.remove();
            delete this.mediaSource;
            delete this.sourceBuffer;
            delete this.bufferQueue;
        }
    }
}