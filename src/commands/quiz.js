module.exports = {
  name: 'quiz',
  description: 'Pregunta rápida al usuario',
  async execute(message) {
    const question = '¿Cuál es la capital de Francia?\nA) Roma\nB) Madrid\nC) París\nD) Berlín';
    await message.channel.send(question);
    const filter = m => m.author.id === message.author.id;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 20000 });
    if (!collected.size) return message.channel.send('Tiempo agotado.');
    const ans = collected.first().content.trim().toLowerCase();
    if (ans.startsWith('c') || ans.includes('par')) return message.channel.send('Correcto! 🎉');
    message.channel.send('Incorrecto. La respuesta era C) París');
  }
  ,
  data: { name: 'quiz', description: 'Pregunta rápida al usuario' },
  async executeInteraction(interaction) {
    try {
      const question = '¿Cuál es la capital de Francia?\nA) Roma\nB) Madrid\nC) París\nD) Berlín';
      await interaction.reply({ content: question });
      const filter = m => m.author.id === interaction.user.id;
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 20000 });
      if (!collected.size) return interaction.followUp('Tiempo agotado.');
      const ans = collected.first().content.trim().toLowerCase();
      if (ans.startsWith('c') || ans.includes('par')) return interaction.followUp('Correcto! 🎉');
      interaction.followUp('Incorrecto. La respuesta era C) París');
    } catch (err) {
      console.error('Quiz interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error ejecutando quiz.', ephemeral: true });
    }
  }
};
