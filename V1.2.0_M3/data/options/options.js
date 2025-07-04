(() => {
  "use strict";
  const OPTION_LIST_FO_FIELDSETS_ID = "listOfFieldsets";
  const OPTION_FIELDSETS_TEMPLATE_ID = "fieldsetTemplate";
  const OPTION_SEPARATOR_TEMPLATE_ID = "separatorTemplate";
  const OPTION_ADD_SEPARATOR_BTN_ID = "addSeparatorButton";
  const OPTION_ALPHABETICAL_BTN_ID = "sortAlphabetically";
  const OPTION_SCROLL_END_BTN_ID = "scrollEnd";
  const OPTION_SCROLL_UP_BTN_ID = "scrollUp";
  const OPTION_CLOSE_WINDOW_BTN_ID = "closeWindow";
  const OPTION_ADD_LINK_BTN_ID = "addButton";
  const OPTION_SAVE_LINK_BTN_ID = "saveButton";
  const OPTION_LOAD_DEFAULTS_BTN_ID = "loadDefaults";
  const OPTION_EXPORT_DATA_BTN_ID = "exportData";
  const OPTION_INPORT_DATA_BTN_ID = "importData";
  const OPTION_REMOVE_LINK_BTN_CLASS = "deleteButton";
  const STORAGE_KEY_FIELD_SETS = "fieldSets";

  const API = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);

  const DEFAULT_EXTENSION_SETTINGS = {
    [STORAGE_KEY_FIELD_SETS]: [
      {
        name: 'Google - Exact match',
        url: 'https://www.google.com/search?q="%s"',
      },{
        name: 'Google - Images',
        url: 'https://www.google.com/search?q=%s&tbm=isch',
      },{
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q=%s',
      },{
        name: 'Yahoo',
        url: 'https://search.yahoo.com/search?p=%s',
      },{
        name: 'Bing',
        url: 'https://www.bing.com/search?q=%s',
      },{
        name: '_separator_',
      },{
        name: 'Daum (다음)',
        url: 'https://search.daum.net/search?&q=%s',
      },{
        name: 'Naver (네이버)',
        url: 'https://search.naver.com/search.naver?query=%s',
      },{
        name: 'Baidu (百度)',
        url: 'https://www.baidu.com/s?wd=%s',
      },{
        name: 'Yandex (яндекс)',
        url: 'https://yandex.com/search/?text=%s',
      },{
        name: '_separator_',
      },{
        name: 'Facebook',
        url: 'https://www.facebook.com/search?q=%s',
      },{
        name: 'YouTube',
        url: 'https://www.youtube.com/results?search_query=%s',
      },{
        name: 'TikTok',
        url: 'https://www.tiktok.com/search?q=%s',
      },{
        name: 'Wikipedia',
        url: 'https://www.wikipedia.org/w/index.php?search=%s',
      },{
        name: '_separator_',
      }, {
        name: 'Google Maps',
        url: 'https://www.google.com/maps/search/%s',
      }, {
        name: 'Yandex Maps',
        url: 'https://yandex.com/maps?text=%s'
      }
    ],
  };

  const $ = (selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      return elements.length > 1 ? Array.from(elements) : elements[0] || null;
    } catch (error) {
      console.error("Error in selector:", selector, error);
      return null;
    }
  };

  const getAllExtensionSettings = async()=> {
    try {
      const storedSettings = await API.storage.local.get(Object.keys(DEFAULT_EXTENSION_SETTINGS));
      return { ...DEFAULT_EXTENSION_SETTINGS, ...storedSettings};
    } catch (error) {
      console.error("Error getting extension settings:", error);
      return DEFAULT_EXTENSION_SETTINGS;
    }
  };

  const setExtensionSettings = (settingsObject) => {
    return new Promise((resolve, reject) => {
      API.storage.local.set(settingsObject, () => {
        if (API.runtime.lastError) {
          console.error("Error setting storage:", API.runtime.lastError.message);
          reject(API.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    });
  };

  const damReady = (callback)=>{
    document.readyState === "complete" ? callback() : 
    window.addEventListener("load", callback, {once: true});
  };

  const translate = () => {
    return new Promise((resolve) => {
      const elements = document.querySelectorAll("[data-message]");
      for (const element of elements) {
        const key = element.dataset.message;
        if (typeof API !== 'undefined' && API.i18n && API.i18n.getMessage) {
          const message = API.i18n.getMessage(key);
          if (message) {
            element.textContent = message;
          } else {
            console.error("Missing API.i18n message for key:", key);
          }
        } else {
          console.error("Chrome i18n API (API.i18n.getMessage) not available. Cannot translate elements.");
        }
      }
      resolve();
    });
  };

  const isValidUrlOrigin = (urlString) => {
      try {
          const url = new URL(urlString);
          const currentHostname = url.host;
          const protocol = url.protocol;
          let newHostname;
          if (currentHostname.split('.').length > 2) {
            const domainParts = currentHostname.split('.');
            domainParts[0] = "www";
            newHostname = domainParts.join('.');
          }else {
              // If no explicit subdomain, prepend the new subdomain
              newHostname = `www.${currentHostname}`;
          }
          return `${protocol}//${newHostname}`;
      } catch (e) {
          // If parsing fails, it's not a valid URL
          return null;
      }
  };

  const createImage = (size, text)=> {
    const dimensions = size.split('x');
    const width = parseInt(dimensions[0], 10);
    const height = parseInt(dimensions[1], 10);

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      console.error("Invalid size format. Please use 'widthxheight' (e.g., '300x200').");
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "#cccccc";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#fff";
    let fontSize = Math.min(height / 1.5, 48);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(text, width / 2, height / 2);

    return canvas.toDataURL('image/png');
  }


  const setFieldsets = (fieldsets)=> {
    if (!fieldsets) {
      console.warn("setFieldsets: No fieldsets data provided. Exiting.");
      return;
    }

    const listOfFieldsets = $(`#${OPTION_LIST_FO_FIELDSETS_ID}`);
    if (!listOfFieldsets) {
      console.error("setFieldsets: 'listOfFieldsets' element not found in the DOM. Cannot update fieldsets.");
      return;
    }

    const oldFieldsets = listOfFieldsets.querySelectorAll('li');
    for (let i = 0; i < oldFieldsets.length; i++) {
      oldFieldsets[i].remove(); // Remove each old <li> element from the DOM.
    }

     for (let index in fieldsets) {
      let fieldset; // Variable to hold the cloned template content.

      if (fieldsets[index].name === '_separator_') {
        const separatorTemplate = $(`#${OPTION_SEPARATOR_TEMPLATE_ID}`);
        if (separatorTemplate && separatorTemplate.content) {
          fieldset = separatorTemplate.content.cloneNode(true); 
        } else {
          console.error(`Template with ID '${OPTION_SEPARATOR_TEMPLATE_ID}' not found or has no content.`);
          continue;
        }
      } else {
        const regularFieldsetTemplate = $(`#${OPTION_FIELDSETS_TEMPLATE_ID}`);
        if (regularFieldsetTemplate && regularFieldsetTemplate.content) {
          fieldset = regularFieldsetTemplate.content.cloneNode(true);

          const iconImg = fieldset.querySelector('.icon');
          const nameInput = fieldset.querySelector('.name');
          const urlInput = fieldset.querySelector('.url');

          if (iconImg) {
            const newUrlOrigin = isValidUrlOrigin(fieldsets[index].url);
            if (newUrlOrigin && navigator.onLine) {
              iconImg.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${newUrlOrigin}`;
              iconImg.alt = `Favicon for ${newUrlOrigin}`;
            } else {
              const iconText = fieldsets[index].name ? fieldsets[index].name[0].toUpperCase() : "Link";
              iconImg.src  = createImage("60x60", iconText);
              iconImg.alt = `Favicon for ${iconText}`;
            }
          } else {
            console.warn(`Element with class 'icon' not found in template for fieldset: ${fieldsets[index].name}`);
          }

          if (nameInput) {
            nameInput.value = fieldsets[index].name;
          } else {
            console.warn(`Element with class 'name' not found in template for fieldset: ${fieldsets[index].name}`);
          }

          if (urlInput) {
            urlInput.value = fieldsets[index].url;
          } else {
            console.warn(`Element with class 'url' not found in template for fieldset: ${fieldsets[index].name}`);
          }
        } else {
          console.error(`Template with ID '${OPTION_FIELDSETS_TEMPLATE_ID}' not found or has no content.`);
          continue;
        }
      }

      if (fieldset) {
        listOfFieldsets.appendChild(fieldset);
      }
    }
  };

  damReady(() => {
    getAllExtensionSettings().then(settings=>{
      setFieldsets(settings[STORAGE_KEY_FIELD_SETS]);
      translate();
    });

    const listOfFieldsets = $(`#${OPTION_LIST_FO_FIELDSETS_ID}`);
    if (!listOfFieldsets) {
      console.error("damReady: 'listOfFieldsets' element not found in the DOM.");
      return;
    }

    listOfFieldsets.addEventListener('click', eventObject => {
      const removeFieldSetButton = eventObject.target;
      if (removeFieldSetButton.classList.contains(OPTION_REMOVE_LINK_BTN_CLASS)) {
        removeFieldSetButton.parentElement.remove();
      }
    });

    const separatorTemplate = $(`#${OPTION_SEPARATOR_TEMPLATE_ID}`);
    const regularFieldsetTemplate = $(`#${OPTION_FIELDSETS_TEMPLATE_ID}`);

    const addButton = $(`#${OPTION_ADD_LINK_BTN_ID}`);
    if (addButton) {
      addButton.addEventListener("click",()=>{
        if (regularFieldsetTemplate && regularFieldsetTemplate.content) {
          listOfFieldsets.appendChild(regularFieldsetTemplate.content.cloneNode(true));
          translate();
        }else {
          console.log(`Template with ID '${OPTION_FIELDSETS_TEMPLATE_ID}' not found or has no content.`);
        }
      });
    } else{
      console.log("damReady: 'addButton' element not found in the DOM.");
    }

    const addSeparatorButton = $(`#${OPTION_ADD_SEPARATOR_BTN_ID}`);
    if (addSeparatorButton) {
      addSeparatorButton.addEventListener("click", ()=>{
        if (separatorTemplate && separatorTemplate.content) {
          listOfFieldsets.appendChild(separatorTemplate.content.cloneNode(true));
          translate();
        }else {
          console.log(`Template with ID '${OPTION_ADD_SEPARATOR_BTN_ID}' not found or has no content.`);
        }
      });
    } else{
      console.log("damReady: 'addSeparatorButton' element not found in the DOM.");
    }

    const saveButton = $(`#${OPTION_SAVE_LINK_BTN_ID}`);
    if (saveButton) {
      saveButton.addEventListener("click", async()=>{
        const dataToSave = []; // Array to hold validated data for saving
        const fieldsets = listOfFieldsets.querySelectorAll('li'); // Get all list items (fieldsets)
        for (let i = 0; i < fieldsets.length; i++) {
          const fieldset = fieldsets[i];
          const nameInput = fieldset.querySelector('.name');
          const urlInput = fieldset.querySelector('.url');

          if (!nameInput) {
            dataToSave.push({ name: '_separator_' });
            continue; // Move to the next fieldset
          }

          if (!nameInput.value.trim()) {
            console.log("Name Invalid: Name field cannot be empty.");
            nameInput.value = ''; // Clear the input
            nameInput.style.background = "#ff3283"; // Highlight with red
            setTimeout(() => nameInput.style.background = "", 3000);
            return;
          }

          // If a URL input exists, validate it.
          if (urlInput) {
            if (!isValidUrlOrigin(urlInput.value) || !urlInput.value.includes("%s")) {
              console.log("URL Invalid: URL must be valid and contain '%s'.");
              urlInput.value = ''; 
              urlInput.style.background = "#ff3283";
              setTimeout(() => urlInput.style.background = "", 3000);
              return;
            }
          }

          dataToSave.push({
            name: nameInput.value.trim(),
            url: urlInput ? urlInput.value : '',
          });
        }

        try {
          const savedSuccessfully = await setExtensionSettings({ [STORAGE_KEY_FIELD_SETS]: dataToSave });
          if (savedSuccessfully) {
            saveButton.textContent = "💾 " + (API.i18n?.getMessage("text_saved") || "Saved");
            setTimeout(() => saveButton.textContent = "💾 " + (API.i18n?.getMessage("text_save") || "Save"), 1000);
          } else {
            console.error("Failed to save settings. `setExtensionSettings` did not return true.");
          }
        } catch (error) {
          console.error("Error saving extension settings:", error);
        }
      });
    } else{
      console.log("damReady: 'saveButton' element not found in the DOM.");
    }

    const sortAlphabetically = $(`#${OPTION_ALPHABETICAL_BTN_ID}`);
    if (sortAlphabetically) {
      sortAlphabetically.addEventListener("click",()=>{
        const fieldsets = Array.from(listOfFieldsets.querySelectorAll('li'));
        const sortableItems = fieldsets.map(fieldset => {
          const nameInput = fieldset.querySelector('.name');
          if (nameInput && nameInput.value.trim()) {
            return {
              element: fieldset,
              name: nameInput.value.trim().toLowerCase(), // Use lowercase for case-insensitive sorting
              isSeparator: false
            };
          } else {
            return {
              element: fieldset,
              name: '_separator_', // A special "name" for sorting separators
              isSeparator: true
            };
          }
        });

        sortableItems.sort((a, b) => {
          // If both are separators, maintain their original order (stable sort for separators).
          if (a.isSeparator && b.isSeparator) {
              return 0; // Maintain relative order
          }
          // If only A is a separator, A comes before B.
          if (a.isSeparator) {
              return -1;
          }
          // If only B is a separator, B comes before A.
          if (b.isSeparator) {
              return 1;
          }
          // Both are named items, sort by name.
          return a.name.localeCompare(b.name);
        });

        const fragment = document.createDocumentFragment();

        sortableItems.forEach(item => {
          fragment.appendChild(item.element);
        });

        listOfFieldsets.appendChild(fragment);
      });
    } else{
      console.log("damReady: 'sortAlphabetically' element not found in the DOM.");
    }

    const scrollEnd = $(`#${OPTION_SCROLL_END_BTN_ID}`);
    if (scrollEnd) {
      scrollEnd.addEventListener("click", ()=>{
        window.scrollTo({
          top: document.body.scrollHeight,
          left: 0,
          behavior: 'smooth'
        });
      });
    } else{
      console.log("damReady: 'scrollEnd' element not found in the DOM.");
    }

    const scrollUpButton = $(`#${OPTION_SCROLL_UP_BTN_ID}`);
    if (scrollUpButton) {
      scrollUpButton.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
        console.log(`Scrolled to top via '${OPTION_SCROLL_UP_BTN_ID}' button.`);
      });
    } else {
      console.error(`damReady: '${OPTION_SCROLL_UP_BTN_ID}' element not found in the DOM.`);
    }

    const loadDefaults = $(`#${OPTION_LOAD_DEFAULTS_BTN_ID}`);
    if (loadDefaults) {
      loadDefaults.addEventListener("click", async ()=>{
        const defaultField = DEFAULT_EXTENSION_SETTINGS[STORAGE_KEY_FIELD_SETS];
        setExtensionSettings({[STORAGE_KEY_FIELD_SETS]: defaultField});
        setFieldsets(defaultField);
        translate();
      });
    }else{
      console.log("damReady: 'loadDefaults' element not found in the DOM.");
    }

    const exportData = $(`#${OPTION_EXPORT_DATA_BTN_ID}`);
    if (exportData) {
      exportData.addEventListener("click", async ()=>{
        try {
          const settings = await getAllExtensionSettings();
          const jsonData = JSON.stringify(settings, null, 2);
          const blob = new Blob([jsonData], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          API.downloads.download({
            url: url,
            filename: `${API.i18n?.getMessage("app_name") || "settings"}.json`,
          });

          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error exporting data:", error);
        }
      });
    } else{
      console.log("damReady: 'exportData' element not found in the DOM.");
    }

    const importData = $(`#${OPTION_INPORT_DATA_BTN_ID}`);
    if (importData) {
      importData.addEventListener("click", async ()=>{
        const fileChooser = document.createElement('input');
        fileChooser.type = 'file';
        fileChooser.accept = 'application/json';

        // Add event listener for when a file is selected
        fileChooser.addEventListener('change', async (event) => {
          const file = event.target.files[0];

          if (!file) {
            console.log("No file selected.");
            return;
          }

          const reader = new FileReader();

          reader.onload = (e) => {
            try {
              const result = e.target.result;
              const storage = JSON.parse(result);
              console.log(storage);

              if (storage && typeof storage === 'object' && storage[STORAGE_KEY_FIELD_SETS]) {
                setFieldsets(storage[STORAGE_KEY_FIELD_SETS]);
                console.log("Settings imported successfully!");
                translate();
              } else {
                console.warn("Imported JSON does not contain expected 'fieldsets' structure.");
              }

            } catch (parseError) {
              console.error("Error parsing JSON file:", parseError);
            }
          };

          reader.onerror = (error) => {
            console.error("Error reading file:", error);
          };

          reader.readAsText(file);
        });

        fileChooser.click();
      });
    } else{
      console.log(`DOM not ready or element with ID '${OPTION_INPORT_DATA_BTN_ID}' not found for import.`);
    }

    const closeWindow = $(`#${OPTION_CLOSE_WINDOW_BTN_ID}`);
    if (closeWindow) {
      closeWindow.addEventListener('click', ()=> close());
    } else{
      console.log(`DOM not ready or element with ID '${OPTION_CLOSE_WINDOW_BTN_ID}' not found for import.`);
    }
  });
})();