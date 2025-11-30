// events/channelHandler.js
const { renameChannelByCategory } = require("../functions/rename");

const CATEGORY_1 = "1411034825699233943"; // danh mục hoạt động
const CATEGORY_2 = "1427958263281881088"; // danh mục ngủ
const MACRO_ROLE = "1411991634194989096"; // role auto
const INACTIVITY_TIME = 1000 * 60 * 60 * 24; // 1 ngày không có embed

module.exports = (client) => {
  const inactivityTimers = new Map(); // channelId -> timeout

  // ----- Helpers -----
  async function updateRoleByCategory(channel, addRole) {
    try {
      const topic = channel.topic || "";
      const userId = topic.match(/\d{17,20}/)?.[0];
      if (!userId) return;
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      if (addRole) {
        if (!member.roles.cache.has(MACRO_ROLE)) {
          await member.roles.add(MACRO_ROLE).catch(err => console.error("❌ addRole err:", err));
          console.log(`✅ Added AUTO role to ${member.user.tag}`);
        }
      } else {
        if (member.roles.cache.has(MACRO_ROLE)) {
          await member.roles.remove(MACRO_ROLE).catch(err => console.error("❌ removeRole err:", err));
          console.log(`🧹 Removed AUTO role from ${member.user.tag}`);
        }
      }
    } catch (err) {
      console.error("❌ Role update error:", err);
    }
  }

  async function sendNotify(channel, type) {
    try {
      const userId = channel.topic?.match(/\d{17,20}/)?.[0];
      if (!userId) return;
      if (type === "sleep") {
        await channel.send(
          `<@${userId}>\nYour macro channel has been moved to the **DORMANT** category due to 24 hours of no embeds.`
        ).catch(err => console.error("❌ notify sleep err:", err));
      } else if (type === "active") {
        await channel.send(
          `<@${userId}>\nYour macro channel has been moved to the **MACRO|OPEN|** category because it received a new embed.`
        ).catch(err => console.error("❌ notify active err:", err));
      }
    } catch (err) {
      console.error("❌ Error sending notify:", err);
    }
  }

  function clearTimer(channelId) {
    if (inactivityTimers.has(channelId)) {
      clearTimeout(inactivityTimers.get(channelId));
      inactivityTimers.delete(channelId);
    }
  }

  function startInactivityTimer(channel) {
    try {
      clearTimer(channel.id);
      const timer = setTimeout(async () => {
        try {
          if (channel.parentId === CATEGORY_1) {
            await channel.setParent(CATEGORY_2, { lockPermissions: false }).catch(err => {
              console.error("❌ setParent error (to DORMANT):", err, "channelId:", channel.id);
            });
            await new Promise((r) => setTimeout(r, 500));
            await renameChannelByCategory(channel);
            await updateRoleByCategory(channel, false);
            await sendNotify(channel, "sleep");
            console.log(`📦 Moved ${channel.name} → DORMANT (24h no embeds)`);
          }
        } catch (err) {
          console.error("❌ Error when moving to DORMANT (timer):", err);
        }
      }, INACTIVITY_TIME);
      inactivityTimers.set(channel.id, timer);
      console.log(`🕒 Timer started for ${channel.id}`);
    } catch (err) {
      console.error("❌ startInactivityTimer error:", err);
    }
  }

  async function moveToActive(channel) {
    try {
      clearTimer(channel.id);
      if (channel.parentId === CATEGORY_2) {
        await channel.setParent(CATEGORY_1, { lockPermissions: false }).catch(err => {
          console.error("❌ setParent error (to ACTIVITY):", err, "channelId:", channel.id);
        });
        await new Promise((r) => setTimeout(r, 500));
        await renameChannelByCategory(channel);
        await updateRoleByCategory(channel, true);
        await sendNotify(channel, "active");
        console.log(`🔄 Reactivated: ${channel.name}`);
      } else {
        // nếu đã ở category 1 thì chỉ cancel timer và đảm bảo role
        await updateRoleByCategory(channel, true);
      }
    } catch (err) {
      console.error("❌ moveToActive error:", err);
    }
  }

  async function moveToDormantImmediately(channel) {
    try {
      clearTimer(channel.id);
      if (channel.parentId === CATEGORY_1) {
        await channel.setParent(CATEGORY_2, { lockPermissions: false }).catch(err => {
          console.error("❌ setParent error (startup to DORMANT):", err, "channelId:", channel.id);
        });
        await new Promise((r) => setTimeout(r, 500));
        await renameChannelByCategory(channel);
        await updateRoleByCategory(channel, false);
        await sendNotify(channel, "sleep");
        console.log(`📦 Moved ${channel.name} → DORMANT (startup scan)`);
      }
    } catch (err) {
      console.error("❌ moveToDormantImmediately error:", err);
    }
  }

  // Trả về object {found: bool, ts: timestamp|null}
  async function getMostRecentEmbedTimestamp(channel) {
    try {
      if (!channel || channel.type !== 0) return { found: false, ts: null };
      const fetched = await channel.messages.fetch({ limit: 200 }).catch(err => {
        console.error("❌ fetch messages err:", err, "channelId:", channel.id);
        return null;
      });
      if (!fetched) return { found: false, ts: null };
      const messages = Array.from(fetched.values());
      for (const m of messages) {
        if (m.embeds && m.embeds.length > 0) {
          return { found: true, ts: m.createdTimestamp };
        }
      }
      return { found: false, ts: null };
    } catch (err) {
      console.error("❌ getMostRecentEmbedTimestamp error:", err);
      return { found: false, ts: null };
    }
  }

  // ----- Startup scan 1 lần duy nhất -----
  client.once("ready", async () => {
    try {
      console.log("🔎 Startup: scanning CATEGORY_1 once for embed activity...");
      for (const [, guild] of client.guilds.cache) {
        // Lấy tất cả text channel trong guild đang có parentId CATEGORY_1
        const channels = guild.channels.cache.filter(ch => ch.parentId === CATEGORY_1 && ch.type === 0);
        for (const [, ch] of channels) {
          try {
            const { found, ts } = await getMostRecentEmbedTimestamp(ch);
            if (found) {
              const age = Date.now() - ts;
              if (age >= INACTIVITY_TIME) {
                await moveToDormantImmediately(ch);
              } else {
                console.log(`✅ ${ch.name} has recent embed (${Math.floor(age / 1000)}s ago)`);
              }
            } else {
              console.log(`⚠️ ${ch.name} has NO embeds right now -> starting inactivity timer`);
              startInactivityTimer(ch);
            }
          } catch (err) {
            console.error("❌ Error scanning channel on ready:", err);
          }
        }
      }
    } catch (err) {
      console.error("❌ Startup scanning error:", err);
    }
  });

  // ===== Khi message được tạo (bất kỳ message có embed đều coi là activity) =====
  client.on("messageCreate", async (msg) => {
    try {
      const channel = msg.channel;
      if (!channel || channel.type !== 0) return;

      // Nếu message có embed => coi là hoạt động
      if (msg.embeds && msg.embeds.length > 0) {
        console.log(`[messageCreate] embed detected in ${channel.guild?.name || "guild"} / ${channel.name} (authorBot=${!!msg.author?.bot}, webhook=${!!msg.webhookId})`);
        await moveToActive(channel);
        clearTimer(channel.id);
      } else {
        // Nếu không có embed thì không làm gì
      }
    } catch (err) {
      console.error("❌ messageCreate error:", err);
    }
  });

  // ===== Khi kênh được tạo =====
  client.on("channelCreate", async (channel) => {
    try {
      await renameChannelByCategory(channel);

      if (channel.parentId === CATEGORY_1) {
        const { found } = await getMostRecentEmbedTimestamp(channel);
        if (found) {
          await updateRoleByCategory(channel, true);
        } else {
          await updateRoleByCategory(channel, false);
          startInactivityTimer(channel);
        }
      } else if (channel.parentId === CATEGORY_2) {
        await updateRoleByCategory(channel, false);
      }
    } catch (err) {
      console.error("❌ channelCreate error:", err);
    }
  });

  // ===== Khi kênh được chuyển danh mục =====
  client.on("channelUpdate", async (oldCh, newCh) => {
    try {
      if (!newCh || newCh.type !== 0) return;
      if (oldCh.parentId !== newCh.parentId) {
        await renameChannelByCategory(newCh);
        if (newCh.parentId === CATEGORY_1) {
          await updateRoleByCategory(newCh, true);
          await sendNotify(newCh, "active");
          // Khi vừa chuyển về hoạt động -> kiểm tra có embed hay không.
          const { found } = await getMostRecentEmbedTimestamp(newCh);
          if (!found) startInactivityTimer(newCh);
          else clearTimer(newCh.id);
        } else if (newCh.parentId === CATEGORY_2) {
          await updateRoleByCategory(newCh, false);
          await sendNotify(newCh, "sleep");
          clearTimer(newCh.id);
        }
        console.log(`🪄 ChannelUpdate: ${newCh.name} category changed`);
      }
    } catch (err) {
      console.error("❌ channelUpdate error:", err);
    }
  });

  // ===== Khi message bị xóa =====
  client.on("messageDelete", async (message) => {
    try {
      let msg = message;
      if (message.partial) {
        try { msg = await message.fetch(); } catch (e) { /* ignore fetch fail */ }
      }
      const channel = msg.channel;
      if (!channel || channel.type !== 0) return;

      if (msg.embeds && msg.embeds.length > 0) {
        const { found } = await getMostRecentEmbedTimestamp(channel);
        if (!found && channel.parentId === CATEGORY_1) {
          startInactivityTimer(channel);
          console.log(`🕵️ No embeds after delete in ${channel.name} -> timer started`);
        }
      }
    } catch (err) {
      console.error("❌ messageDelete error:", err);
    }
  });

  // ===== Khi message được chỉnh sửa =====
  client.on("messageUpdate", async (oldMessage, newMessage) => {
    try {
      let nm = newMessage;
      if (newMessage.partial) {
        try { nm = await newMessage.fetch(); } catch (e) { /* ignore */ }
      }
      const channel = nm.channel;
      if (!channel || channel.type !== 0) return;

      const hasEmbeds = nm.embeds && nm.embeds.length > 0;
      if (!hasEmbeds) {
        const { found } = await getMostRecentEmbedTimestamp(channel);
        if (!found && channel.parentId === CATEGORY_1) {
          startInactivityTimer(channel);
          console.log(`🕵️ No embeds after update in ${channel.name} -> timer started`);
        }
      } else {
        await moveToActive(channel);
        console.log(`✅ embed present after update in ${channel.name} -> reactivated`);
      }
    } catch (err) {
      console.error("❌ messageUpdate error:", err);
    }
  });

  // ===== Khi kênh bị xóa =====
  client.on("channelDelete", (channel) => {
    if (inactivityTimers.has(channel.id)) {
      clearTimeout(inactivityTimers.get(channel.id));
      inactivityTimers.delete(channel.id);
    }
  });
};
