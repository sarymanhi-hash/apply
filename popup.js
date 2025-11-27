import userData from './user_data.js';

const fillButton = document.getElementById('fill-btn');
const statusDiv = document.getElementById('status');

function setStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? '#b91c1c' : '#065f46';
}

async function sendAutofillRequest() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatus('No active tab found', true);
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'autofill',
      data: userData
    });

    if (response?.filledCount >= 0) {
      setStatus(`Filled ${response.filledCount} fields.`);
    } else {
      setStatus('No response from content script.', true);
    }
  } catch (error) {
    console.error('Autofill error', error);
    setStatus('Failed to send autofill request.', true);
  }
}

fillButton?.addEventListener('click', sendAutofillRequest);
