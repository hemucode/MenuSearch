(() => {
    "use strict";
	const STORAGE_KEY_INSTALL_DATE = "installDate";
	const STORAGE_KEY_INSTALL_VERSION = "isInstallVersion";
	const STORAGE_KEY_UPDATE_DATE = "updateDate";
	const STORAGE_KEY_UPDATE_VERSION = "isUpdateVersion";
	const STORAGE_KEY_FIELD_SETS = 'fieldSets';
	const STORAGE_KEY_IS_RATING = 'isRating';
	const STORAGE_KEY_HAS_CONTEXT = 'hasContext';
	const MAXIMUM_VIEW_COUNT_RATE = 1; // Example threshold for displaying rated sets
	const STORAGE_KEY_RATED_SETS = 'ratedSets';
	const STORAGE_KEY_POPUP_ID = 'interfaceId';
	const API = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);

	const config = {
		"browser": "chrome",
		"webstore": `https://chromewebstore.google.com/detail/${API.runtime.id}`,
		"homepage": "https://www.codehemu.com/p/adblock-for-youtube.html",
		"interface": {
		    "size": {
		      "width": 800,
		      "height": 800
		    }
		}
	};

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
		[STORAGE_KEY_RATED_SETS]: [
			{
			  name: '_separator_'
			},{
			  name: '❤ Rate US',
			  url: config.webstore
			},{
			  name: '💨 Feedback',
			  url: config.homepage + "#Feedback"
			}
		],
		[STORAGE_KEY_IS_RATING]: true,
		[STORAGE_KEY_HAS_CONTEXT]: 0,
		[STORAGE_KEY_POPUP_ID]: false
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
	          resolve();
	        }
	      });
	    });
	};

	const installEvents = ()=>{
		API.runtime.onInstalled.addListener(async (details) => {
		  switch (details.reason) {
		    case API.runtime.OnInstalledReason.INSTALL:
		      API.tabs.create({ url: config.homepage});
		      await API.storage.local.set({
		        [STORAGE_KEY_INSTALL_DATE]: Date.now(),
		        [STORAGE_KEY_INSTALL_VERSION]: API.runtime.getManifest().version
		      });
		    case API.runtime.OnInstalledReason.UPDATE:
		      await API.storage.local.set({
		        [STORAGE_KEY_UPDATE_DATE]: Date.now(),
		        [STORAGE_KEY_UPDATE_VERSION]: API.runtime.getManifest().version
		      });
		  }
		});
	};

	const uninstallEvents = ()=>{
	API.runtime.setUninstallURL(config.homepage+"#uninstall");
	}

	const setupEvents = ()=>{
		API.runtime.onStartup.addListener(async () => {
		  try {
		    await API.storage.local.set(Object.keys(DEFAULT_EXTENSION_SETTINGS));
		  } catch (error) {
		    console.log("Error getting setupEvents:", error);
		  }
		});
	}

	const lifecycleEvents = async()=>{
		await setupEvents();
		await installEvents();
		await uninstallEvents();
	}

	const setContextMenuItems = async () => {
		if (!API || !API.contextMenus) {
			console.error("Browser Context Menu API not found. Unable to set menu items.");
			return;
		}
		try {
		    const settings = await getAllExtensionSettings();
		    let fieldsets = settings[STORAGE_KEY_FIELD_SETS] || [];

		    if (settings[STORAGE_KEY_IS_RATING] &&
		        settings[STORAGE_KEY_HAS_CONTEXT] > MAXIMUM_VIEW_COUNT_RATE &&
		        settings[STORAGE_KEY_RATED_SETS]) {
		      fieldsets = [...fieldsets, ...settings[STORAGE_KEY_RATED_SETS]];
		    }

		    // to prevent duplicates and ensure a fresh state.
		    await new Promise((resolve, reject) => {
		      API.contextMenus.removeAll(() => {
		        if (API.runtime.lastError) {
		          // Log any error that occurred during removal.
		          console.error(`Error removing context menu items: ${API.runtime.lastError.message}`);
		          reject(new Error(API.runtime.lastError.message));
		        } else {
		          resolve(); // Resolve the promise if removal was successful
		        }
		      });
		    });

		    if (fieldsets.length > 0) {
		      for (const index in fieldsets) {
		        const item = fieldsets[index];
		        if (item && item.name) {
		          const menuItemProperties = {
		            id: item.id || String(index), // Use item.id if available, otherwise fallback to index
		            contexts: ['selection', 'image'], // Contexts where the menu item appears
		          };

		          if (item.name === '_separator_') {
		            menuItemProperties.type = 'separator';
		            delete menuItemProperties.title; // Separators don't have titles.
		            console.log(`Creating separator menu item with ID: ${menuItemProperties.id}`);
		          } else {
		            menuItemProperties.title = item.name;
		            console.log(`Creating menu item: "${item.name}" with ID: ${menuItemProperties.id}`);
		          }

		          API.contextMenus.create(menuItemProperties);
		        }
		      }
		      console.log('Finished creating new context menu items.');
		    } else {
		      console.log('No fieldsets to add to the context menu.');
		    }
		  } catch (error) {
		  	console.error("Error setting context menu items:", error);
	    }
	};

	const setContextMenuClick = () => {
		if (!API || !API.contextMenus) {
			console.error("Browser Context Menu API not found. Unable to set menu items.");
			return;
		}

		API.contextMenus.onClicked.addListener(async (info) => {
			try {
			  const settings = await getAllExtensionSettings();

			  let fieldsets = settings[STORAGE_KEY_FIELD_SETS];
			  if (settings[STORAGE_KEY_IS_RATING] &&
				    settings[STORAGE_KEY_HAS_CONTEXT] > MAXIMUM_VIEW_COUNT_RATE &&
				    settings[STORAGE_KEY_RATED_SETS]) {
				  fieldsets = [...fieldsets, ...settings[STORAGE_KEY_RATED_SETS]];
			  }

			  if (!fieldsets) {
			    console.warn("No fieldsets found in storage. Context menu click handler might not function as expected.");
			    return; // Exit if no fieldsets are available.
			  }

			  let targetUrl = fieldsets[info.menuItemId]?.url; // Use optional chaining for safer access

			  if (!targetUrl) {
			    console.warn(`No URL found for context menu item with ID: ${info.menuItemId}`);
			    return;
			  }

			  const contentToInject = info.srcUrl || info.selectionText;

			  // Handle specific URLs (webstore, homepage) by resetting rating status.
			  if (targetUrl.match(config.webstore) || targetUrl.match(config.homepage)) {
			    await setExtensionSettings({ [STORAGE_KEY_IS_RATING]: false });
			  } else if (contentToInject) {
			    targetUrl = targetUrl.replace('%s', encodeURIComponent(contentToInject));
			  } else if (targetUrl.includes('%s')) {
			    targetUrl = targetUrl.replace('%s', '');
			  }

			  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

			  // Ensure that an active tab was found.
			  if (!tabs || tabs.length === 0) {
			    console.error('Error: No active tab found to open a new tab next to.');
			    return;
			  }

			  const currentTab = tabs[0];

			  const newTab = await chrome.tabs.create({
			    url: targetUrl,
			    index: currentTab.index + 1, // Open the new tab immediately after the current one
			    openerTabId: currentTab.id, // Link the new tab to the current tab as its opener
			  });

			  if (!(settings[STORAGE_KEY_HAS_CONTEXT] > MAXIMUM_VIEW_COUNT_RATE)) {
			    await setExtensionSettings({ [STORAGE_KEY_HAS_CONTEXT]: settings[STORAGE_KEY_HAS_CONTEXT] + 1 });
			  }

			} catch (error) {
			  console.error("Error fetching settings or handling context menu click:", error);
			}
		});
	};

	const updateDynamicMenu = async()=>{
		await setContextMenuItems();
		await setContextMenuClick();
	};


	const updateStorageSettings = () => {
	  chrome.storage.onChanged.addListener((changes) => {
	    if (changes[STORAGE_KEY_IS_RATING]?.newValue === false ||
	        changes[STORAGE_KEY_HAS_CONTEXT]?.newValue > MAXIMUM_VIEW_COUNT_RATE || 
	        changes[STORAGE_KEY_FIELD_SETS]?.newValue) {
	      // If either of the conditions is met, call setContextMenuItems()
	      // to refresh or rebuild the context menu items based on the updated settings.
	      setContextMenuItems();
	    }
	  });
	};


	const interfaceCreate = async () => {
	  try {
	    const currentWindow = await API.windows.getCurrent();

	    const popupWidth = config.interface.size.width || 516;
	    const popupHeight = config.interface.size.height || 800;

	    const top = Math.round(currentWindow.top + (currentWindow.height - popupHeight) / 2);
	    const left = Math.round(currentWindow.left + (currentWindow.width - popupWidth) / 2);

	    const newWindow = await API.windows.create({
	      url: API.runtime.getURL("data/options/options.html"),
	      type: "popup",
	      height: popupHeight,
	      width: popupWidth,
	      top: top,
	      left: left,
	    });

	    console.log("New popup window created:", newWindow);
	    return newWindow;

	  } catch (error) {
	    console.error("Error creating new window:", error);
	    return undefined;
	  }
	};

	const createWindowEvents = () => {
	  if (typeof API === 'undefined' || !API.action || !API.windows) {
	    console.error("Browser API (API.action or API.windows) not found. Unable to set up window events.");
	    return;
	  }

	  API.action.onClicked.addListener(async (tab) => {
	    try {
	      const settings = await getAllExtensionSettings(); // Get current extension settings

	      if (settings[STORAGE_KEY_POPUP_ID]) {

	        API.windows.get(settings[STORAGE_KEY_POPUP_ID], async (existingWindow) => {
	          if (existingWindow) {
	            API.windows.update(settings[STORAGE_KEY_POPUP_ID], { "focused": true });
	            console.log("Existing popup window activated:", settings[STORAGE_KEY_POPUP_ID]);
	          } else {
	            console.log("Stored popup window ID found, but window does not exist. Clearing ID and creating new window.");
	            await setExtensionSettings({ [STORAGE_KEY_POPUP_ID]: "" });
	            const newWindow = await interfaceCreate(API, config);
	            if (newWindow) {
	              await setExtensionSettings({ [STORAGE_KEY_POPUP_ID]: newWindow.id });
	            }
	          }
	        });
	      } else {
	        console.log("No stored popup window ID found. Creating new window.");
	        const newWindow = await interfaceCreate();
	        if (newWindow) {
	          await setExtensionSettings({ [STORAGE_KEY_POPUP_ID]: newWindow.id });
	        }
	      }
	    } catch (error) {
	      console.error("Error in browser action click handler:", error);
	    }
	  });
	};

	const removeWindowEvents = () => {
	  if (typeof API === 'undefined' || !API.windows) {
	    console.error("Browser API (API.windows) not found. Unable to set up window removal event listener.");
	    return;
	  }

	  API.windows.onRemoved.addListener(async (windowId) => {
	    try {
	      const settings = await getAllExtensionSettings();
	      if (settings[STORAGE_KEY_POPUP_ID] === windowId) {
	        console.log(`Popup window with ID ${windowId} was removed. Clearing stored popup ID.`);
	        await setExtensionSettings({ [STORAGE_KEY_POPUP_ID]: "" });
	      }
	    } catch (error) {
	      console.error("Error in window.onRemoved listener:", error);
	    }
	  });
	};



	(async() => {
		Promise.all([
		  // await lifecycleEvents(),
		  await createWindowEvents(),
		  await removeWindowEvents(),
		  await updateDynamicMenu(),
		  await updateStorageSettings(),
		]);
	})();
})();