function normalizeBuilderText(text) {
  // Per user requirements: do not modify the content in any way.
  return text;
}

module.exports = {
  name: 'builder-message',
  description: 'Create a custom message for your channel',
  options: [
    { name: 'title', description: 'Message title', type: 3, required: true },
    { name: 'description', description: 'Message description', type: 3, required: true },
    { name: 'color', description: 'Hex color without #', type: 3, required: false }
  ],
  async execute(message, args, rawArgs) {
    // Prefer rawArgs exactly as provided. Do not trim or alter description.
    const rawInput = typeof rawArgs === 'string' ? rawArgs : args.join(' ');
    const raw = rawInput.split('|');
    const title = raw[0] ? raw[0] : 'Builder Message';
    const desc = raw[1] !== undefined ? normalizeBuilderText(raw[1]) : '';

    // Build final content: preserve exact user formatting; do not trim
    const titleLine = title ? `**${title}**\n\n` : '';
    const finalContent = `${titleLine}${desc}`;

    // Verification log required by user: show JSON stringified description before sending
    console.log('[builder-message] description JSON:', JSON.stringify(desc));
    console.log('[builder-message] finalContent JSON:', JSON.stringify(finalContent));

    // Send as a normal message with explicit content property
    const sent = await message.channel.send({ content: finalContent });
    try {
      console.log('[builder-message] sent.channel.message.content:', sent && sent.content);
      console.log('[builder-message] sent.channel.message.embeds.length:', sent && sent.embeds && sent.embeds.length);
    } catch (e) {
      console.warn('[builder-message] could not inspect sent message object:', e && e.message);
    }
  },
  data: {
    name: 'builder-message',
    description: 'Create a custom message for your channel',
    options: [
      { name: 'title', description: 'Message title', type: 3, required: true },
      { name: 'description', description: 'Message description', type: 3, required: true },
      { name: 'color', description: 'Hex color without #', type: 3, required: false }
    ]
  },
  async executeInteraction(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const title = interaction.options.getString('title');
      const desc = interaction.options.getString('description');

      // Do not modify description; log JSON string for verification
      console.log('[builder-message] description JSON (slash):', JSON.stringify(desc));

      const titleLine = title ? `**${title}**\n\n` : '';
      const finalContent = `${titleLine}${desc}`;
      console.log('[builder-message] finalContent JSON (slash):', JSON.stringify(finalContent));

      // Send as plain channel message, but guard if interaction.channel is unavailable (tests/DMs)
      let sent;
      if (interaction.channel && typeof interaction.channel.send === 'function') {
        sent = await interaction.channel.send({ content: finalContent });
        try {
          console.log('[builder-message] sent.channel.message.content:', sent && sent.content);
          console.log('[builder-message] sent.channel.message.embeds.length:', sent && sent.embeds && sent.embeds.length);
        } catch (e) {
          console.warn('[builder-message] could not inspect sent channel message:', e && e.message);
        }
      } else {
        throw new Error('The interaction channel is unavailable.');
      }

      await interaction.deleteReply();
    } catch (err) {
      console.error('BuilderMessage interaction error', err);
      if (interaction.deferred && !interaction.replied) await interaction.editReply('There was an error creating the message.');
      else if (!interaction.replied) await interaction.reply({ content: 'There was an error creating the message.', ephemeral: true });
    }
  }
};
