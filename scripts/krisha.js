// ==UserScript==
// @name         Krisha Enhanced
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       4e6yp
// @match        https://krisha.kz/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=krisha.kz
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const currentPageUrl = document.URL;

    const DETAIL_PAGE_REGEXP = /^https:\/\/krisha\.kz\/a\/show\/(?<id>\d+)$/
    const LIST_PAGE_REGEXP = /^https:\/\/krisha\.kz\/arenda\/.+$/

    const LOCAL_STORAGE_KEYS = {
        history: 'KrishaEnchanced.historyIds',
        ignore: 'KrishaEnchanced.ignoreIds'
    }

    const KrishaLog = (...args) => console.log('[KrishaEnhanced] ', ...args)

    const getIdsFromLocalStorage = (key) => {
        return localStorage.getItem(key)?.split(',') ?? [];
    }

    const setIdsInLocalStorage = (key, value) => {
        localStorage.setItem(key, value.join(','));
    }

    const addUniqueItemToLocalStorage = (key, value) => {
        const items = getIdsFromLocalStorage(key);

        if (items.includes(value)) return;

        setIdsInLocalStorage(key, [...items, value]);
    }

    const removeItemFromLocalStorage = (key, value) => {
        const items = getIdsFromLocalStorage(key);

        setIdsInLocalStorage(key, items.filter(item => item !== value));
    }

    const getItemId = item => item.getAttribute('data-id');

    const setSeenItemStyle = (item) => {
        item.style.opacity = 0.6;
        item.style.backgroundColor = 'rgb(28 24 25 / 10%)';
    }

    const hideItem = (item) => {
        item.style.display = 'none';
    }

    const isIgnoredItemId = itemId => getIdsFromLocalStorage(LOCAL_STORAGE_KEYS.ignore).includes(itemId);

    const createHideButton = (actionsPanel, itemId) => {
        if (!actionsPanel || !itemId) return;

        const isIgnored = isIgnoredItemId(itemId);

        const hideButton = document.createElement('a');
        hideButton.href = 'javascript:;';
        hideButton.classList.add('a-action', 'a-action-favorite');
        hideButton.title = isIgnored ? 'Показать объявление' : 'Скрыть объявление';

        const icon = document.createElement('span');
        icon.classList.add(isIgnored ? 'fi-eye' : 'fi-eye-invisible');
        hideButton.appendChild(icon);

        const clickEventCallback = ({ target }) => {
            if (isIgnored) {
                removeItemFromLocalStorage(LOCAL_STORAGE_KEYS.ignore, itemId);
            } else {
                addUniqueItemToLocalStorage(LOCAL_STORAGE_KEYS.ignore, itemId);
            }

            target.removeEventListener('click', clickEventCallback);

            target.remove();
            createHideButton(actionsPanel, itemId);
        }

        hideButton.addEventListener('click', clickEventCallback)

        actionsPanel.appendChild(hideButton);

        return hideButton;
    }

    const addHideItemButton = (item, actionsPanel) => {
        const hideButton = createHideButton(actionsPanel, getItemId(item));
        hideButton.addEventListener('click', () => {
            hideItem(item);
        })
    }

    const executeScriptsForList = () => {
        const listItems = document.querySelectorAll(`[data-list-id="main"]`);
        KrishaLog("EXECUTING SCRIPT FOR LIST", listItems.length);

        const seenItems = getIdsFromLocalStorage(LOCAL_STORAGE_KEYS.history);
        const ignoredItems = getIdsFromLocalStorage(LOCAL_STORAGE_KEYS.ignore);

        listItems.forEach(item => {
            const itemId = getItemId(item);
            if (seenItems.includes(itemId)) {
                setSeenItemStyle(item)
            }

            if (ignoredItems.includes(itemId)) {
                hideItem(item);
            }

            addHideItemButton(item, item.querySelector('.a-actions'));
        })
    }

    const executeScriptsForDetailPage = () => {
        const currentPageId = DETAIL_PAGE_REGEXP.exec(currentPageUrl).groups?.id;
        KrishaLog("EXECUTING SCRIPT FOR DETAIL PAGE", currentPageId);

        if (!currentPageId) return;

        addUniqueItemToLocalStorage(LOCAL_STORAGE_KEYS.history, currentPageId);
        createHideButton(document.querySelector('.offer__actions'), currentPageId);
    }

    const isPageMatchesRegexp = (regexp) => {
        return regexp.test(currentPageUrl)
    }

    if (isPageMatchesRegexp(DETAIL_PAGE_REGEXP)) {
        executeScriptsForDetailPage();
    } else if (isPageMatchesRegexp(LIST_PAGE_REGEXP)) {
        executeScriptsForList();
    }
})();