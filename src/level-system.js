const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'levels.json');
const MAX_LEVEL = 50;
const XP_PER_MESSAGE = 0.5;
const BASE_XP_PER_LEVEL = 100;
const XP_GROWTH_RATE = 1.2;
const LEVEL_ROLE_PREFIX = 'Level ';
const SEPARATOR_ROLE_NAME = '----------';

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

let data = loadData();

function saveData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getGuildData(guildId) {
  if (!data[guildId]) data[guildId] = {};
  return data[guildId];
}

function getLevel(xp) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= getXpRequiredForLevel(level + 1)) level += 1;
  return level;
}

function getXpForNextLevel(level) {
  return level >= MAX_LEVEL ? null : getXpRequiredForLevel(level + 1);
}

function getXpRequiredForLevel(level) {
  if (level <= 1) return 0;
  let total = 0;
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    total += BASE_XP_PER_LEVEL * (XP_GROWTH_RATE ** (currentLevel - 1));
  }
  return total;
}

const LEVEL_COLORS = [
  0x95a5a6, 0x7f8c8d, 0x3498db, 0x2980b9, 0x1abc9c, 0x16a085, 0x2ecc71, 0x27ae60,
  0xf1c40f, 0xf39c12, 0xe67e22, 0xd35400, 0xe74c3c, 0xc0392b, 0x9b59b6, 0x8e44ad,
  0x34495e, 0x2c3e50, 0x00bcd4, 0x0097a7, 0xff6f61, 0xff4757, 0x5f27cd, 0x341f97,
  0x00d2d3, 0x01a3a4, 0xff9f43, 0xee5253, 0x10ac84, 0x222f3e, 0x54a0ff, 0x2e86de,
  0x48dbfb, 0x0abde3, 0x1dd1a1, 0x10ac84, 0xffd32a, 0xff9f43, 0xff6b6b, 0xee5253,
  0xc8d6e5, 0x8395a7, 0x576574, 0x222f3e, 0x5f27cd, 0x341f97, 0x00d2d3, 0x01a3a4,
  0xfeca57, 0xff9f43
];

async function ensureLevelRoles(guild) {
  const roles = [];
  let separator = guild.roles.cache.find(role => role.name === SEPARATOR_ROLE_NAME);
  if (!separator) {
    separator = await guild.roles.create({
      name: SEPARATOR_ROLE_NAME,
      colors: { primaryColor: 0x2b2d31 },
      reason: 'Level system separator role'
    });
  }

  for (let level = 1; level <= MAX_LEVEL; level += 1) {
    let role = guild.roles.cache.find(item => item.name === `${LEVEL_ROLE_PREFIX}${level}`);
    if (!role) {
      role = await guild.roles.create({
        name: `${LEVEL_ROLE_PREFIX}${level}`,
        colors: { primaryColor: LEVEL_COLORS[level - 1] },
        reason: 'Level system role'
      });
    } else {
      await role.edit({ colors: { primaryColor: LEVEL_COLORS[level - 1] } }).catch(() => {});
    }
    roles.push(role);
  }

  const highestLevelRole = roles[roles.length - 1];
  if (highestLevelRole && separator.position <= highestLevelRole.position) {
    await separator.setPosition(highestLevelRole.position + 1).catch(() => {});
  }
  return roles;
}

async function applyLevelRole(member, level, roles) {
  const targetRole = roles.find(role => role.name === `${LEVEL_ROLE_PREFIX}${level}`);
  if (!targetRole) return;

  const oldRoles = roles.filter(role => role.id !== targetRole.id && member.roles.cache.has(role.id));
  if (oldRoles.length) await member.roles.remove(oldRoles).catch(() => {});
  if (!member.roles.cache.has(targetRole.id)) await member.roles.add(targetRole).catch(() => {});
}

async function awardMessageXp(message) {
  if (!message.guild || message.author.bot) return null;

  const guildData = getGuildData(message.guild.id);
  const current = guildData[message.author.id] || { xp: 0, level: 1 };
  const previousLevel = getLevel(current.xp);
  current.xp = Math.min(current.xp + XP_PER_MESSAGE, getXpRequiredForLevel(MAX_LEVEL));
  current.level = getLevel(current.xp);
  guildData[message.author.id] = current;
  saveData();

  const roles = await ensureLevelRoles(message.guild);
  await applyLevelRole(message.member, current.level, roles);

  if (current.level > previousLevel && current.level <= MAX_LEVEL) {
    return { level: current.level, xp: current.xp };
  }
  return null;
}

function getLeaderboard(guildId, limit = 10) {
  const guildData = getGuildData(guildId);
  return Object.entries(guildData)
    .map(([userId, entry]) => ({ userId, xp: entry.xp || 0, level: getLevel(entry.xp || 0) }))
    .sort((first, second) => second.xp - first.xp)
    .slice(0, limit);
}

module.exports = {
  MAX_LEVEL,
  XP_PER_MESSAGE,
  getXpRequiredForLevel,
  SEPARATOR_ROLE_NAME,
  getLevel,
  getXpForNextLevel,
  ensureLevelRoles,
  awardMessageXp,
  getLeaderboard
};
