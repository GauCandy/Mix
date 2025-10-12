// functions/updateRoles.js
const { getGuildCache, saveCache } = require("../utils/cacheManager");

// ===== Role Logic =====
const BASE_ROLE_ID = "1415319898468651008"; // chỉ add khi mất AUTO
const AUTO_ROLE_ID = "1411240101832298569"; // mất role này mới add BASE
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

const lastUpdate = new Map();

async function updateMemberRoles(member) {
  try {
    if (!member || member.user?.bot) return;

    const now = Date.now();
    if (lastUpdate.has(member.id) && now - lastUpdate.get(member.id) < 3000) return;
    lastUpdate.set(member.id, now);

    const roles = member.roles.cache;
    const has = id => roles.has(id);
    const add = async id => {
      if (!has(id)) {
        await member.roles.add(id).catch(() => {});
        console.log(`✅ Thêm ${id} cho ${member.user.tag}`);
        logAction(member, `+${id}`);
      }
    };
    const remove = async id => {
      if (has(id)) {
        await member.roles.remove(id).catch(() => {});
        console.log(`❌ Gỡ ${id} khỏi ${member.user.tag}`);
        logAction(member, `-${id}`);
      }
    };

    // SUPER LOCK
    if (has(SUPER_LOCK_ROLE_ID)) {
      for (const r of SUPER_LOCK_REMOVABLE) if (has(r)) await remove(r);
      console.log(`🔒 ${member.user.tag} đang ở SUPER LOCK`);
      return;
    }

    // ======= KIỂM TRA ROLE =======
    const hasBase = has(BASE_ROLE_ID);
    const hasAuto = has(AUTO_ROLE_ID);
    const hasRemove = has(REMOVE_IF_HAS_ROLE_ID);
    const hasBlock = [...roles.keys()].some(r => BLOCK_ROLE_IDS.includes(r));
    const hasSuperRemovable = [...roles.keys()].some(r => SUPER_LOCK_REMOVABLE.includes(r));

    // ======= LOGIC CẬP NHẬT =======
    // 1️⃣ Nếu có cả AUTO và BASE => gỡ BASE (vì chưa đủ điều kiện)
    if (hasBase && hasAuto) {
      await remove(BASE_ROLE_ID);
      return;
    }

    // 2️⃣ Nếu có role SUPER_LOCK_REMOVABLE và có BASE => remove BASE
    if (hasSuperRemovable && hasBase) {
      await remove(BASE_ROLE_ID);
    }

    // 3️⃣ Nếu KHÔNG có AUTO_ROLE (vừa mất hoặc chưa có)
    //     và KHÔNG bị block, KHÔNG có remove, KHÔNG có SUPER_REMOVABLE, KHÔNG có BASE → add BASE
    else if (!hasAuto && !hasBlock && !hasRemove && !hasSuperRemovable && !hasBase) {
      await add(BASE_ROLE_ID);
    }

    // 4️⃣ AUTO_ROLE logic (giữ nguyên)
    if (!hasAuto && !hasRemove) {
      await add(AUTO_ROLE_ID);
    } else if (hasAuto && hasRemove) {
      await remove(AUTO_ROLE_ID);
    }

  } catch (err) {
    console.error("❌ updateMemberRoles error:", err);
  }
}

// Ghi cache
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
    console.warn("logAction failed:", e.message);
  }
}

// Khởi chạy quét
async function initRoleUpdater(client) {
  console.log("🔄 Quét roles toàn bộ thành viên...");
  for (const [, guild] of client.guilds.cache) {
    await guild.members.fetch().catch(() => {});
    for (const member of guild.members.cache.values()) updateMemberRoles(member);
  }
  console.log("✅ Quét hoàn tất!");
}

module.exports = { updateMemberRoles, initRoleUpdater };
