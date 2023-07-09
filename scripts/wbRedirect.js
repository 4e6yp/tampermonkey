// ==UserScript==
// @name         WB Redirect
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://global.wildberries.ru/catalog/**/detail.aspx**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wildberries.ru
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const { groups: { itemId } } = /^https:\/\/global\.wildberries\.ru\/catalog\/(?<itemId>\d+)\/detail\.aspx/.exec(window.location.href);

  if (!itemId) return;
  window.open(`https://global.wildberries.ru/product?card=${itemId}`, '_self');
})();