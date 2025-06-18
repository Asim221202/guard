// utils/isSafe.js

module.exports = async function isSafe(guild, userID, settings) {
  if (!guild || !userID) return true;

  // Sunucu sahibi
  if (userID === guild.ownerId) return true;

  // Botun kendisi
  if (userID === guild.client.user.id) return true;

  // Whitelist kontrolü
  if (settings?.whitelist?.includes(userID)) return true;

  return false; // Hiçbiri değilse, güvenli değil
};
