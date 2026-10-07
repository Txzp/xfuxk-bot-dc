module.exports = {
  name: 'invite',
  description: 'Create a permanent invite for this channel',
  data: {
    name: 'invite',
    description: 'Create a permanent invite for this channel'
  },
  async executeInteraction(interaction) {
    try {
      if (!interaction.guild || !interaction.channel?.isTextBased()) {
        return interaction.reply({ content: 'This command can only be used in a server text channel.', ephemeral: true });
      }

      const invite = await interaction.channel.createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: true,
        reason: `Invite created by ${interaction.user.tag}`
      });

      await interaction.reply({ content: `Permanent invite: ${invite.url}`, ephemeral: true });
    } catch (error) {
      console.error('Could not create invite:', error);
      const response = 'I could not create an invite. Check that I have the Create Invite permission in this channel.';
      if (interaction.replied || interaction.deferred) await interaction.editReply(response);
      else await interaction.reply({ content: response, ephemeral: true });
    }
  }
};
