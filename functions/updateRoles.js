const { ChannelType } = require("discord.js");
const { getGuildCache, saveCache } = require("../utils/cacheManager");

// ===== Role Logic =====
const BASE_ROLE_ID = "1415319898468651008";
const AUTO_ROLE_ID = "1411240101832298569";
const REMOVE_IF_HAS_ROLE_ID = "1410990099042271352";
const SUPER_LOCK_ROLE_ID = "1411991634194989096";

const BLOCK_ROLE_IDS = [
  "1411639327909220352", "1411085492631506996", "1418990676749848576",
  "1410988790444458015", "1415322209320435732", "1415351613534503022",
  "1415350650165924002", "1415320304569290862", "1415351362866380881",
  "1415351226366689460", "1415322385095332021", "1415351029305704498",
  "1415350143800049736", "1415350765291307028", "1418990664762523718",
  "1417802085378031689", "1417097393752506398", "1420270612785401988",
  "1420276021009322064", "1415350457706217563", "1415320854014984342",
  "1414165862205751326"
];

const SUPER_LOCK_HIDE_CHANNELS = [
  "1419727338119368784",
  "1411049568979648553",
  "1423207293335371776",
  "1419725921363034123",
  "1419725102412726292"
];

// Role cần thiết để upgrade
const REQUIRED_ROLE = "1428898880447316159";

// Map nâng cấp role
const roleUpgradeMap = {
  "1431525750724362330": "1428899630753775626", // #1 -> #1.1
  "1431525792365547540": "1410990099042271352", // #2 -> #2.1
  "1431525824082870272": "1428899344010182756", // #3 -> #3.1
  "1431525863987613877": "1428418711764865156", // #4 -> #4.1
  "1431525890587885698": "1431525947684950016", // #5 -> #5.1
};

// Danh mục cần role #2.1 mới thấy
const categoryIds = [
  "1411043139728314478",
  "1411049289685270578",
  "1411034825699233943",
  "1428927402444325024", // ✅ danh mục mới bạn yêu cầu
];

const requiredRoleForCategory = "1410990099042271352"; // #2.1
const privateChannelId = "1428927402444325024"; // ✅ thay kênh riêng thành kênh này
const requiredPrivateRole = "1428899344010182756"; // #3.1

// Khi nhận role đặc biệt → ping vào channel riêng 10s
const roleToChannelMap = {
  "1431697157437784074": "1428930836501106759",
  "1431697198474723442": "1431697443816210633",
  "1431697216376012880": "1431697499285885038",
  "1431697231127253042": "1431568755108085762",
};

// cache chống spam
const lastUpdate = new Map();

// ===================== MAIN =====================
async function updateMemberRoles(member) {
  try {
    if (!member || member.user.bot) return;

    const now = Date.now();
    if (lastUpdate.has(member.id) && now - lastUpdate.get(member.id) < 2000) return;
    lastUpdate.set(member.id, now);

    const has = id => member.roles.cache.has(id);
    const add = async id => { if (!has(id)) await member.roles.add(id).catch(() => {}); };
    const remove = async id => { if (has(id)) await member.roles.remove(id).catch(() => {}); };

    const hasBase = has(BASE_ROLE_ID);
    const hasAuto = has(AUTO_ROLE_ID);
    const hasRemove = has(REMOVE_IF_HAS_ROLE_ID);
    const hasTrigger = has(REQUIRED_ROLE);
    const hasBlock = [...member.roles.cache.keys()].some(r => BLOCK_ROLE_IDS.includes(r));

    // ===== BASE / AUTO logic =====
    if (hasTrigger && !hasBase && !hasRemove && !hasBlock) await add(BASE_ROLE_ID);
    else if (!hasTrigger && hasBase) await remove(BASE_ROLE_ID);

    if (!hasAuto && !hasRemove && !hasTrigger) await add(AUTO_ROLE_ID);
    else if (hasAuto && (hasRemove || hasTrigger)) await remove(AUTO_ROLE_ID);

    // ===== ROLE UPGRADE =====
    for (const [normalId, upgradedId] of Object.entries(roleUpgradeMap)) {
      const hasNormal = has(normalId);
      const hasUpgraded = has(upgradedId);

      if (has(REQUIRED_ROLE) && hasNormal && !hasUpgraded) await add(upgradedId);
      if (!hasNormal && hasUpgraded) await remove(upgradedId);
    }

    // ===== SUPER LOCK ẨN KÊNH =====
    const hidePromises = [];
    if (has(SUPER_LOCK_ROLE_ID)) {
      for (const id of SUPER_LOCK_HIDE_CHANNELS) {
        const c = member.guild.channels.cache.get(id);
        if (c) hidePromises.push(c.permissionOverwrites.edit(member.id, { ViewChannel: false }).catch(() => {}));
      }
    } else {
      for (const id of SUPER_LOCK_HIDE_CHANNELS) {
        const c = member.guild.channels.cache.get(id);
        if (c) hidePromises.push(c.permissionOverwrites.delete(member.id).catch(() => {}));
      }
    }

    // ===== ẨN DANH MỤC & KÊNH RIÊNG =====
    const hasCategoryRole = has(requiredRoleForCategory);
    const hasPrivateRole = has(requiredPrivateRole);

    for (const catId of categoryIds) {
      const category = member.guild.channels.cache.get(catId);
      if (!category || category.type !== ChannelType.GuildCategory) continue;
      await category.permissionOverwrites
        .edit(member.id, { ViewChannel: hasCategoryRole ? null : false })
        .catch(() => {});
    }

    const privateChannel = member.guild.channels.cache.get(privateChannelId);
    if (privateChannel) {
      await privateChannel.permissionOverwrites
        .edit(member.id, { ViewChannel: hasPrivateRole ? null : false })
        .catch(() => {});
    }

    await Promise.all(hidePromises);

  } catch (err) {
    console.error("❌ updateMemberRoles error:", err);
  }
}

// ===================== PING ROLE =====================
async function handleRolePing(oldMember, newMember) {
  try {
    for (const [roleId, channelId] of Object.entries(roleToChannelMap)) {
      const hadRole = oldMember?.roles.cache.has(roleId);
      const hasRole = newMember.roles.cache.has(roleId);

      if (!hadRole && hasRole) {
        const channel = newMember.guild.channels.cache.get(channelId);
        if (!channel) continue;
        const msg = await channel.send({
          content: `<@${newMember.id}>`,
          allowedMentions: { users: [newMember.id] },
        });
        setTimeout(() => msg.delete().catch(() => {}), 10_000);
      }
    }
  } catch (err) {
    console.error("❌ handleRolePing error:", err);
  }
}

// ===================== EVENT HOOK =====================
function registerRoleEvents(client) {
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const roleChanged =
      oldMember.roles.cache.size !== newMember.roles.cache.size ||
      [...oldMember.roles.cache.keys()].some(id => !newMember.roles.cache.has(id)) ||
      [...newMember.roles.cache.keys()].some(id => !oldMember.roles.cache.has(id));

    if (roleChanged) {
      await updateMemberRoles(newMember);
      await handleRolePing(oldMember, newMember);
    }
  });
}

async function initRoleUpdater(client) {
  console.log("🔄 Quét roles toàn bộ thành viên (lúc restart)...");
  for (const [, guild] of client.guilds.cache) {
    await guild.members.fetch().catch(() => {});
    const members = [...guild.members.cache.values()];
    await Promise.all(members.map(m => updateMemberRoles(m)));
  }
  console.log("✅ Quét hoàn tất!");
}

module.exports = { updateMemberRoles, registerRoleEvents, initRoleUpdater };
