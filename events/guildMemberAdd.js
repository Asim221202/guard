const { AuditLogEvent } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');
const isSafe = require('../utils/isSafe');
const sendGuardLog = require('../utils/sendGuardLog');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;
    if (!guild || !member.user.bot) return;

    const settings = await GuardSettings.findOne({ guildID: guild.id });
    if (!settings?.botKoruma || !settings.logChannelID) return;

    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      const { executor, target } = entry;
      if (!executor || target.id !== member.id) return;

      const safe = await isSafe(guild, executor.id, settings);

      if (!safe) {
        // Botu banla
        try {
          await member.ban({ reason: 'Bot koruma: izinsiz bot eklendi' });
        } catch (err) {
          console.error('[GUARD] Bot banlanamadı:', err);
        }

        await sendGuardLog(guild, settings, {
          title: '🚨 İzinsiz Bot Eklendi',
          description: `Sunucuya izinsiz bir bot eklendi ve otomatik olarak banlandı.`,
          fields: [
            { name: 'Ekleyen Kişi', value: `${executor.tag} (${executor.id})` },
            { name: 'Bot', value: `${member.user.tag} (${member.id})` }
          ],
          color: 0xe74c3c
        });
      } else {
        await sendGuardLog(guild, settings, {
          title: '⚠️ Bot Eklendi (Whitelist)',
          description: `${executor.tag} adlı kişi whitelist'te olduğu için eklenen bot korunmadı.`,
          fields: [
            { name: 'Eklenen Bot', value: `${member.user.tag} (${member.id})` }
          ],
          color: 0xf1c40f
        });
      }
    } catch (err) {
      console.error('[GUARD] guildMemberAdd bot koruma hatası:', err);
    }
  }
};
