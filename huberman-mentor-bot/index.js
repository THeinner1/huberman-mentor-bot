// Huberman Mentor Discord Bot
import { Client, GatewayIntentBits, Events } from "discord.js";
import OpenAI from "openai";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const topic = interaction.commandName;
  try {
    await interaction.deferReply();
    const prompt = `You are a neuroscience-informed productivity coach.
Give short, practical guidance about ${topic}.
Avoid medical or diagnostic advice.`;
    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });
    const text =
      resp.output?.[0]?.content?.[0]?.text ??
      "Sorry, I couldn’t generate advice.";
    await interaction.editReply(
      `${text}\n\n_Disclaimer: Educational only; not medical advice._`
    );
  } catch (err) {
    console.error(err);
    await interaction.editReply("⚠️ Error. Try again later.");
  }
});

client.login(process.env.DISCORD_TOKEN);
