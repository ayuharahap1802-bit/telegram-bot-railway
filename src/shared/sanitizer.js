class Sanitizer {
  static sanitizeInput(text) {
    if (!text) return '';
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Escape special characters
    text = text.replace(/[&<>"]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      if (m === '"') return '&quot;';
      return m;
    });
    
    return text;
  }

  static sanitizeUsername(username) {
    if (!username) return '';
    return username.replace(/[^a-zA-Z0-9_]/g, '');
  }

  static sanitizeNumber(num) {
    if (!num) return 0;
    return parseInt(num.toString().replace(/[^0-9-]/g, '')) || 0;
  }
}

module.exports = { Sanitizer };
