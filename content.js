class Matcher {
  constructor(data) {
    this.data = data;
    this.keywords = this.buildKeywords();
  }

  buildKeywords() {
    return {
      firstName: ['first name', 'fname', 'given name'],
      lastName: ['last name', 'lname', 'surname'],
      fullName: ['full name', 'name'],
      email: ['email', 'e-mail'],
      phone: ['phone', 'mobile', 'contact number', 'cell'],
      city: ['city', 'town'],
      zip: ['zip', 'postal', 'postcode'],
      linkedin: ['linkedin'],
      github: ['github'],
      portfolio: ['portfolio', 'website', 'site'],
      coverLetter: ['cover letter', 'message', 'summary']
    };
  }

  getDataValue(key) {
    if (key in (this.data.personal || {})) return this.data.personal[key];
    if (key in (this.data.links || {})) return this.data.links[key];
    if (key in (this.data.text || {})) return this.data.text[key];
    return null;
  }

  matchScore(element, key) {
    const keywords = this.keywords[key];
    if (!keywords) return 0;

    const attributes = [
      element.name,
      element.id,
      element.placeholder,
      element.getAttribute('aria-label'),
      this.getLabelText(element)
    ];

    const haystack = attributes
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    let score = 0;
    keywords.forEach((kw) => {
      if (haystack.includes(kw)) {
        score += kw.length;
      }
    });

    return score;
  }

  getLabelText(element) {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.innerText.trim();
    }

    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.innerText.trim();
    return '';
  }

  findMatches() {
    const fields = Array.from(document.querySelectorAll('input, textarea, select'));
    const matches = [];

    fields.forEach((field) => {
      Object.keys(this.keywords).forEach((key) => {
        const value = this.getDataValue(key);
        if (!value) return;

        const score = this.matchScore(field, key);
        if (score > 0) {
          matches.push({ field, key, score });
        }
      });
    });

    matches.sort((a, b) => b.score - a.score);

    const used = new Set();
    const finalMatches = [];

    matches.forEach((match) => {
      if (used.has(match.field)) return;
      used.add(match.field);
      finalMatches.push(match);
    });

    return finalMatches;
  }
}

function simulateFill(element, value) {
  if (!element || typeof value === 'undefined') return false;
  const descriptor = Object.getOwnPropertyDescriptor(element.__proto__, 'value');
  const nativeSetter = descriptor?.set;

  element.focus();

  if (nativeSetter) {
    nativeSetter.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
  return true;
}

function performAutofill(data) {
  const matcher = new Matcher(data);
  const matches = matcher.findMatches();
  let filledCount = 0;

  matches.forEach(({ field, key }) => {
    const value = matcher.getDataValue(key);
    if (simulateFill(field, value)) {
      filledCount += 1;
    }
  });

  return filledCount;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autofill') {
    const filledCount = performAutofill(request.data || {});
    sendResponse({ filledCount });
  }
});
