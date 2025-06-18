const { AuditLogEvent } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');
const isSafe = require('../utils/isSafe');
const sendGuardLog = require('../utils/sendGuardLog');

module.exports = {
  name: 'roleDelete',
  async execute(role, client) {
    const guild = role.guild;
    if (!guild) return;

    const settings = await GuardSettings.findOne({ guildID: guild.id });
    if (!settings?.rolKoruma || !settings.logChannelID) return;

    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      const { executor, target } = entry;
      if (!executor || executor.id === client.user.id || target.id !== role.id) return;

      const safe = await isSafe(guild, executor.id, settings);

      if (!safe) {
        try {
          await guild.members.ban(executor.id, {
            reason: 'Rol koruma: izinsiz rol silme'
          });
        } catch (err) {
          console.error('[GUARD] Rol silen kişiyi banlayamadım:', err);
        }

        await sendGuardLog(guild, settings, {
          title: '🚨 Rol Silindi - Banlandı',
          description: `${executor.tag} adlı kişi izinsiz bir rol sildiği için banlandı.`,
          fields: [
            { name: 'Silinen Rol', value: `${role.name} (${role.id})` },
            { name: 'Silen Kişi', value: `${executor.tag} (${executor.id})` }
          ],
          color: 0xff0000
        });
      } else {
        await sendGuardLog(guild, settings, {
          title: '⚠️ Rol Silindi (Whitelist)',
          description: `${executor.tag} adlı kişi bir rol sildi, ancak whitelist'te olduğu için işlem yapılmadı.`,
          fields: [
            { name: 'Silinen Rol', value: `${role.name} (${role.id})` }
          ],
          color: 0xf1c40f
        });
      }

    } catch (err) {
      console.error('[GUARD] roleDelete log hatası:', err);
    }
  }
};
