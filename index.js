import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import OpenAI from 'openai';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// REQUIRED ENV VARS on Railway:
// OPENAI_API_KEY=sk-...         (from OpenAI)
// DISCORD_TOKEN=...              (from Discord Bot tab)
// DISCORD_APP_ID=...             (Discord Application ID, numeric)
// VS_ID=vs_abc123...             (from your upload step)

// 1) Define a single /ask command
const askCmd = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask the neuroscience mentor (answers come from your PDFs)')
  .addStringOption(opt =>
    opt.setName('question').setDescription('Your question').setRequired(true)
  );

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Register global slash command
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APP_ID),
      { body: [askCmd.toJSON()] }
    );
    console.log('✅ /ask command registered');
  } catch (e) {
    console.error('Command registration failed:', e);
  }
})();

// Helper: format a simple Sources footer from search results if present
function buildSources(resp) {
  const items = [];
  for (const out of resp.output ?? []) {
    const results =
      out.file_search_results?.search_results ||
      out.search_results ||
      [];
    for (const r of results) {
      const filename = r.filename || r.file?.filename || r.file_id || 'PDF';
      const page = r.page_label ?? r.page;
      const snippet = r.content?.[0]?.text?.trim().slice(0, 100);
      items.push(`${filename}${page ? ` p.${page}` : ''}${snippet ? ` — “${snippet}”` : ''}`);
    }
  }
  const seen = new Set();
  const unique = items.filter(x => (seen.has(x) ? false : (seen.add(x), true))).slice(0, 4);
  return unique.length
    ? '**Sources**\n' + unique.map((x, i) => `[${i + 1}] ${x}`).join('\n')
    : '**Sources**\n—';
}

const SYSTEM_RULES = `
You are a neuroscience-based productivity mentor.
Answer ONLY using the provided PDF sources attached via file_search.
If the answer is not present in the sources, say: "I couldn't find this in the provided PDFs."
Keep answers practical, concise (≤ 6 bullets).
Educational only; not medical advice.
`;

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'ask') return;
  const question = interaction.options.getString('question', true);

  try {
    await interaction.deferReply();

    const resp = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: SYSTEM_RULES },
        { role: 'user', content: question }
      ],
      // Always search ALL PDFs by attaching the one vector store that contains them
      tools: [{ type: 'file_search', vector_store_ids: [process.env.VS_ID] }],
      // Ask SDK to include search results so we can show sources
      include: ['output[*].file_search_call.search_results'],
      max_output_tokens: 400
    });

    const answer = resp.output_text ?? 'No answer.';
    const sources = buildSources(resp);

    await interaction.editReply(
      `${answer}\n\n${sources}\n\n_Disclaimer: Educational only; not medical advice._`
    );
  } catch (err) {
    console.error(err);
    const msg = 'Sorry, I had trouble answering. Please try again.';
    if (interaction.deferred || interaction.replied) await interaction.editReply(msg);
    else await interaction.reply({ content: msg, ephemeral: true });
  }
});

client.once('ready', () => console.log(`🤖 Logged in as ${client.user.tag}`));
client.login(process.env.DISCORD_TOKEN);
