module.exports = {
  name: 'ping',
  description: 'Responde con pong y latencia',
  async execute(message) {
    const sent = await message.channel.send('Pinging...');
    sent.edit(`Pong! Latencia: ${sent.createdTimestamp - message.createdTimestamp}ms`);
  }
  ,
  data: { name: 'ping', description: 'Check the bot latency', default_member_permissions: '16' },
  async executeInteraction(interaction) {
    try {
      const apiPing = Math.round(interaction.client.ws.ping);
      const latency = Date.now() - interaction.createdTimestamp;
      await interaction.reply({ content: `Pong! API: ${apiPing}ms | Interaction: ${latency}ms`, ephemeral: true });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 7500);
    } catch (err) {
      console.error('Ping interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error obteniendo latencia.', ephemeral: true });
    }
  }
};
