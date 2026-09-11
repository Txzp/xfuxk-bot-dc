module.exports = {
  name: 'lock',
  description: 'Lock the current channel for @everyone',
  async execute(message) {
    if (!message.member.permissions.has('MANAGE_CHANNELS')) return message.reply('You do not have permission to manage channels.');
    const channel = message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    message.channel.send('Channel locked.');
  }
  ,
  data: { name: 'lock', description: 'Lock the current channel for @everyone', default_member_permissions: '16' },
  async executeInteraction(interaction) {
    try {
      if (!interaction.member.permissions.has('MANAGE_CHANNELS')) return interaction.reply({ content: 'You do not have permission to manage channels.', ephemeral: true });
      const channel = interaction.channel;
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ content: 'Channel locked.', ephemeral: false });
    } catch (err) {
      console.error('Lock interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error locking the channel.', ephemeral: true });
    }
  }
};
