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
    const FAVORITES_REGEXP = /^https:\/\/krisha\.kz\/favorites\/advert\/$/

    const LOCAL_STORAGE_KEYS = {
        history: 'KrishaEnchanced.historyIds',
        ignore: 'KrishaEnchanced.ignoreIds',
        sentMessage: 'KrishaEnchanced.sentMessage'
    }

    const KrishaLog = (...args) => console.log('[KrishaEnhanced] ', ...args)

    class LocalStorage {
      static getIds(key) {
        return localStorage.getItem(key)?.split(',') ?? [];
      }

      static setIds(key, value) {
        localStorage.setItem(key, value.join(','));
      }

      static addUniqueItem(key, value) {
        const items = LocalStorage.getIds(key);

        if (items.includes(value)) return;

        LocalStorage.setIds(key, [...items, value]);
      }

      static removeItem(key, value) {
        const items = LocalStorage.getIds(key);

        LocalStorage.setIds(key, items.filter(item => item !== value));
      }
    }

    class ListItem {
      item = null;
      actionsPanelSelector = null

      constructor(item) {
        this.item = item;
      }

      getId() {
        return this.item.getAttribute('data-id');
      }

      setSeen() {
        this.item.style.opacity = 0.6;
        this.item.style.backgroundColor = 'rgb(28 24 25 / 10%)';
      }

      hide() {
        this.item.style.display = 'none';
      }

      getActionsPanel() {
        if (!this.actionsPanelSelector) return null;

        return this.item.querySelector(this.actionsPanelSelector);
      }
    }

    class ListPageItem extends ListItem {
      actionsPanelSelector = '.a-actions'

      static isIgnoredItemId(id) {
        return LocalStorage.getIds(LOCAL_STORAGE_KEYS.ignore).includes(id);
      }

      static createHideButton(actionsPanel, itemId) {
        if (!actionsPanel || !itemId) return;

        const isIgnored = ListPageItem.isIgnoredItemId(itemId);

        const hideButton = document.createElement('a');
        hideButton.href = 'javascript:;';
        hideButton.classList.add('a-action', 'a-action-favorite');
        hideButton.title = isIgnored ? 'Показать объявление' : 'Скрыть объявление';

        const icon = document.createElement('span');
        icon.classList.add(isIgnored ? 'fi-eye' : 'fi-eye-invisible');
        hideButton.appendChild(icon);

        const clickEventCallback = ({ target }) => {
            if (isIgnored) {
                LocalStorage.removeItem(LOCAL_STORAGE_KEYS.ignore, itemId);
            } else {
                LocalStorage.addUniqueItem(LOCAL_STORAGE_KEYS.ignore, itemId);
            }

            target.removeEventListener('click', clickEventCallback);

            target.remove();
            ListPageItem.createHideButton(actionsPanel, itemId);
        }

        hideButton.addEventListener('click', clickEventCallback)

        actionsPanel.appendChild(hideButton);

        return hideButton;
      }

      addHideButton () {
        const hideButton = ListPageItem.createHideButton(this.getActionsPanel(), this.getId());
        hideButton.addEventListener('click', () => {
          this.hide()
        })
      }
    }

    class FavoritesListItem extends ListItem {
      actionsPanelSelector = '.a-note-container'
      whatsappButtonClass = 'enchanced-send-whatsapp';

      setSentMessage() {
        LocalStorage.addUniqueItem(LOCAL_STORAGE_KEYS.sentMessage, this.getId());
        const button = this.item.querySelector(`.${whatsappButtonClass}`)
        if (!button) return;

        button.innerText += ' (еще раз)'
      }

      hasSentMessage() {
        return LocalStorage.getIds(LOCAL_STORAGE_KEYS.sentMessage).includes(this.getId());
      }

      getWhatsAppTemplate() {
        const note = this.getNoteText();
        const base = `Здравствуйте! \nНас зовут Алексей и Айгерим. Мы нашли ваше объявление на Крыше: https://krisha.kz/a/show/${this.getId()}. \nПодскажите, пожалуйста, оно еще актуально?`
        return encodeURIComponent([base, note].join('\n'));
      }

      static async fetchPhones(itemId) {
        KrishaLog('Fetching data for id', itemId);

        return fetch(`https://krisha.kz/a/ajaxPhones?id=${itemId}`, {
          method: 'GET',
          headers: {
            'referrer': 'https://krisha.kz/a/show/686289192',
            'x-requested-with': 'XMLHttpRequest',
            'pragma': 'no-cache'
          }
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error('Network response was not OK');
            }
            const data = await response.json();
            if (data.gRecaptcha) {
              throw new Error('Captcha!');
            }
            const phones = data.phones;
            return phones.map(phone => phone.replace(/\s+/gi, ''));
          })
          .then(data => {
            return data;
          })
          .catch(error => {
            console.error('Error:', error);
            alert('Error', error)
          });
      }

      getNoteText() {
        return this.item.querySelector('.note_text')?.value || '';
      }

      addWhatsappButton() {
        const actionsPanel = this.getActionsPanel();
        const itemId = this.getId();

        if (!actionsPanel || !itemId) return;

        const whatsappButton = document.createElement('a');
        whatsappButton.href = 'javascript:;';
        whatsappButton.classList.add('enchanced-send-whatsapp');

        let buttonText = 'Написать в Whatsapp';
        if (this.hasSentMessage()) {
          buttonText += ' (еще раз)';
        }
        whatsappButton.innerText = buttonText;

        const icon = document.createElement('span');
        icon.classList.add('fi-share');
        whatsappButton.appendChild(icon);

        const clickEventCallback = async ({ target }) => {
          const phones = await FavoritesListItem.fetchPhones(itemId);
          KrishaLog(`Got phones for id ${itemId}:`, phones)

          if (!phones?.length) return;
          const targetPhone = phones[0];

          const whatsappUrl = `https://web.whatsapp.com/send/?phone=${targetPhone}&text=${this.getWhatsAppTemplate()}`;
          this.setSentMessage();
          window.open(whatsappUrl);
        }

        whatsappButton.addEventListener('click', clickEventCallback)
        actionsPanel.appendChild(whatsappButton);

        return whatsappButton;
      }
    }

    const executeScriptsForList = () => {
        const listItems = document.querySelectorAll(`[data-list-id="main"]`);
        KrishaLog("EXECUTING SCRIPT FOR LIST", listItems.length);

        const seenItems = LocalStorage.getIds(LOCAL_STORAGE_KEYS.history);
        const ignoredItems = LocalStorage.getIds(LOCAL_STORAGE_KEYS.ignore);

        listItems.forEach(item => {
            const listItem = new ListPageItem(item);
            const itemId = listItem.getId();

            if (seenItems.includes(itemId)) {
                listItem.setSeen()
            }

            if (ignoredItems.includes(itemId)) {
                listItem.hide();
            }

            listItem.addHideButton();
        })
    }

    const executeScriptsForDetailPage = () => {
        const currentPageId = DETAIL_PAGE_REGEXP.exec(currentPageUrl).groups?.id;
        KrishaLog("EXECUTING SCRIPT FOR DETAIL PAGE", currentPageId);

        if (!currentPageId) return;

        LocalStorage.addUniqueItem(LOCAL_STORAGE_KEYS.history, currentPageId);
        ListPageItem.createHideButton(document.querySelector('.offer__actions'), currentPageId);
    }

    const executeScriptsForFavorites = () => {
      const listItems = document.querySelectorAll(`.a-fav-item-container`);
      KrishaLog("EXECUTING SCRIPT FOR FAVORITES", listItems.length);

      listItems.forEach(item => {
        const listItem = new FavoritesListItem(item);
        listItem.addWhatsappButton()
      })
    }

    const isPageMatchesRegexp = (regexp) => {
        return regexp.test(currentPageUrl)
    }

    if (isPageMatchesRegexp(DETAIL_PAGE_REGEXP)) {
        executeScriptsForDetailPage();
    } else if (isPageMatchesRegexp(LIST_PAGE_REGEXP)) {
        executeScriptsForList();
    } else if (isPageMatchesRegexp(FAVORITES_REGEXP)) {
        executeScriptsForFavorites();
    }
})();