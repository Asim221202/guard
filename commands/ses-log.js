const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ses-log')
    .setDescription('Ses kanalı giriş/çıkış/mute logunu açar veya kapatır.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('durum')
        .setDescription('Ses log durumunu seçin.')
        .setRequired(true)
        .addChoices(
          { name: 'aç', value: 'aç' },
          { name: 'kapat', value: 'kapat' }
        )
    ),

  async execute(interaction) {
    const durum = interaction.options.getString('durum');
    const guildID = interaction.guild.id;

    let settings = await GuardSettings.findOne({ guildID });
    if (!settings) settings = new GuardSettings({ guildID });

    settings.sesLog = durum === 'aç';
    await settings.save();

    interaction.reply({ content: `✅ Ses log sistemi **${durum}**ıldı.`, ephemeral: false });
  }
};
