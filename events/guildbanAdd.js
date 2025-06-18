// events/guildBanAdd.js

const { AuditLogEvent } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');
const isSafe = require('../utils/isSafe');
const sendGuardLog = require('../utils/sendGuardLog');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const guild = ban.guild;
    const user = ban.user;
    if (!guild) return;

    const settings = await GuardSettings.findOne({ guildID: guild.id });
    if (!settings?.banKoruma || !settings.logChannelID) return;

    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanAdd,
        limit: 1
      });

      const banLog = fetchedLogs.entries.first();
      if (!banLog) return;

      const { executor, target } = banLog;
      if (!executor || executor.id === client.user.id || target.id !== user.id) return;

      const isExecutorSafe = await isSafe(guild, executor.id, settings);

      if (isExecutorSafe) {
        return sendGuardLog(guild, settings, {
          title: '⚠️ Ban Atıldı (Whitelist)',
          description: `${executor.tag} adlı kişi ${user.tag} kullanıcısını banladı, ancak whitelist'te olduğu için işlem yapılmadı.`,
          color: 0xFFA500
        });
      }

      try {
        await guild.members.ban(executor.id, {
          reason: `Ban koruma: izinsiz ban atma`
        });
      } catch (err) {
        console.error('[GUARD] Ban atan kişiyi banlayamadım:', err);
      }

      await sendGuardLog(guild, settings, {
        title: '🚨 Ban Koruma - Banlandı',
        description: `${executor.tag} adlı kişi izinsiz ban attığı için banlandı.`,
        fields: [
          { name: 'Banlanan Kullanıcı', value: `${user.tag} (${user.id})`, inline: false },
          { name: 'Banlayan Kişi', value: `${executor.tag} (${executor.id})`, inline: false }
        ],
        color: 0xFF0000
      });

    } catch (err) {
      console.error('[GUARD] guildBanAdd log hatası:', err);
    }
  }
};
