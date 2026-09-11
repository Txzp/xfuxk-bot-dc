module.exports = {
  name: 'embed',
  description: 'Create a simple embed: !embed <title> | <description>',
  async execute(message, args, rawArgs) {
    const rawInput = typeof rawArgs === 'string' && rawArgs.length ? rawArgs : args.join(' ');
    const raw = rawInput.split('|');
    const title = raw[0] ? raw[0].trim() : 'Title';
    const desc = raw[1] ? raw[1].trim() : 'Description';
    const embed = {
      title,
      description: desc,
      color: 0x00AE86
    };
    message.channel.send({ embeds: [embed] });
  }
  ,
  data: { name: 'embed', description: 'Create a simple embed', options: [ { name: 'title', description: 'Title', type: 3, required: true }, { name: 'description', description: 'Description', type: 3, required: true } ] },
  async executeInteraction(interaction) {
    try {
      const title = interaction.options.getString('title');
      const desc = interaction.options.getString('description');
      const embed = { title, description: desc, color: 0x00AE86 };
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Embed interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error creating the embed.', ephemeral: true });
    }
  }
};
