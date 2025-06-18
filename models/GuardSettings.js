// models/GuardSettings.js

const mongoose = require('mongoose');

const GuardSettingsSchema = new mongoose.Schema({
  guildID: String,
  logChannelID: { type: String, default: null },
  whitelist: { type: [String], default: [] },

  kanalKoruma: { type: Boolean, default: false },
  rolKoruma: { type: Boolean, default: false },
  sunucuKoruma: { type: Boolean, default: false },
  banKoruma: { type: Boolean, default: false },
  botKoruma: { type: Boolean, default: false },

  mesajLog: { type: Boolean, default: false },
  sesLog: { type: Boolean, default: false },
});

module.exports = mongoose.model('GuardSettings', GuardSettingsSchema);
