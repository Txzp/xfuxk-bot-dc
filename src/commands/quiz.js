module.exports = {
  name: 'quiz',
  description: 'Ask the user a quick question',
  async execute(message) {
    const question = 'What is the capital of France?\nA) Rome\nB) Madrid\nC) Paris\nD) Berlin';
    await message.channel.send(question);
    const filter = m => m.author.id === message.author.id;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 20000 });
    if (!collected.size) return message.channel.send('Tiempo agotado.');
    const ans = collected.first().content.trim().toLowerCase();
    if (ans.startsWith('c') || ans.includes('par')) return message.channel.send('Correcto! 🎉');
    message.channel.send('Incorrect. The answer was C) Paris.');
  }
  ,
  data: { name: 'quiz', description: 'Ask the user a quick question' },
  async executeInteraction(interaction) {
    try {
      const question = 'What is the capital of France?\nA) Rome\nB) Madrid\nC) Paris\nD) Berlin';
      await interaction.reply({ content: question });
      const filter = m => m.author.id === interaction.user.id;
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 20000 });
      if (!collected.size) return interaction.followUp('Tiempo agotado.');
      const ans = collected.first().content.trim().toLowerCase();
      if (ans.startsWith('c') || ans.includes('par')) return interaction.followUp('Correcto! 🎉');
      interaction.followUp('Incorrect. The answer was C) Paris.');
    } catch (err) {
      console.error('Quiz interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error running the quiz.', ephemeral: true });
    }
  }
};
