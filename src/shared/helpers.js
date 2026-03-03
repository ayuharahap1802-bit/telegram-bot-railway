const crypto = require('crypto');

class Helpers {
  static generateId() {
    return crypto.randomBytes(16).toString('hex');
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static parseCommand(text) {
    if (!text) return null;
    
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    return { command, args };
  }

  static maskUserId(id) {
    const str = id.toString();
    if (str.length <= 4) return '****';
    return str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2);
  }
}

module.exports = { Helpers };
