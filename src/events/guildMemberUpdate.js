const BOOSTER_ROLE_ID = '1548062133152129044';

module.exports = (client) => {
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (!oldMember.premiumSince && newMember.premiumSince) {
      const boosterRole = newMember.guild.roles.cache.get(BOOSTER_ROLE_ID);
      if (boosterRole) {
        await newMember.roles.add(boosterRole).catch(error => {
          console.error('Could not assign the Booster role:', error);
        });
      }
    }
  });
};
