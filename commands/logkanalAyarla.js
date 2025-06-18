// commands/log-kanal-ayarla.js

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-kanal-ayarla')
    .setDescription('Guard loglarının gönderileceği kanalı ayarlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Logların gönderileceği kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const kanal = interaction.options.getChannel('kanal');
    const guildID = interaction.guild.id;

    let settings = await GuardSettings.findOne({ guildID });
    if (!settings) {
      settings = new GuardSettings({ guildID });
    }

    settings.logChannelID = kanal.id;
    await settings.save();

    return interaction.reply({
      content: `✅ Guard log kanalı başarıyla ${kanal} olarak ayarlandı.`,
      ephemeral: false
    });
  }
};
