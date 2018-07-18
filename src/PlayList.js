import m3u8Parser from 'm3u8-parser';
import {resolveUrl} from './utils/resolve-url';
import {getAbsoluteUrl} from './utils/resolve-url';
import Segment from "./Segment";
import EventBus from "./utils/event-bus";

export default class PlayList {
    constructor(url, signal) {
        this.fetchM3U8(url);
        this.signal = signal;
    }

    fetchM3U8(sourceFile) {
        let self = this;
        console.log('sourceFile', sourceFile);
        this.sourceFile = getAbsoluteUrl(sourceFile);
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
        let timeline = -1;
        this.playManifest.segments.forEach((segment, index) => {
            let isInitSegment = false;
            if(segment.timeline!= timeline) {
                isInitSegment = true;
                timeline = segment.timeline;
            }
            segment.uri = resolveUrl(this.sourceFile, segment.uri);
            let segmentInstance = new Segment(index, segment.uri, isInitSegment, this.totalDuration, this.totalDuration + segment.duration, segment.timeline);
            this.totalDuration += segment.duration;
            if (!this.segments) {
                this.segments = [];
            }
            this.segments.push(segmentInstance);
        });

        console.log(this.playManifest, this.signal);
        EventBus.emit('getManifest', this.signal);
    }
}