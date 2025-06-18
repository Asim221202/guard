const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu-koruma')
    .setDescription('Sunucu ayarlarını değiştirme korumasını açar veya kapatır.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('durum')
        .setDescription('Koruma durumu: aç veya kapat')
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

    settings.sunucuKoruma = durum === 'aç';
    await settings.save();

    await interaction.reply({
      content: `✅ Sunucu koruma başarıyla **${durum}**ıldı.`,
      ephemeral: false
    });
  }
};
