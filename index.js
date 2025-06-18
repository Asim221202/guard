// index.js

require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { REST, Routes } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Komutları topla
client.commands = new Collection();
const commands = [];

const commandFiles = readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

// Slash komutları deploy et
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Slash komutları güncelleniyor...');

    // GUILD_ID varsa sadece oraya yükle (hızlı yükleme)
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('✅ Slash komutları (guild) yüklendi!');
    } else {
      // Global yükleme (yayınlamak için)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Slash komutları (global) yüklendi!');
    }
  } catch (error) {
    console.error('❌ Slash komut yüklemesi hatası:', error);
  }
})();

// Events
const eventFiles = readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.name && event.execute) {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Interaction Handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Komutu çalıştırırken hata oluştu.', ephemeral: true });
  }
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB bağlantısı kuruldu!');
  client.login(process.env.TOKEN);
}).catch(err => {
  console.error('❌ Mongo bağlantı hatası:', err);
});
