require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.argv[2] || process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('Falta TOKEN o CLIENT_ID en .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, '..', 'src', 'commands');
if (fs.existsSync(commandsPath)) {
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));
    // If the command exports a full `data` object (pre-built command definition), use it.
    if (cmd && cmd.data) {
      commands.push(cmd.data);
      continue;
    }
    if (cmd && cmd.name && cmd.description) {
      const entry = { name: cmd.name, description: cmd.description };
      if (cmd.options) entry.options = cmd.options; // allow commands to export options array
      commands.push(entry);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    if (guildId) {
      console.log('Registrando comandos en guild', guildId);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    } else {
      console.log('Registrando comandos globales (puede tardar hasta una hora)');
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
    }
    console.log('Comandos registrados correctamente.');
  } catch (err) {
    console.error('Error registrando comandos', err);
  }
})();
