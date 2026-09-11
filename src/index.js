require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd && cmd.name) client.commands.set(cmd.name, cmd);
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (typeof event === 'function') event(client);
  }
}

const PREFIX = process.env.PREFIX || '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  // Preserve the raw content after the prefix without trimming
  const contentWithoutPrefixRaw = message.content.slice(PREFIX.length);
  if (!contentWithoutPrefixRaw) return;

  // Trim start only to reliably extract the command name, but keep the raw string for args
  const contentWithoutPrefix = contentWithoutPrefixRaw.trimStart();
  const commandName = contentWithoutPrefix.split(/\s+/)[0].toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  // Find the commandName position in the raw content to preserve exact following text (including spaces)
  const idx = contentWithoutPrefixRaw.indexOf(commandName);
  const rawArgs = idx >= 0 ? contentWithoutPrefixRaw.slice(idx + commandName.length) : '';
  const args = rawArgs.length ? rawArgs.split(/\s+/) : [];

  try {
    await command.execute(message, args, rawArgs, client);
  } catch (err) {
    console.error(err);
    message.reply('Ocurrió un error ejecutando el comando.');
  }
});

client.login(process.env.TOKEN).catch(err => {
  console.error('Fallo al iniciar sesión. Revisa tu TOKEN en .env', err);
});
