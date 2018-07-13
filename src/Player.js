/*
* @Author: Mayde
* @Email:  maysjtu@163.com
* @Date:   2018-07-11 18:57:04
* @Last Modified by:   Mayde
* @Last Modified time: 2018-07-11 20:14:02
*/
import m3u8Parser from 'm3u8-parser'
import mp4 from 'mux.js/lib/mp4';

export default class Player {

  constructor(id) {
  	this.playerBox = document.getElementById(id);
	this.mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  }

  initPlay() {
  	if(!window.MediaSource) {
  		this.log('Your browser not support MSE');
  	}
  	this.clearUp();
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
  	// this.watchVideoOperation();

  	this.transmuxer = new mp4.Transmuxer();
  	this.createdInitSegment = false;
  	this.remuxedSegments = [];
  	this.remuxedInitSegment = null;
  }

  // watchVideoOperation() {
  // 	this.videoElement.addEventListener('seeking',(e) => {
  // 		console.log(e);
  // 		let timeStamp = e.timeStamp/1000;
  //
	// })
  // }

  createSourceBuffer() {
  	window.URL.revokeObjectURL(this.videoElement.src);
  	this.log('create sourcebuffer');
  	this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
  	this.sourceBuffer.addEventListener('updateend', () => {
  		this.log('Ready');
  		this.updateEnd();
  	});

  	this.getRemuxedSegments();
	this.index = 0;
	this.fetchSegment(this.index);
  }
  getRemuxedSegments() {
  	this.remuxedIndex = -1;
  	this.transmuxer.on('data',(segment) => {
	  	console.log('get transmuxer segment', this.remuxedIndex, segment);
	  	this.remuxedSegments.push(segment);
	  	if(!this.remuxedInitSegment) {
			this.remuxedInitSegment = segment.initSegment;
	  	}
	  	this.appendBuffer();
  	});
  }

  updateEnd() {
  	if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open'
		&& this.index == this.playManifest.segments.length - 1) {
	  	this.mediaSource.endOfStream();
	  	// this.videoElement.play();
	  	return;
  	}
  	this.index ++;
  	this.fetchSegment(this.index);
  }

  appendBuffer() {
  	this.remuxedIndex++;
  	let bytes = null, offset = 0;

	if(!this.createdInitSegment) {
        bytes = new Uint8Array(this.remuxedInitSegment.byteLength + this.remuxedSegments[this.remuxedIndex].data.byteLength);
        bytes.set(this.remuxedInitSegment, offset);
        offset += this.remuxedInitSegment.byteLength;
        let segmentOffset = offset;
        bytes.set(this.remuxedSegments[this.remuxedIndex].data, segmentOffset);
        this.sourceBuffer.appendBuffer(bytes);
        this.createdInitSegment = true;
	} else {
		this.sourceBuffer.appendBuffer(this.remuxedSegments[this.remuxedIndex].data);
	}
  }
  parseM3U8(data) {
      this.parser.push(data);
      this.parser.end();
      this.playManifest = this.parser.manifest;
      this.totalDuration = 0;
	  this.playManifest.segments.forEach((segment)=>{
	  	this.totalDuration += segment.duration;
	  });
      this.log('Get manifest');
      console.log(this.playManifest);
      this.initPlay();
  }

  fetchM3U8(sourceFile) {
  	let self = this;
    this.sourceFile = sourceFile;
    this.parser = new m3u8Parser.Parser();
	fetch(this.sourceFile, {})
	.then(function(response){
		return response.text();
	}).then(function(data){
		self.parseM3U8(data);
	});
  }

  fetchSegment(index) {
  	let self = this;
	let videoUrl = '../assets/' + this.playManifest.segments[index]['uri'];
	self.log(`get ${self.playManifest.segments[index]['uri']}`);
    fetch(videoUrl, {})
	.then(function(response){
		return response.arrayBuffer();
	}).then(function(arrayBuffer){
		self.transmuxer.push(new Uint8Array(arrayBuffer));
		self.transmuxer.flush();
	})
  }

  log(text) {
  	if(!this.logBox) {
  		this.logBox = document.createElement('div');
  		this.playerBox.appendChild(this.logBox);
  	}
  	this.logBox.innerHTML = text;
  }

  clearUp() {
  	if(this.videoElement) {
  		this.videoElement.remove();
  		delete this.mediaSource;
  		delete this.sourceBuffer;
  		delete this.parser;
  		delete this.transmuxer;
  	}
  }
}