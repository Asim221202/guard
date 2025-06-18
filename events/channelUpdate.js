// events/channelUpdate.js

const GuardSettings = require('../models/GuardSettings');
const sendGuardLog = require('../utils/sendGuardLog');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel, client) {
    const guild = newChannel.guild;
    if (!guild) return;

    const settings = await GuardSettings.findOne({ guildID: guild.id });
    if (!settings?.kanalKoruma || !settings.logChannelID) return;

    // Yer (position) veya kategori (parent) değişti mi?
    const categoryChanged = oldChannel.parentId !== newChannel.parentId;
    const positionChanged = oldChannel.position !== newChannel.position;

    if (!categoryChanged && !positionChanged) return;

    const changes = [];

    if (categoryChanged) {
      changes.push(`📂 Kategori: **${oldChannel.parent?.name || 'Yok'}** → **${newChannel.parent?.name || 'Yok'}**`);
    }

    if (positionChanged) {
      changes.push(`📌 Sıra Değişimi: ${oldChannel.position} → ${newChannel.position}`);
    }

    await sendGuardLog(guild, settings, {
      title: '🔄 Kanal Konumu Değiştirildi',
      description: `${newChannel.name} kanalının yeri değiştirildi.`,
      fields: [
        { name: 'Değişiklikler', value: changes.join('\n') }
      ],
      color: 0x3498db
    });
  }
};
