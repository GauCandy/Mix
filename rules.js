// ====== RULES CONFIG ======
module.exports = {
  opt1: {
    title: " **1 Warning Rules**",
    desc: `*Flooding/Spamming*\nDescription: Messages that occupy a large portion of the screen or involve excessive posting of irrelevant content.\n*Exceptions:* Informative messages\n(Additional 1 Hour mute)\n\n
*Excessive Begging*\nDescription: Repeatedly asking for favors, items, roles, or other benefits disruptively.\n*Exceptions:* Jokingly begging\n\n
*XP Farming*\nDescription: Sending messages solely to gain XP (Arcane bot).\nPunishments:\n1st Offense = reminder\n2nd Offense = Reduce XP\n3rd Offense = Level Reset`,
    color: "#ffffcc",
    image: "https://cdn.discordapp.com/attachments/1358092861303947485/1358860213138096199/IMG_2287.png"
  },
  opt2: {
    title: " **Channel Misuses**",
    desc: `Channel misuses fall under the 1 Warning Rules category.\n\n
**Chatting Channel Misuse**\nUsing chat channels for non-chat purposes (e.g. bot commands outside Bots channel).\n\n
**Macro Channels Misuse**\nUsing macro category channels incorrectly.\nPunishments:\n1 Warn = Reminder\n2 Warn = 1 Day Blacklist\n3 Warn = 1 Week Blacklist\n\n
**Community Channels Misuse**\nUsing community section for inappropriate purposes.\nPunishments similar to above.\n\n
**Voice Channel Misuse**\nImproperly using voice channels (Additional 1h Mute)`,
    color: "#7fe390",
    image: "https://cdn.discordapp.com/attachments/1358092861303947485/1359923248946483382/Channel_Misuse.png"
  },
  opt3: {
    title: " **2 Warning Rules**",
    desc: `*Mod Bait*\nSending messages that appear punishable to provoke mods.\n\n
*Accusation w/o Evidence*\nMaking wrongful claims without proof.\n\n
*DM Harassment*\nHarassing members in DMs due to mutual server.\n\n
*Discrimination*\nHarmful stereotyping (race, gender, religion...). Severe cases → Hate Speech.\n\n
*Inappropriate/Suggestive Language*\nImplying sexual/offensive content.\n\n
*Toxicity*\nDisruptive behavior without exceptions.\n\n
*Advertising/Self Promotion*\nPromoting media for self-gain without permission.`,
    color: "#f0954b",
    image: "https://cdn.discordapp.com/attachments/1358092861303947485/1358860209686057240/IMG_2288.png"
  },
  opt4: {
    title: " **3 Warning Rules**",
    desc: `**Mod Bait**\nTrying to trick mods with borderline messages.\n\n
**Accusation w/o Evidence**\nWrongful claims without evidence (severe = ban).\n\n
**DM Harassment**\nHarassing users via DMs from mutual server.\n\n
**Discrimination**\nExtreme harmful stereotyping (severe = Hate Speech).`,
    color: "#f4363f",
    image: "https://cdn.discordapp.com/attachments/1358092861303947485/1358860210349019246/IMG_2289.png"
  },
  opt5: {
    title: " **Instant Ban Rules**",
    desc: `*Punishment Evading*\nLeaving to avoid punishment.\n\n
*NSFW*\nPosting inappropriate sexual/explicit content.\n\n
*Hate Speech/Racism*\nPromoting extreme discrimination.\n\n
*Child Endangerment*\nAny act harming minors.\n\n
*Cybercrimes*\nIllegal activity online.\n\n
*Inappropriate Profile*\nOffensive/suggestive profile. Punishment = Kick → Ban if unchanged.`,
    color: "#f13bfe",
    image: "https://cdn.discordapp.com/attachments/1358092861303947485/1358860210986287224/IMG_2290.png"
  }
};
