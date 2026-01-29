// Draw Extension - Background Service Worker
'use strict';

// Track drawing mode state per tab
const tabStates = new Map();

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  const currentState = tabStates.get(tab.id) || { isDrawingMode: false };
  const newState = !currentState.isDrawingMode;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'toggleDrawingMode',
      enabled: newState
    });

    tabStates.set(tab.id, { isDrawingMode: newState });

    // Update icon badge to show state
    chrome.action.setBadgeText({
      tabId: tab.id,
      text: newState ? 'ON' : ''
    });
    chrome.action.setBadgeBackgroundColor({
      tabId: tab.id,
      color: '#4CAF50'
    });
  } catch (error) {
    console.error('Failed to toggle drawing mode:', error);
  }
});

// Clean up state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getTabState') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const state = tabStates.get(tabs[0].id) || { isDrawingMode: false };
        sendResponse({ success: true, state });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true;
  }
});

console.log('Draw Extension: Service worker initialized');
