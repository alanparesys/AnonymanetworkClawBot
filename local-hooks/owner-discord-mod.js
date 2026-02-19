/**
* Owner-only Discord moderation hook (v1)
* Command format (in Discord):
* /ban <userId|<@mention>> <reason...>
*/
module.exports = async function ownerDiscordModHook(ctx) {
try {
const env = ctx?.event || ctx || {};
const text =
env?.text ||
env?.message?.text ||
env?.message?.content ||
"";

const channel = env?.channel || env?.provider || "";
const senderId = String(env?.senderId || env?.from || "");
const guildId =
env?.guildId ||
env?.message?.guildId ||
process.env.OWNER_DISCORD_GUILD_ID ||
"";

const ownerId = process.env.OWNER_DISCORD_ID || "394150631776059394";
const botToken =
process.env.DISCORD_BOT_TOKEN ||
process.env.OPENCLAW_DISCORD_TOKEN ||
"";

if (channel !== "discord") return;
if (!text || typeof text !== "string") return;
// Si quelqu'un d'autre tente de parler au bot
if (senderId && senderId !== ownerId) {
if (ctx?.sendMessage) {
await ctx.sendMessage(
`Seul <@${ownerId}> peut m'utiliser car il est mon créateur.`
);
}
return;
}

// Commande /ban
const m = text.trim().match(/^\/ban\s+(.+?)\s+(.+)$/i);
if (!m) return;

if (!guildId) {
if (ctx?.sendMessage) {
await ctx.sendMessage("Erreur: guildId introuvable pour ce message.");
}
return;
}
if (!botToken) {
if (ctx?.sendMessage) {
await ctx.sendMessage("Erreur: token Discord bot manquant côté runtime.");
}
return;
}

let rawUser = m[1].trim();
const reason = m[2].trim().slice(0, 400);
// <@123> ou <@!123> -> 123
const mention = rawUser.match(/^<@!?(\d+)>$/);
const userId = mention ? mention[1] : rawUser.replace(/[^\d]/g, "");

if (!/^\d{10,25}$/.test(userId)) {
if (ctx?.sendMessage) {
await ctx.sendMessage("Format utilisateur invalide. Utilise un @mention ou un userId.");
}
return;
}

const url = `https://discord.com/api/v10/guilds/${guildId}/bans/${userId}`;
const res = await fetch(url, {
method: "PUT",
headers: {
"Authorization": `Bot ${botToken}`,
"Content-Type": "application/json",
"X-Audit-Log-Reason": encodeURIComponent(reason || "Ban demandé par le créateur"),
},
body: JSON.stringify({ delete_message_seconds: 0 }),
});

if (res.ok) {
if (ctx?.sendMessage) {
await ctx.sendMessage(`✅ Ban appliqué pour <@${userId}>. Raison: ${reason}`);
}
} else {
const err = await res.text().catch(() => "");
if (ctx?.sendMessage) {
await ctx.sendMessage(`❌ Échec ban (${res.status}). ${err?.slice(0, 500)}`);
}
}
} catch (e) {
if (ctx?.sendMessage) {
await ctx.sendMessage(`❌ Erreur hook modération: ${String(e).slice(0, 500)}`);
}
}
};
