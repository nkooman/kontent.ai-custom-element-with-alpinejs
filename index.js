// If you're using a bundler, I suggest you use the npm package instead.
import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.7/dist/module.esm.js';
import { createDomainAliasList } from './create-domain-alias-list.js';

(() => {
  window.Alpine = Alpine;

  let isDisabled = false;

  const updateDisabled = (disabled) => {
    isDisabled = disabled;

    const overlay = document.getElementsByClassName('disabled-overlay')[0];
    const list = document.getElementsByClassName('list')[0];

    if (disabled) {
      overlay.style.display = 'block';
      list.classList.add('disabled');
    } else {
      overlay.style.display = 'none';
      list.classList.remove('disabled');
    }
  };

  const updateSize = () => {
    const height = Math.ceil(document.body.clientHeight + 25);
    window.CustomElement.setHeight(height);
  };

  const setup = (value, itemId) => {
    document.addEventListener('alpine:init', () => {
      let aliasValue = [];

      try {
        const jsonValue = JSON.parse(value);

        if (Array.isArray(jsonValue)) {
          aliasValue = jsonValue;
        }
      } catch {
        // Do nothing. Parsing will fail on an empty string.
      }

      Alpine.data(
        'domainAliases',
        createDomainAliasList(aliasValue, itemId, updateSize, isDisabled)
      );
    });

    document.addEventListener('alpine:initialized', updateSize);
  };

  const initCustomElement = () => {
    try {
      window.CustomElement.init((element, context) => {
        setup(element.value, context.item.id);
        updateDisabled(element.disabled);
        Alpine.start();
      });

      window.CustomElement.onDisabledChanged(updateDisabled);
    } catch {
      updateDisabled(true);
    }
  };

  initCustomElement();
})();
