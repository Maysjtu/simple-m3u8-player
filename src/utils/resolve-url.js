/**
 * @file resolve-url.js
 */

import URLToolkit from 'url-toolkit';
import window from 'global/window';
import document from 'global/document'

function resolveUrl(baseURL, relativeURL) {
    // return early if we don't need to resolve
    if ((/^[a-z]+:/i).test(relativeURL)) {
        return relativeURL;
    }

    // if the base URL is relative then combine with the current location
    if (!(/\/\//i).test(baseURL)) {
        baseURL = URLToolkit.buildAbsoluteURL(window.location.href, baseURL);
    }

    return URLToolkit.buildAbsoluteURL(baseURL, relativeURL);
}

function getAbsoluteUrl(url) {
    if (!url.match(/^https?:\/\//)) {
        // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
        const div = document.createElement('div');

        div.innerHTML = `<a href="${url}">x</a>`;
        url = div.firstChild.href;
    }

    return url;

}
export { resolveUrl, getAbsoluteUrl }

