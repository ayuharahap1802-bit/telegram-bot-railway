class Validator {
  static isValidTelegramId(id) {
    return typeof id === 'number' && id > 0;
  }

  static isValidUsername(username) {
    return typeof username === 'string' && 
           username.length >= 3 && 
           username.length <= 32 &&
           /^[a-zA-Z0-9_]+$/.test(username);
  }

  static isValidAmount(amount) {
    return typeof amount === 'number' && 
           amount >= 1000 && 
           amount <= 1000000;
  }

  static isValidOdds(odds) {
    return typeof odds === 'number' && odds >= 1.00 && odds <= 100.00;
  }

  static isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }
}

module.exports = { Valid
