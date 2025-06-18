// utils/sendGuardLog.js

const { EmbedBuilder } = require('discord.js');

module.exports = async function sendGuardLog(guild, settings, { title, description, fields = [], color = 0x0099ff }) {
  if (!settings.logChannelID) return;

  const logChannel = guild.channels.cache.get(settings.logChannelID);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('[GUARD] Log kanalı mesaj gönderilemedi:', error);
  }
};
