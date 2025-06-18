// commands/kanal-koruma.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kanal-koruma')
    .setDescription('Kanal silme korumasını aç/kapat')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('aç')
        .setDescription('Kanal korumasını açar'))
    .addSubcommand(sub =>
      sub.setName('kapat')
        .setDescription('Kanal korumasını kapatır')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildID = interaction.guild.id;

    let settings = await GuardSettings.findOne({ guildID });
    if (!settings) {
      settings = new GuardSettings({ guildID });
    }

    if (sub === 'aç') {
      if (settings.kanalKoruma) {
        return interaction.reply({ content: '❗ Kanal koruması zaten açık.', ephemeral: true });
      }
      settings.kanalKoruma = true;
      await settings.save();
      return interaction.reply({ content: '✅ Kanal koruması başarıyla **açıldı**.', ephemeral: true });
    }

    if (sub === 'kapat') {
      if (!settings.kanalKoruma) {
        return interaction.reply({ content: '❗ Kanal koruması zaten kapalı.', ephemeral: true });
      }
      settings.kanalKoruma = false;
      await settings.save();
      return interaction.reply({ content: '❌ Kanal koruması başarıyla **kapatıldı**.', ephemeral: true });
    }
  }
};
