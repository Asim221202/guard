const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guard-ayarlar')
    .setDescription('Sunucunun koruma sistemleri ayarlarını gösterir.'),
  
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: 'Bu komutu kullanmak için Yönetici olmalısın.', ephemeral: false });
    }

    const settings = await GuardSettings.findOne({ guildID: interaction.guild.id });
    if (!settings) {
      return interaction.reply({ content: 'Bu sunucuda koruma ayarları bulunamadı.', ephemeral: false });
    }

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Guard Ayarları')
      .setColor('Blue')
      .addFields(
        { name: 'Kanal Koruma', value: settings.kanalKoruma ? 'Açık' : 'Kapalı', inline: true },
        { name: 'Rol Koruma', value: settings.rolKoruma ? 'Açık' : 'Kapalı', inline: true },
        { name: 'Ban Koruma', value: settings.banKoruma ? 'Açık' : 'Kapalı', inline: true },
        { name: 'Sunucu Koruma', value: settings.sunucuKoruma ? 'Açık' : 'Kapalı', inline: true },
        { name: 'Mesaj Log', value: settings.mesajLog ? 'Açık' : 'Kapalı', inline: true },
        { name: 'Ses Log', value: settings.sesLog ? 'Açık' : 'Kapalı', inline: true },
        { name: 'Whitelist', value: settings.whitelist.length > 0 ? settings.whitelist.map(id => `<@${id}>`).join(', ') : 'Yok', inline: false },
        { name: 'Log Kanalı', value: settings.logChannelID ? `<#${settings.logChannelID}>` : 'Ayarlanmadı', inline: false },
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
