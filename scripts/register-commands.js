import { REST, Routes } from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
const APP_ID = process.env.APPLICATION_ID;
const GUILD_ID = process.env.GUILD_ID;

const rest = new REST({ version: "10" }).setToken(TOKEN);

const commands = [
  { name: "focus", description: "Neuroscience-based focus advice" },
  { name: "sleep", description: "Science-backed sleep tips" },
  { name: "stress", description: "Breathing & stress tools" },
  { name: "habit", description: "Habit formation principles" },
  {
    name: "ask",
    description: "Ask a neuroscience/performance question",
    options: [
      {
        name: "question",
        description: "Type your question",
        type: 3, // string
        required: true
      }
    ]
  }
];

(async () => {
  try {
    if (GUILD_ID) {
      console.log("Registering GUILD commands for", GUILD_ID);
      await rest.put(
        Routes.applicationGuildCommands(APP_ID, GUILD_ID),
        { body: commands }
      );
      console.log("✅ Guild commands registered (instant).");
    } else {
      console.log("Registering GLOBAL commands (may take ~1 hour)...");
      await rest.put(Routes.applicationCommands(APP_ID), { body: commands });
      console.log("✅ Global commands registered.");
    }
  } catch (err) {
    console.error("Registration error:", err);
    process.exit(1);
  }
})();
