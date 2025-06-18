const { EmbedBuilder } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  name: 'messageLog',
  async execute(client) {
    // Mesaj silindiğinde
    client.on('messageDelete', async (message) => {
      if (!message.guild) return;
      if (message.author?.bot) return;

      const settings = await GuardSettings.findOne({ guildID: message.guild.id });
      if (!settings?.mesajLog || !settings.logChannelID) return;

      const logChannel = message.guild.channels.cache.get(settings.logChannelID);
      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Mesaj Silindi')
        .setColor('Red')
        .addFields(
          { name: 'Kullanıcı', value: message.author.tag, inline: true },
          { name: 'Kanal', value: message.channel.toString(), inline: true },
          { name: 'Mesaj', value: message.content?.slice(0, 1024) || '*Yok*' }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(() => {});
    });

    // Mesaj düzenlendiğinde
    client.on('messageUpdate', async (oldMessage, newMessage) => {
      if (!oldMessage.guild) return;
      if (oldMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;

      const settings = await GuardSettings.findOne({ guildID: oldMessage.guild.id });
      if (!settings?.mesajLog || !settings.logChannelID) return;

      const logChannel = oldMessage.guild.channels.cache.get(settings.logChannelID);
      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setTitle('Mesaj Düzenlendi')
        .setColor('BLUE')
        .addFields(
          { name: 'Kullanıcı', value: oldMessage.author.tag, inline: true },
          { name: 'Kanal', value: oldMessage.channel.toString(), inline: true },
          { name: 'Eski', value: oldMessage.content?.slice(0, 1024) || '*Yok*' },
          { name: 'Yeni', value: newMessage.content?.slice(0, 1024) || '*Yok*' }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(() => {});
    });
  }
};
