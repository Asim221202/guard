const { AuditLogEvent } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');
const isSafe = require('../utils/isSafe');
const sendGuardLog = require('../utils/sendGuardLog');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild, client) {
    const guild = newGuild;
    if (!guild) return;

    const settings = await GuardSettings.findOne({ guildID: guild.id });
    if (!settings?.sunucuKoruma || !settings.logChannelID) return;

    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      const { executor } = entry;
      if (!executor || executor.id === client.user.id) return;

      const safe = await isSafe(guild, executor.id, settings);

      const changes = [];

      if (oldGuild.name !== newGuild.name)
        changes.push(`📛 İsim: **${oldGuild.name}** → **${newGuild.name}**`);

      if (oldGuild.icon !== newGuild.icon)
        changes.push(`🖼️ Sunucu iconu değiştirildi.`);

      if (oldGuild.banner !== newGuild.banner)
        changes.push(`🌄 Banner değiştirildi.`);

      if (oldGuild.systemChannelId !== newGuild.systemChannelId)
        changes.push(`📢 Sistem kanalı değiştirildi.`);

      if (changes.length === 0) return;

      if (!safe) {
        try {
          await guild.members.ban(executor.id, {
            reason: 'Sunucu koruma: izinsiz ayar değişikliği'
          });
        } catch (err) {
          console.error('[GUARD] Guild update ban hatası:', err);
        }

        return sendGuardLog(guild, settings, {
          title: '🚨 Sunucu Ayarları Değiştirildi - Banlandı',
          description: `${executor.tag} adlı kişi sunucu ayarlarını değiştirdiği için banlandı.`,
          fields: [{ name: 'Değişiklikler', value: changes.join('\n') }],
          color: 0xff0000
        });
      } else {
        return sendGuardLog(guild, settings, {
          title: '⚠️ Sunucu Ayarları Değiştirildi (Whitelist)',
          description: `${executor.tag} adlı kişi sunucu ayarlarını değiştirdi.`,
          fields: [{ name: 'Değişiklikler', value: changes.join('\n') }],
          color: 0xf1c40f
        });
      }
    } catch (err) {
      console.error('[GUARD] guildUpdate log hatası:', err);
    }
  }
};
