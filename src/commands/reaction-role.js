module.exports = {
  name: 'reactionrole',
  description: 'Create a reaction role message: !reactionrole <emoji> @role',
  async execute(message, args, client) {
    if (!message.member.permissions.has('MANAGE_ROLES')) return message.reply('You do not have permission to manage roles.');
    const emoji = args[0];
    const role = message.mentions.roles.first();
    if (!emoji || !role) return message.reply('Uso: !reactionrole <emoji> @role');
    const sent = await message.channel.send(`Reacciona con ${emoji} para obtener el rol ${role.name}`);
    try {
      await sent.react(emoji);
    } catch (err) {
      return message.reply('I could not react with that emoji.');
    }

    const filter = (reaction, user) => reaction.emoji.name === (emoji.replace(/\uFE0F/g, ''));
    const collector = sent.createReactionCollector({ filter, dispose: true });
    collector.on('collect', async (reaction, user) => {
      const member = message.guild.members.cache.get(user.id);
      if (member) await member.roles.add(role).catch(() => {});
    });
    collector.on('remove', async (reaction, user) => {
      const member = message.guild.members.cache.get(user.id);
      if (member) await member.roles.remove(role).catch(() => {});
    });
  }
  ,
  data: { name: 'reactionrole', description: 'Create a reaction role message', options: [ { name: 'emoji', description: 'Emoji to use', type: 3, required: true }, { name: 'role', description: 'Role to assign', type: 8, required: true } ] },
  async executeInteraction(interaction) {
    try {
      if (!interaction.member.permissions.has('MANAGE_ROLES')) return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
      const emoji = interaction.options.getString('emoji');
      const role = interaction.options.getRole('role');
      if (!emoji || !role) return interaction.reply({ content: 'Uso: /reactionrole <emoji> <role>', ephemeral: true });
      const sent = await interaction.channel.send({ content: `Reacciona con ${emoji} para obtener el rol ${role.name}` });
      try { await sent.react(emoji); } catch (err) { return interaction.reply({ content: 'I could not react with that emoji.', ephemeral: true }); }

      await interaction.reply({ content: 'Mensaje de reaction role creado.', ephemeral: true });

      const filter = (reaction, user) => reaction.emoji.name === (emoji.replace(/\uFE0F/g, '')) && !user.bot;
      const collector = sent.createReactionCollector({ filter, dispose: true });
      collector.on('collect', async (reaction, user) => {
        const member = interaction.guild.members.cache.get(user.id);
        if (member) await member.roles.add(role).catch(() => {});
      });
      collector.on('remove', async (reaction, user) => {
        const member = interaction.guild.members.cache.get(user.id);
        if (member) await member.roles.remove(role).catch(() => {});
      });
    } catch (err) {
      console.error('ReactionRole interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error creating the reaction role.', ephemeral: true });
    }
  }
};
