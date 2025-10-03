const { EmbedBuilder } = require("discord.js");

function createReportEmbed({ reporter, reported, reason, proof, channel }) {
  const embed = new EmbedBuilder()
    .setColor("#ff4747")
    .setTitle("🚨 New Report Submitted")
    .setThumbnail("https://cdn-icons-png.flaticon.com/512/564/564619.png")
    .setDescription(
      `Một báo cáo vi phạm vừa được gửi trong server.  
      Vui lòng kiểm tra chi tiết bên dưới:`
    )
    .addFields(
      { name: "👤 Reporter", value: reporter, inline: true },
      { name: "⚠️ Reported User", value: reported, inline: true },
      { name: "📝 Reason", value: reason || "Không có", inline: false },
      { name: "📍 Channel", value: channel || "Không xác định", inline: false }
    )
    .setFooter({ text: "Moderation System | Auto-Report" })
    .setTimestamp();

  // ✅ Proof là tùy chọn
  if (proof) {
    embed.addFields({ name: "📎 Proof", value: proof, inline: false });
    if (proof.startsWith("http")) {
      embed.setImage(proof);
    }
  }

  return embed;
}

module.exports = { createReportEmbed };
