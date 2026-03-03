const { PromoConfig } = require('../../config/promo.config');
const logger = require('../../shared/logger');

class PromoService {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }
  
  async getPromoMessage(userId = null) {
    const links = {
      prediction_link: this.config.PROMO_LINK_PREDICTION,
      whatsapp_link: this.config.PROMO_LINK_WHATSAPP,
      telegram_link: this.config.PROMO_LINK_TELEGRAM,
      claim_link: this.config.PROMO_LINK_CLAIM
    };
    
    let message = PromoConfig.CASHBACK.description;
    
    // Replace placeholders with actual links
    Object.entries(links).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
    
    return message;
  }
  
  async validateClaim(userId, amount) {
    const today = new Date().toISOString().split('T')[0];
    
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT SUM(amount) as total FROM promo_claims WHERE user_id = ? AND claim_date = ? AND status = "approved"',
        [userId, today],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          const totalToday = row?.total || 0;
          const maxClaim = PromoConfig.CASHBACK.requirements.maxClaimPerDay;
          
          if (totalToday + amount > maxClaim) {
            resolve({
              valid: false,
              reason: `Melebihi batas harian Rp ${maxClaim.toLocaleString()}`
            });
          }
          
          resolve({ valid: true });
        }
      );
    });
  }
  
  async recordClaim(userId, amount, metadata = {}) {
    const today = new Date().toISOString().split('T')[0];
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO promo_claims (user_id, amount, claim_date, status, metadata) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, amount, today, 'pending', JSON.stringify(metadata)],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  }
}

module.exports = { PromoService };
