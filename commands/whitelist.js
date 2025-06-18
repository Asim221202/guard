// commands/whitelist.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuardSettings = require('../models/GuardSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Whitelist sistemini yönet.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('ekle')
        .setDescription('Bir kullanıcıyı whitelist\'e ekler')
        .addUserOption(opt =>
          opt.setName('kullanıcı')
            .setDescription('Whitelist eklenecek kullanıcı')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('kaldır')
        .setDescription('Bir kullanıcıyı whitelist\'ten çıkarır')
        .addUserOption(opt =>
          opt.setName('kullanıcı')
            .setDescription('Whitelist çıkarılacak kullanıcı')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Whitelist\'teki kullanıcıları listeler')
    ),

  async execute(interaction) {
    const guildID = interaction.guild.id;
    let settings = await GuardSettings.findOne({ guildID });
    if (!settings) {
      settings = new GuardSettings({ guildID });
    }

    const sub = interaction.options.getSubcommand();

    // ✅ Kullanıcı Ekle
    if (sub === 'ekle') {
      const user = interaction.options.getUser('kullanıcı');
      if (settings.whitelist.includes(user.id)) {
        return interaction.reply({ content: `❗ ${user.tag} zaten whitelist'te.`, ephemeral: true });
      }

      settings.whitelist.push(user.id);
      await settings.save();
      return interaction.reply({ content: `✅ ${user.tag} başarıyla whitelist'e eklendi.`, ephemeral: true });
    }

    // ❌ Kullanıcı Kaldır
    if (sub === 'kaldır') {
      const user = interaction.options.getUser('kullanıcı');
      if (!settings.whitelist.includes(user.id)) {
        return interaction.reply({ content: `❗ ${user.tag} whitelist'te değil.`, ephemeral: true });
      }

      settings.whitelist = settings.whitelist.filter(id => id !== user.id);
      await settings.save();
      return interaction.reply({ content: `🗑️ ${user.tag} whitelist'ten kaldırıldı.`, ephemeral: true });
    }

    // 📋 Listele
    if (sub === 'liste') {
      if (settings.whitelist.length === 0) {
        return interaction.reply({ content: `📭 Whitelist boş.`, ephemeral: true });
      }

      const list = settings.whitelist
        .map(id => `<@${id}> \`(${id})\``)
        .join('\n');

      return interaction.reply({
        content: `📜 Whitelist Listesi:\n${list}`,
        ephemeral: false
      });
    }
  }
};
