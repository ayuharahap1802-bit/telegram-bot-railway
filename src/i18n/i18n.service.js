const id = require('./id.json');
const en = require('./en.json');

class I18nService {
  constructor() {
    this.translations = {
      id,
      en
    };
    this.defaultLanguage = 'id';
  }

  t(key, language = 'id', params = {}) {
    const lang = this.translations[language] || this.translations[this.defaultLanguage];
    let text = lang[key] || key;
    
    // Replace params
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    
    return text;
  }

  getTranslation(language = 'id') {
    return this.translations[language] || this.translations[this.defaultLanguage];
  }
}

module.exports = new I18nService();
