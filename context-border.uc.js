// ==UserScript==
// @name           Structural Border Engine for Context Menus
// @namespace      http://github.com/nclark
// @description    ENGINE ONLY. Creates structural frames around menus. All styling MUST be done in userChrome.css.
// @include        chrome://browser/content/browser.xhtml
// @version        3.0.0
// ==/UserScript==

(function() {

  class StructuralBorders {
    constructor() {
      this.popup = null;
      this.container = null;
    }

    createBorders(popup) {
      this.popup = popup;
      const rect = this.popup.getBoundingClientRect();

      // Create a container the exact size of the menu
      this.container = document.createElement('div');
      this.container.id = 'custom-border-container';
      
      // The only styles set by JS are for positioning and behavior
      this.container.style.position = 'fixed';
      this.container.style.zIndex = '999999';
      this.container.style.pointerEvents = 'none';
      this.container.style.left = `${rect.left}px`;
      this.container.style.top = `${rect.top}px`;
      this.container.style.width = `${rect.width}px`;
      this.container.style.height = `${rect.height}px`;

      // Create the frame elements but DO NOT style them here.
      // CSS will use these IDs to apply all styles.
      const outerFrame = document.createElement('div');
      outerFrame.id = 'custom-border-outer-frame';
      
      const innerFrame = document.createElement('div');
      innerFrame.id = 'custom-border-inner-frame';
      
      this.container.appendChild(outerFrame);
      this.container.appendChild(innerFrame);

      document.documentElement.appendChild(this.container);
    }

    destroyBorders() {
      if (this.container) this.container.remove();
      this.popup = null;
      this.container = null;
    }
  }

  function onPopupShowing(event) {
    const popup = event.target;
    if (!popup.localName.includes('menupopup') || popup.id.startsWith('custom-border')) {
      return;
    }
    const borders = new StructuralBorders();
    borders.createBorders(popup);
    popup.addEventListener('popuphiding', () => borders.destroyBorders(), { once: true });
  }

  window.addEventListener('popupshowing', onPopupShowing, false);
  console.log('Structural Border Engine v3.0 loaded. Style in userChrome.css.');

})();



// ==UserScript==
// @name           Context Tagger
// @namespace      http://github.com/nclark
// @description    ENGINE ONLY Part 2: Detects menu context and adds a 'data-menu-type' attribute to the container created by the border script.
// @include        chrome://browser/content/browser.xhtml
// @version        1.0.0
// ==/UserScript==

(function() {
  const getMenuType = () => {
    const context = gBrowser.selectedBrowser.contextMenu;
    if (!context) return 'default';
    if (context.onLink) return 'link';
    if (context.onImage) return 'image';
    return 'default';
  };

  const findAndTagContainer = (menuType) => {
    const container = document.getElementById('custom-border-container');
    if (container) {
      container.setAttribute('data-menu-type', menuType);
    } else {
      // If the container isn't ready yet, try again on the next frame.
      // This ensures this script works even if it runs before the border script.
      requestAnimationFrame(() => findAndTagContainer(menuType));
    }
  };

  const onPopupShowing = (event) => {
    const popup = event.target;
    if (!popup.localName.includes('menupopup')) return;
    
    const menuType = getMenuType();
    findAndTagContainer(menuType);
  };

  window.addEventListener('popupshowing', onPopupShowing, false);
  console.log('Context Tagger loaded.');
})();