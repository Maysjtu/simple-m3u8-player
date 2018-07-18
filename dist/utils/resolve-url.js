'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getAbsoluteUrl = exports.resolveUrl = undefined;

var _urlToolkit = require('url-toolkit');

var _urlToolkit2 = _interopRequireDefault(_urlToolkit);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function resolveUrl(baseURL, relativeURL) {
    // return early if we don't need to resolve
    if (/^[a-z]+:/i.test(relativeURL)) {
        return relativeURL;
    }

    // if the base URL is relative then combine with the current location
    if (!/\/\//i.test(baseURL)) {
        baseURL = _urlToolkit2.default.buildAbsoluteURL(_window2.default.location.href, baseURL);
    }

    return _urlToolkit2.default.buildAbsoluteURL(baseURL, relativeURL);
} /**
   * @file resolve-url.js
   */

function getAbsoluteUrl(url) {
    if (!url.match(/^https?:\/\//)) {
        // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
        var div = _document2.default.createElement('div');

        div.innerHTML = '<a href="' + url + '">x</a>';
        url = div.firstChild.href;
    }

    return url;
}
exports.resolveUrl = resolveUrl;
exports.getAbsoluteUrl = getAbsoluteUrl;