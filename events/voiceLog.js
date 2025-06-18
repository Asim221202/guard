const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

const joinTimes = new Map();

module.exports = {
  name: 'voiceLog',
  async execute(client) {
    client.on('voiceStateUpdate', async (oldState, newState) => {
      const guild = newState.guild;
      if (!guild) return;

      const settings = await GuardSettings.findOne({ guildID: guild.id });
      if (!settings?.sesLog || !settings.logChannelID) return;

      const logChannel = guild.channels.cache.get(settings.logChannelID);
      if (!logChannel) return;

      const userTag = newState.member.user.tag;

      // Ses kanalına katılma
      if (!oldState.channelId && newState.channelId) {
        joinTimes.set(newState.id, Date.now());

        const embed = new EmbedBuilder()
          .setTitle(' Katıldı')
          .setColor('Green')
          .setDescription(`${userTag} ses kanalına katıldı.`)
          .addFields({ name: 'Kanal', value: `<#${newState.channelId}>` })
          .setTimestamp();

        return logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // Ses kanalından ayrılma
      if (oldState.channelId && !newState.channelId) {
        const joinTime = joinTimes.get(oldState.id);
        let duration = 'Bilinmiyor';

        if (joinTime) {
          const diff = Date.now() - joinTime;
          const seconds = Math.floor(diff / 1000) % 60;
          const minutes = Math.floor(diff / 1000 / 60);
          duration = `${minutes}dk ${seconds}sn`;
          joinTimes.delete(oldState.id);
        }

        const embed = new EmbedBuilder()
          .setTitle('🔇 Ayrıldı')
          .setColor('Red')
          .setDescription(`${userTag} ses kanalından ayrıldı.`)
          .addFields(
            { name: 'Kanal', value: `<#${oldState.channelId}>` },
            { name: 'Süre', value: duration }
          )
          .setTimestamp();

        return logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // Kanal değiştirme
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const joinTime = joinTimes.get(newState.id);
        let duration = 'Bilinmiyor';

        if (joinTime) {
          const diff = Date.now() - joinTime;
          const seconds = Math.floor(diff / 1000) % 60;
          const minutes = Math.floor(diff / 1000 / 60);
          duration = `${minutes}dk ${seconds}sn`;
        }

        joinTimes.set(newState.id, Date.now());

        const embed = new EmbedBuilder()
          .setTitle(' Kanal Değişti')
          .setColor('Blue')
          .setDescription(`${userTag} ses kanalını değiştirdi.`)
          .addFields(
            { name: 'Eski Kanal', value: `<#${oldState.channelId}>`, inline: true },
            { name: 'Yeni Kanal', value: `<#${newState.channelId}>`, inline: true },
            { name: 'Önceki Süre', value: duration }
          )
          .setTimestamp();

        return logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // Mute/unmute kontrolü
      if (oldState.serverMute !== newState.serverMute) {
        let executorTag = 'Bilinmiyor';
        try {
          const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 10 });
          const entry = logs.entries.find(
            e => e.target.id === newState.id &&
              e.changes.some(c => c.key === 'mute' || c.key === 'serverMute')
          );
          if (entry) executorTag = entry.executor.tag;
        } catch {}

        const embed = new EmbedBuilder()
          .setTitle(newState.serverMute ? '🔇 Susturuldu' : '🔊 Susturması Kaldırıldı')
          .setColor(newState.serverMute ? 'Red' : 'Green')
          .setDescription(`${userTag} ${newState.serverMute ? 'susturuldu' : 'susturması kaldırıldı'}.`)
          .addFields({ name: 'Yetkili', value: executorTag, inline: true })
          .setTimestamp();

        return logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // Deaf/undeaf kontrolü
      if (oldState.serverDeaf !== newState.serverDeaf) {
        let executorTag = 'Bilinmiyor';
        try {
          const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 10 });
          const entry = logs.entries.find(
            e => e.target.id === newState.id &&
              e.changes.some(c => c.key === 'deaf' || c.key === 'serverDeaf')
          );
          if (entry) executorTag = entry.executor.tag;
        } catch {}

        const embed = new EmbedBuilder()
          .setTitle(newState.serverDeaf ? 'Sağırlaştırıldı' : 'Sağırlaştırması Kaldırıldı')
          .setColor(newState.serverDeaf ? 'Red' : 'Green')
          .setDescription(`${userTag} ${newState.serverDeaf ? 'sağırlaştırıldı' : 'sağırlaştırması kaldırıldı'}.`)
          .addFields({ name: 'Yetkili', value: executorTag, inline: true })
          .setTimestamp();

        return logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    });
  }
};
