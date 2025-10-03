const { SlashCommandBuilder } = require("discord.js");
const { createReportEmbed } = require("../functions/report");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report một người dùng")
    .addUserOption(opt =>
      opt.setName("user").setDescription("Người bị report").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Lý do report").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("proof").setDescription("Link ảnh / bằng chứng").setRequired(false)
    ),
  async execute(interaction) {
    const reported = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const proof = interaction.options.getString("proof");
    const channel = `<#${interaction.channel.id}>`;

    const embed = createReportEmbed({
      reporter: interaction.user.tag,
      reported: reported.tag,
      reason,
      proof,
      channel,
    });

    const reportChannel = interaction.guild.channels.cache.get(process.env.REPORT_CHANNEL_ID);
    if (reportChannel) {
      await reportChannel.send({ embeds: [embed] });
    }

    await interaction.reply({
      content: "✅ Report của bạn đã được gửi tới team mod!",
      ephemeral: true,
    });
  },
};
