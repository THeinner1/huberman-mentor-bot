import { REST, Routes } from "discord.js";
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
const appId = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;

const commands = [
  { name: "focus", description: "Neuroscience-based focus advice" },
  { name: "sleep", description: "Science-backed sleep tips" },
  { name: "stress", description: "Breathing & stress tools" },
  { name: "habit", description: "Habit formation principles" }
];

(async () => {
  try {
    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(appId, guildId),
        { body: commands }
      );
      console.log("✅ Guild commands registered.");
    } else {
      await rest.put(Routes.applicationCommands(appId), { body: commands });
      console.log("✅ Global commands registered.");
    }
  } catch (err) {
    console.error("Registration error:", err);
  }
})();
