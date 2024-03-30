export const createDomainAliasList = (splitAliases, itemId, updateSize, isDisabled) => () => ({
  items: splitAliases.map((alias) => ({
    originalValue: alias,
    newValue: alias,
    error: '',
    isEditing: false,
    isLoading: false
  })),
  get kontentValue() {
    const aliases = this.items
      .map((domain) => domain.originalValue)
      .map((value) => value.replace(/^\/+|\/+$/g, ''));

    return JSON.stringify(aliases);
  },
  get isSomethingEditing() {
    return this.items.some((domain) => domain.isEditing);
  },
  isSomethingElseEditing(index) {
    return this.items.filter((_, i) => i !== index).some((domain) => domain.isEditing);
  },
  createItem() {
    this.items.push({
      originalValue: '',
      newValue: '',
      error: '',
      isEditing: true,
      isLoading: false
    });
    this.updateSize();
  },
  removeItem(index) {
    this.items.splice(index, 1);
    this.saveToKontent();
  },
  editItem(index) {
    this.items[index].isEditing = true;
    this.focus(this.$id('list-item'));
  },
  async saveItem(index) {
    const domainAlias = this.items[index];
    const trimmedValue = domainAlias.newValue.trim();

    if (!trimmedValue) {
      domainAlias.error = 'Provide a domain alias.';
      return;
    }

    if (domainAlias.originalValue === trimmedValue) {
      domainAlias.isEditing = false;
      return;
    }

    if (this.items.map((item) => item.originalValue).includes(trimmedValue)) {
      domainAlias.error = 'The domain alias already exists as another domain alias on this page.';
      return;
    }

    const urlSlug = await new Promise((resolve) => {
      window.CustomElement.getElementValue('url', resolve);

      // CustomElement.getElementValue will not invoke the callback when the element is not allowed in Kontent.ai.
      // URLs on books, journals, etc. cannot allow the URL field as it's in a different content group.
      // This is a workaround to prevent the promise from hanging indefinitely.
      setTimeout(() => {
        resolve(null);
      }, 500);
    });

    if (trimmedValue === urlSlug) {
      domainAlias.error = 'The domain alias matches the current URL slug.';
      return;
    }

    // Uncomment the following code to check if the domain alias is unique across all pages.
    // This requires a custom endpoint that checks if the domain alias is unique.
    // try {
    //   domainAlias.isLoading = true;
    //   const response = await fetch(`/api/url/is-unique?url=${window.encodeURIComponent(trimmedValue)}`);
    //   const data = await response.json();

    //   if (!data.isUnique && data.id !== itemId) {
    //     domainAlias.error = `The domain alias is already used in another page: <a href="${data.url}" target="_blank">${data.name}</a>.`;
    //   }
    // } catch {
    //   domainAlias.error = 'An error occurred while checking the domain alias. Please try again later.';
    // } finally {
    //   domainAlias.isLoading = false;
    // }

    if (domainAlias.error) {
      return;
    }

    domainAlias.isEditing = false;
    domainAlias.originalValue = trimmedValue;
    this.saveToKontent();
  },
  cancelEdit(index) {
    const domainAlias = this.items[index];

    if (!domainAlias.originalValue.trim()) {
      this.removeItem(index);
    } else {
      domainAlias.newValue = domainAlias.originalValue;
      domainAlias.isEditing = false;
    }
  },
  focus(id) {
    setTimeout(() => {
      document.getElementById(id)?.focus();
    }, 0);
  },
  focusIfNew(index) {
    if (this.items[index].isEditing) {
      this.focus(this.$id('list-item'));
    }
  },
  resetError(index) {
    this.items[index].error = null;
    this.updateSize();
  },
  saveToKontent() {
    if (isDisabled) {
      return;
    }

    window.CustomElement.setValue(this.kontentValue);
    this.updateSize();
  },
  updateSize() {
    this.$nextTick(() => updateSize());
  }
});
