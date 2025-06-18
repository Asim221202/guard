const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-koruma')
    .setDescription('Sunucuya izinsiz bot eklenmesini engeller.')
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

    settings.botKoruma = durum === 'aç';
    await settings.save();

    await interaction.reply({
      content: `✅ Bot koruma başarıyla **${durum}**ıldı.`,
      ephemeral: false
    });
  }
};
