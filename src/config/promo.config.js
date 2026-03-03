const PromoConfig = {
  CASHBACK: {
    name: 'CASHBACK 100% MIX PARLAY',
    description: `⚽️ PROMO GILA! CASHBACK 100% MIX PARLAY ⚽️
Satu Tim Meleset? Modal Kami Balikin Utuh!

📋 SYARAT:
• Bet: Min Rp 10.000
• Tim: Min 5 tim (TODAY)
• Odds: Min 1.80/tim
• Provider: Sport 1/2

💡 ATURAN:
• 1 tim Lose Full
• Sisanya Win Full
• Max Rp 300.000/hari

⚠️ WAJIB FOLLOW:
🤖 BOT OFFICIAL (@bolapelangi2_bot)
📈 PREDIKSI JITU ({prediction_link})
📢 CHANNEL WHATSAPP ({whatsapp_link})
📢 CHANNEL TELEGRAM ({telegram_link})
🟢 KLAIM BONUS ({claim_link})

📌 Catatan: 1x/hari, no IP sama, no safety bet
🚀 GASPOLL TERUS BOSKU!`,
    
    requirements: {
      minBet: 10000,
      minTeams: 5,
      minOdds: 1.80,
      providers: ['Sport 1', 'Sport 2'],
      maxClaimPerDay: 300000,
      maxPerUser: 1
    }
  }
};

module.exports = { PromoConfig };
