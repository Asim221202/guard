const { EmbedBuilder, AuditLogEvent, PermissionsBitField } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  name: 'roleGuard',
  async execute(client) {
    client.on('roleUpdate', async (oldRole, newRole) => {
      const guild = newRole.guild;
      if (!guild) return;

      const settings = await GuardSettings.findOne({ guildID: guild.id });
      if (!settings?.rolKoruma || !settings.logChannelID) return;

      const logChannel = guild.channels.cache.get(settings.logChannelID);
      if (!logChannel) return;

      // İzin değişikliklerini bulalım
      const oldPerms = new PermissionsBitField(oldRole.permissions.bitfield);
      const newPerms = new PermissionsBitField(newRole.permissions.bitfield);

      // Tüm izinleri kontrol et
      const allPerms = Object.keys(PermissionsBitField.Flags);
      let changes = [];

      for (const perm of allPerms) {
        const oldHas = oldPerms.has(PermissionsBitField.Flags[perm]);
        const newHas = newPerms.has(PermissionsBitField.Flags[perm]);
        if (oldHas !== newHas) {
          changes.push(`${perm}: ${oldHas ? 'KAPALI ➡️ AÇIK' : 'AÇIK ➡️ KAPALI'}`);
        }
      }

      if (changes.length === 0) return; // İzin değişikliği yoksa çık

      // Audit logdan yetkiliyi bul
      let executorTag = 'Bilinmiyor';
      try {
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 5 });
        const entry = logs.entries.find(e => e.target.id === newRole.id);
        if (entry) executorTag = entry.executor.tag;
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Rol İzinleri Güncellendi')
        .setColor('Orange')
        .setDescription(`**${newRole.name}** rolündeki izin değişiklikleri:`)
        .addFields(
          { name: 'Yetkili', value: executorTag, inline: true },
          { name: 'Rol ID', value: newRole.id, inline: true },
          { name: `Değişen İzinler (${changes.length})`, value: changes.join('\n').slice(0, 1024) }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(() => {});
    });
  }
};
