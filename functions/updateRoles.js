// ===== Role Logic =====
const BASE_ROLE_ID = "1415319898468651008"; // Base role
const AUTO_ROLE_ID = "1411240101832298569"; // Auto role
const REMOVE_IF_HAS_ROLE_ID = "1410990099042271352"; // Role khiến auto bị remove
const SUPER_LOCK_ROLE_ID = "1411991634194989096"; // Super lock

// Role block danh sách
const BLOCK_ROLE_IDS = [
  "1411639327909220352", "1411085492631506996", "1418990676749848576", "1410988790444458015",
  "1415322209320435732", "1415351613534503022", "1415350650165924002", "1415320304569290862",
  "1415351362866380881", "1415351226366689460", "1415322385095332021", "1415351029305704498",
  "1415350143800049736", "1415350765291307028", "1418990664762523718", "1417802085378031689",
  "1417097393752506398", "1420270612785401988", "1420276021009322064", "1415350457706217563",
  "1415320854014984342", "1414165862205751326"
];

// Role bị xoá khi có Super Lock
const SUPER_LOCK_REMOVABLE = [
  "1415350765291307028", "1415350143800049736", "1415351029305704498",
  "1415322385095332021", "1415351226366689460", "1415351362866380881",
  "1415320304569290862", "1415350650165924002", "1415351613534503022",
  "1417097393752506398", "1420270612785401988", "1415322209320435732",
  "1420276021009322064", "1415350457706217563", "1415320854014984342",
  "1414165862205751326"
];

async function updateMemberRoles(member) {
  try {
    if (member.user.bot) return;

    const roles = member.roles.cache;
    const has = id => roles.has(id);
    const add = id => member.roles.add(id).catch(() => {});
    const remove = id => member.roles.remove(id).catch(() => {});

    // ⚙️ Nếu có Super Lock => chỉ xoá danh sách được phép
    if (has(SUPER_LOCK_ROLE_ID)) {
      for (const roleId of SUPER_LOCK_REMOVABLE) {
        if (has(roleId)) {
          await remove(roleId);
          console.log(`🧱 Xóa ${roleId} khỏi ${member.user.tag} (Super Lock active)`);
        }
      }
      console.log(`🔒 ${member.user.tag} đang ở chế độ SUPER LOCK`);
      return; // ❗Không làm gì thêm
    }

    const hasBase = has(BASE_ROLE_ID);
    const hasAuto = has(AUTO_ROLE_ID);
    const hasRemove = has(REMOVE_IF_HAS_ROLE_ID);
    const hasBlock = [...roles.keys()].some(r => BLOCK_ROLE_IDS.includes(r));

    // ⚙️ Kiểm tra xem có thuộc nhóm 15 role SuperLockRemovable không
    const hasAnySuperLockRemovable = [...roles.keys()].some(r => SUPER_LOCK_REMOVABLE.includes(r));

    // =============================
    // ⚙️ QUY TẮC CHÍNH (đã chỉnh):
    // 1️⃣ Nếu có AUTO -> KHÔNG thêm BASE, nhưng KHÔNG xoá BASE trừ khi có role trong SUPER_LOCK_REMOVABLE
    // 2️⃣ Nếu không có AUTO và không bị block -> thêm BASE
    // 3️⃣ Nếu có bất kỳ role trong SUPER_LOCK_REMOVABLE -> xoá BASE
    // 4️⃣ Nếu có REMOVE_ROLE -> gỡ AUTO
    // =============================

    // Xử lý BASE
    if (hasAnySuperLockRemovable && hasBase) {
      await remove(BASE_ROLE_ID);
      console.log(`⚠️ Gỡ BASE khỏi ${member.user.tag} (có role trong SUPER_LOCK_REMOVABLE)`);
    } else if (!hasAuto && !hasBlock && !hasBase && !hasAnySuperLockRemovable) {
      await add(BASE_ROLE_ID);
      console.log(`✅ Thêm BASE cho ${member.user.tag}`);
    }

    // Auto role logic
    if (!hasAuto && !hasRemove) {
      await add(AUTO_ROLE_ID);
      console.log(`✅ Thêm AUTO cho ${member.user.tag}`);
    } else if (hasAuto && hasRemove) {
      await remove(AUTO_ROLE_ID);
      console.log(`❌ Gỡ AUTO khỏi ${member.user.tag} (có REMOVE_IF_HAS_ROLE)`);
    }

  } catch (err) {
    console.error("❌ updateMemberRoles error:", err);
  }
}

// ✅ Quét tất cả members khi bot restart
async function initRoleUpdater(client) {
  console.log("🔄 Quét role toàn bộ thành viên...");
  for (const [, guild] of client.guilds.cache) {
    await guild.members.fetch();
    guild.members.cache.forEach(member => updateMemberRoles(member));
  }
  console.log("✅ Quét role hoàn tất!");
}

module.exports = { updateMemberRoles, initRoleUpdater };
