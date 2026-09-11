const cmd = require('./src/commands/builder-message.js');

const tests = [
  {
    name: 'Rules style multiline with bullets',
    rawArgs: `Xzebroker — Server Rules | 📜 **Xzebroker — Server Rules**

👋 ***Welcome to Xzebroker.***
Please take a moment to read these rules before participating in the community.

🤝 ***1. Respect everyone***
Treat members, developers, staff, and creators with respect.
Harassment, hate speech, threats, discrimination, and excessive toxicity are not allowed.

🚫 ***2. No spam or abuse***
Do not spam messages, mentions, emojis, reactions, or channels.
Do not intentionally disrupt conversations or abuse server features.

📁 ***3. Use the correct channels***
Keep conversations in their appropriate channels and follow the purpose of each channel.

🐛 ***4. Report bugs correctly***
Found something broken? Report it in <#1529557416004288542> instead of flooding other channels with bug reports.

🎫 ***5. Need help?***
For support, questions, or issues that require staff attention, create a ticket in <#1536241118004288542>.

💳 ***6. No free credits or random rewards***
Do not ask staff for free credits, premium access, roles, or special benefits.
Credits and rewards are not handed out randomly.

🛡️ ***7. No malicious content***
Malware, scams, phishing, malicious files, harmful links, or attempts to compromise other users or services are strictly prohibited.

👤 ***8. No impersonation***
Do not impersonate Xzebroker staff, developers, moderators, Discord staff, or other members.

📜 ***9. Discord Terms apply***
By participating in Xzebroker, you are expected to follow Discord's Terms of Service and Community Guidelines, along with applicable laws and regulations.

⚖️ ***10. Staff decisions***
Staff may take action when necessary to protect the community.
Attempts to bypass moderation actions or repeatedly exploit loopholes may result in further action.

🔒 ***By remaining in this server, you agree to follow these rules.***
Keep Xzebroker organized, respectful, and useful for everyone.`
  },
  {
    name: 'Markdown and bullets with single-line bullets',
    rawArgs: 'Title | ***bold italic***\n**bold**\n*italic*\n\n• first bullet\n• second bullet\n\nMention <#1529557416004288542> in text.'
  }
];

const fakeMessage = {
  channel: {
    send: (payload) => {
      console.log('SEND PAYLOAD:');
      console.log(JSON.stringify(payload, null, 2));
    }
  }
};

const fakeInteraction = (content) => ({
  options: {
    getString: (name) => (name === 'title' ? 'Title' : content)
  },
  reply: async (payload) => {
    console.log('REPLY PAYLOAD:');
    console.log(JSON.stringify(payload, null, 2));
  }
});

(async () => {
  for (const test of tests) {
    console.log('===', test.name, '===');
    await cmd.execute(fakeMessage, [], test.rawArgs);
  }

  console.log('=== slash interaction test ===');
  await cmd.executeInteraction(fakeInteraction(tests[1].rawArgs));
})();
