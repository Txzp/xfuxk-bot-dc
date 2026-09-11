const fs = require('fs');
const path = require('path');
const { PermissionFlagsBits } = require('discord.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'levels.json');
const MAX_LEVEL = 50;
const XP_PER_LEVEL = 100;
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
  return Math.min(MAX_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1);
}

function getXpForNextLevel(level) {
  return level >= MAX_LEVEL ? null : level * XP_PER_LEVEL;
}

async function ensureLevelRoles(guild) {
  const roles = [];
  let separator = guild.roles.cache.find(role => role.name === SEPARATOR_ROLE_NAME);
  if (!separator) {
    separator = await guild.roles.create({
      name: SEPARATOR_ROLE_NAME,
      color: 0x2b2d31,
      reason: 'Level system separator role'
    });
  }

  for (let level = 1; level <= MAX_LEVEL; level += 1) {
    let role = guild.roles.cache.find(item => item.name === `${LEVEL_ROLE_PREFIX}${level}`);
    if (!role) {
      role = await guild.roles.create({
        name: `${LEVEL_ROLE_PREFIX}${level}`,
        reason: 'Level system role'
      });
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
  current.xp = Math.min(current.xp + 1, MAX_LEVEL * XP_PER_LEVEL);
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
  XP_PER_LEVEL,
  SEPARATOR_ROLE_NAME,
  getLevel,
  getXpForNextLevel,
  ensureLevelRoles,
  awardMessageXp,
  getLeaderboard
};
