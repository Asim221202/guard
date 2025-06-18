// events/channelDelete.js

const { AuditLogEvent } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');
const isSafe = require('../utils/isSafe');
const sendGuardLog = require('../utils/sendGuardLog');

module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    const guild = channel.guild;
    if (!guild) return;

    const settings = await GuardSettings.findOne({ guildID: guild.id });
    if (!settings || !settings.kanalKoruma) return;
    if (!settings.logChannelID) return; // Log kanalı ayarlı değilse işlem yapma

    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1
      });

      const deletionLog = fetchedLogs.entries.first();
      if (!deletionLog) return;

      const { executor } = deletionLog;

      if (await isSafe(guild, executor.id, settings)) {
        // Ban atma ama log at
        await sendGuardLog(guild, settings, {
          title: '⚠️ Kanal Silindi',
          description: `${executor.tag} (${executor.id}) tarafından kanal silindi.`,
          fields: [
            { name: 'Silinen Kanal', value: `${channel.name} (${channel.id})`, inline: false }
          ],
          color: 0xFFA500
        });
        return;
      }

      // Güvenli değil, banla
      try {
        await guild.members.ban(executor.id, {
          reason: `Kanal koruma: ${channel.name} silindi`
        });
      } catch (err) {
        console.error('[GUARD] Ban atılamadı:', err);
      }

      // Ban logu at
      await sendGuardLog(guild, settings, {
        title: '🚨 Kanal Koruma - Banlandı',
        description: `Bir kanal silindi ve silen kişi banlandı!`,
        fields: [
          { name: 'Silinen Kanal', value: `${channel.name} (${channel.id})`, inline: false },
          { name: 'Silen Kişi', value: `${executor.tag} (${executor.id})`, inline: false }
        ],
        color: 0xFF0000
      });

    } catch (err) {
      console.error('[GUARD] Kanal silme log okunamadı:', err);
    }
  }
};
