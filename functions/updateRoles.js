// functions/updateRoles.js
const { getGuildCache, saveCache } = require("../utils/cacheManager");

// ===== Role Logic =====
const BASE_ROLE_ID = "1415319898468651008";
const AUTO_ROLE_ID = "1411240101832298569";
const REMOVE_IF_HAS_ROLE_ID = "1410990099042271352";
const SUPER_LOCK_ROLE_ID = "1411991634194989096";

const BLOCK_ROLE_IDS = [
  "1411639327909220352","1411085492631506996","1418990676749848576","1410988790444458015",
  "1415322209320435732","1415351613534503022","1415350650165924002","1415320304569290862",
  "1415351362866380881","1415351226366689460","1415322385095332021","1415351029305704498",
  "1415350143800049736","1415350765291307028","1418990664762523718","1417802085378031689",
  "1417097393752506398","1420270612785401988","1420276021009322064","1415350457706217563",
  "1415320854014984342","1414165862205751326"
];

const SUPER_LOCK_REMOVABLE = [
  "1415350765291307028","1415350143800049736","1415351029305704498",
  "1415322385095332021","1415351226366689460","1415351362866380881",
  "1415320304569290862","1415350650165924002","1415351613534503022",
  "1417097393752506398","1420270612785401988","1415322209320435732",
  "1420276021009322064","1415350457706217563","1415320854014984342","1414165862205751326"
];

// tránh spam / loop
const lastUpdate = new Map();

async function updateMemberRoles(member) {
  try {
    if (!member) return;
    if (member.user && member.user.bot) return;

    const now = Date.now();
    if (lastUpdate.has(member.id) && now - lastUpdate.get(member.id) < 3000) return;
    lastUpdate.set(member.id, now);

    const roles = member.roles.cache;
    const has = id => roles.has(id);
    const add = async id => {
      if (!has(id)) {
        await member.roles.add(id).catch(() => {});
        console.log(`✅ Thêm ${id} cho ${member.user?.tag || member.id}`);
        logAction(member, `+${id}`);
      }
    };
    const remove = async id => {
      if (has(id)) {
        await member.roles.remove(id).catch(() => {});
        console.log(`❌ Gỡ ${id} khỏi ${member.user?.tag || member.id}`);
        logAction(member, `-${id}`);
      }
    };

    // SUPER LOCK: nếu user có role SUPER_LOCK thì remove hết các role trong SUPER_LOCK_REMOVABLE
    if (has(SUPER_LOCK_ROLE_ID)) {
      for (const r of SUPER_LOCK_REMOVABLE) {
        if (has(r)) await remove(r);
      }
      console.log(`🔒 ${member.user?.tag || member.id} đang ở SUPER LOCK`);
      return;
    }

    const hasBase = has(BASE_ROLE_ID);
    const hasAuto = has(AUTO_ROLE_ID);
    const hasRemove = has(REMOVE_IF_HAS_ROLE_ID);
    const hasBlock = [...roles.keys()].some(r => BLOCK_ROLE_IDS.includes(r));
    const hasSuperRemovable = [...roles.keys()].some(r => SUPER_LOCK_REMOVABLE.includes(r));

    // NGUYÊN BẢN QUY TẮC:
    // - Nếu có role trong SUPER_LOCK_REMOVABLE và có BASE_ROLE thì remove BASE_ROLE.
    // - Ngược lại, nếu không có AUTO_ROLE, không bị block, không có BASE_ROLE, không có SUPER_REMOVABLE => add BASE_ROLE.
    if (hasSuperRemovable && hasBase) {
      await remove(BASE_ROLE_ID);
    } else if (!hasAuto && !hasBlock && !hasBase && !hasSuperRemovable) {
      await add(BASE_ROLE_ID);
    }

    // AUTO_ROLE logic: nếu không có AUTO_ROLE và không có REMOVE_IF_HAS_ROLE thì add AUTO_ROLE
    // nếu có AUTO_ROLE và có REMOVE_IF_HAS_ROLE thì remove AUTO_ROLE
    if (!hasAuto && !hasRemove) {
      await add(AUTO_ROLE_ID);
    } else if (hasAuto && hasRemove) {
      await remove(AUTO_ROLE_ID);
    }

  } catch (err) {
    console.error("❌ updateMemberRoles error:", err);
  }
}

// Ghi hành động vào cache (không can thiệp logic)
function logAction(member, action) {
  try {
    const guildCache = getGuildCache(member.guild.id);
    guildCache.lastRoleActions = guildCache.lastRoleActions || [];
    guildCache.lastRoleActions.push({
      user: member.user?.tag || null,
      userId: member.id,
      action,
      time: new Date().toISOString(),
    });
    if (guildCache.lastRoleActions.length > 200) guildCache.lastRoleActions.shift();
    saveCache();
  } catch (e) {
    // Không cho log lỗi ảnh hưởng luồng chính
    console.warn("logAction failed:", e.message);
  }
}

// khởi động quét
async function initRoleUpdater(client) {
  console.log("🔄 Quét roles toàn bộ thành viên...");
  for (const [, guild] of client.guilds.cache) {
    try {
      await guild.members.fetch();
    } catch (e) {
      console.warn("fetch members failed for guild", guild.id, e.message);
    }
    for (const member of guild.members.cache.values()) {
      // không chờ từng member một để tránh quá lâu, vẫn gọi updateMemberRoles nhưng không block hoàn toàn
      try { updateMemberRoles(member); } catch (e) {}
    }
  }
  console.log("✅ Quét hoàn tất!");

  // Lắng nghe sự kiện realtime
  client.on("guildMemberAdd", (member) => updateMemberRoles(member));
  client.on("guildMemberUpdate", (oldMember, newMember) => updateMemberRoles(newMember));
}

module.exports = { updateMemberRoles, initRoleUpdater };
