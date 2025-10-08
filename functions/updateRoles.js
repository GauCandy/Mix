const BASE_ROLE_ID = "1415319898468651008";
const AUTO_ROLE_ID = "1411240101832298569";
const REMOVE_IF_HAS_ROLE_ID = "1410990099042271352";
const SUPER_LOCK_ROLE_ID = "1411991634194989096"; // 👑 Role đặc biệt

const BLOCK_ROLE_IDS = [
  "1411639327909220352", "1411085492631506996", "1418990676749848576", "1410988790444458015",
  "1415322209320435732", "1415351613534503022", "1415350650165924002", "1415320304569290862",
  "1415351362866380881", "1415351226366689460", "1415322385095332021", "1415351029305704498",
  "1415350143800049736", "1415350765291307028", "1418990664762523718", "1417802085378031689",
  "1417097393752506398", "1420270612785401988", "1420276021009322064", "1415350457706217563",
  "1415320854014984342", "1414165862205751326"
];

// ✅ Danh sách role bị xóa khi có SUPER_LOCK_ROLE
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
    const remove = id => member.roles.remove(id).catch(() => {});
    const add = id => member.roles.add(id).catch(() => {});

    // ⚙️ Nếu có SUPER_LOCK_ROLE => chỉ xóa các role trong danh sách cho phép
    if (has(SUPER_LOCK_ROLE_ID)) {
      for (const roleId of SUPER_LOCK_REMOVABLE) {
        if (roles.has(roleId)) {
          await remove(roleId);
          console.log(`🧱 Xóa ${roleId} khỏi ${member.user.tag} (Super Lock active)`);
        }
      }
      console.log(`🔒 ${member.user.tag} đang ở chế độ SUPER LOCK`);
      return; // ❗ Không xử lý gì thêm
    }

    // ⚙️ Bình thường
    const hasBase = has(BASE_ROLE_ID);
    const hasAuto = has(AUTO_ROLE_ID);
    const hasRemove = has(REMOVE_IF_HAS_ROLE_ID);
    const hasBlock = [...roles.keys()].some(r => BLOCK_ROLE_IDS.includes(r));

    // Base role logic
    if (!hasBase && !hasBlock && !hasAuto) {
      await add(BASE_ROLE_ID);
      console.log(`✅ Thêm base cho ${member.user.tag}`);
    } else if (hasBase && (hasBlock || hasRemove)) {
      await remove(BASE_ROLE_ID);
      console.log(`❌ Gỡ base khỏi ${member.user.tag}`);
    }

    // Auto role logic
    if (!hasAuto && !hasRemove) {
      await add(AUTO_ROLE_ID);
      console.log(`✅ Thêm auto cho ${member.user.tag}`);
    } else if (hasAuto && hasRemove) {
      await remove(AUTO_ROLE_ID);
      console.log(`❌ Gỡ auto khỏi ${member.user.tag}`);
    }

    // Nếu có AUTO_ROLE thì xoá toàn bộ block role
    if (has(AUTO_ROLE_ID)) {
      for (const role of roles.keys()) {
        if (BLOCK_ROLE_IDS.includes(role)) await remove(role);
      }
    }

  } catch (err) {
    console.error("❌ updateMemberRoles error:", err);
  }
}

// ✅ Quét toàn server khi bot khởi động
async function initRoleUpdater(client) {
  console.log("🔄 Đang quét role tất cả thành viên...");
  for (const [, guild] of client.guilds.cache) {
    await guild.members.fetch();
    guild.members.cache.forEach(member => updateMemberRoles(member));
  }
  console.log("✅ Quét role hoàn tất!");
}

module.exports = { updateMemberRoles, initRoleUpdater };
