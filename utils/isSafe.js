// utils/isSafe.js

module.exports = async function isSafe(guild, userID, settings) {
  if (!guild || !userID) return true;

  // Sunucu sahibi
  if (userID === guild.ownerId) return true;

  // Botun kendisi
  if (userID === guild.client.user.id) return true;

  // Whitelist kontrolü
  if (settings?.whitelist?.includes(userID)) return true;

  // Administrator yetkisi kontrolü (ekstra güvenlik için)
  const member = guild.members.cache.get(userID);
  if (member && member.permissions.has('Administrator')) return true;

  return false;
};
