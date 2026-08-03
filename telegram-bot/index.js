/**
 * RewardNexus Telegram Bot v2.1 - xpe.nettt
 * Funciona en Railway (polling) y Vercel (webhook)
 */

require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://rewardnexus.vercel.app';
const ADMIN_ID = process.env.ADMIN_ID || '';
const MONETAG_LINK = process.env.MONETAG_LINK || 'https://omg10.com/4/11368455';
const CPA_LINK = process.env.CPA_LINK || 'https://cpalead.com/';
const CRYPTO_LINK = process.env.CRYPTO_LINK || 'https://www.binance.com/es/register';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';  // Solo webhook si se setea explicitamente

if (!TOKEN) { console.error('ERROR: TELEGRAM_BOT_TOKEN no configurado'); process.exit(1); }

// ============ INIT ============
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let bot;

if (WEBHOOK_URL) {
  // Modo webhook (Vercel)
  bot = new TelegramBot(TOKEN, { webHook: { port: PORT, host: '0.0.0.0' } });
  bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`);
  console.log('RewardNexus en modo WEBHOOK en', WEBHOOK_URL);
} else {
  // Modo polling (Railway / local)
  bot = new TelegramBot(TOKEN, { polling: true });
  console.log('RewardNexus en modo POLLING');
}

// Express server
app.get('/health', (req, res) => res.json({ status: 'ok', bot: 'RewardNexus', version: '2.1' }));

// Only start express server in webhook mode (needs port for webhook)
// In polling mode, the bot doesn't need a web server
app.get('/', (req, res) => res.json({ status: 'ok', bot: 'RewardNexus', version: '2.1' }));

// Webhook endpoint para Vercel
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Postback endpoint for Monetag S2S
app.get('/postback', (req, res) => {
  const { subid, payout, status } = req.query;
  if (status === '1' || status === 'true') {
    const userId = parseInt(subid);
    if (userId && users.has(userId)) {
      const user = users.get(userId);
      const coins = Math.floor(parseFloat(payout || 0) * 100);
      user.coins += coins;
      user.totalEarned += coins;
      user.tasksCompleted += 1;
      saveUser(user);
      bot.sendMessage(userId, `📈 ¡Oferta completada!\n\n🪙 +${coins} monedas acreditadas\n💰 Balance: ${user.coins} ($${(user.coins/100).toFixed(2)} USD)`);
    }
  }
  res.send('OK');
});

// En modo polling no necesitamos servidor express

// ============ DATABASE ============
const users = new Map();
const pendingWithdrawals = new Map();
const achievements = [
  { id: 'first_task', name: 'Primera Tarea', desc: 'Completa tu primera tarea', emoji: '🎯', check: u => u.tasksCompleted >= 1 },
  { id: 'ten_tasks', name: 'Trabajador', desc: 'Completa 10 tareas', emoji: '💼', check: u => u.tasksCompleted >= 10 },
  { id: 'fifty_tasks', name: 'Emprendedor', desc: 'Completa 50 tareas', emoji: '🚀', check: u => u.tasksCompleted >= 50 },
  { id: 'first_referral', name: 'Influencer', desc: 'Refiere a 1 amigo', emoji: '👥', check: u => u.referrals >= 1 },
  { id: 'five_referrals', name: 'Networker', desc: 'Refiere a 5 amigos', emoji: '🌟', check: u => u.referrals >= 5 },
  { id: 'ten_referrals', name: 'Lider', desc: 'Refiere a 10 amigos', emoji: '👑', check: u => u.referrals >= 10 },
  { id: 'gamer_10', name: 'Gamer Casual', desc: 'Juega 10 partidas', emoji: '🎮', check: u => u.gamesPlayed >= 10 },
  { id: 'gamer_50', name: 'Gamer Pro', desc: 'Juega 50 partidas', emoji: '🏆', check: u => u.gamesPlayed >= 50 },
  { id: 'streak_7', name: 'Constante', desc: 'Racha de 7 dias', emoji: '🔥', check: u => u.dailyStreak >= 7 },
  { id: 'streak_30', name: 'Imparable', desc: 'Racha de 30 dias', emoji: '⚡', check: u => u.dailyStreak >= 30 },
  { id: 'earned_1000', name: 'Primer Millon', desc: 'Gana 1000 monedas', emoji: '🪙', check: u => u.totalEarned >= 1000 },
  { id: 'earned_5000', name: 'Magnate', desc: 'Gana 5000 monedas', emoji: '💰', check: u => u.totalEarned >= 5000 },
];

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      id, username: '', coins: 0, xp: 0, level: 1, referrals: 0,
      referralCode: 'RN' + id.toString(36).toUpperCase(),
      tasksCompleted: 0, gamesPlayed: 0, totalEarned: 0,
      joinedAt: Date.now(), lastDaily: 0, dailyStreak: 0,
      vipTier: 'Bronze', withdrawals: [], achievements: []
    });
  }
  return users.get(id);
}
function saveUser(u) { users.set(u.id, u); }

// ============ LEVELS ============
const TIERS = [
  { name: 'Bronze', min: 1, color: '🥉', bonus: 0, maxDaily: 50 },
  { name: 'Silver', min: 5, color: '🥈', bonus: 0.1, maxDaily: 100 },
  { name: 'Gold', min: 15, color: '🥇', bonus: 0.2, maxDaily: 200 },
  { name: 'Platinum', min: 30, color: '🪙', bonus: 0.35, maxDaily: 500 },
  { name: 'Diamond', min: 50, color: '💠', bonus: 0.5, maxDaily: 1000 }
];

function getTier(level) {
  let tier = TIERS[0];
  for (const t of TIERS) if (level >= t.min) tier = t;
  return tier;
}
function xpForLevel(level) { return 100 + (level - 1) * 50; }

function addXP(user, amount) {
  const tier = getTier(user.level);
  const bonusAmount = Math.floor(amount * (1 + tier.bonus));
  user.xp += bonusAmount;
  let leveledUp = false;
  while (user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level);
    user.level += 1;
    leveledUp = true;
  }
  user.vipTier = getTier(user.level).name;
  return { gained: bonusAmount, leveledUp };
}

function checkAchievements(user) {
  const newOnes = [];
  for (const a of achievements) {
    if (!user.achievements.includes(a.id) && a.check(user)) {
      user.achievements.push(a.id);
      newOnes.push(a);
    }
  }
  return newOnes;
}

// ============ MENUS ============
function mainMenu(user) {
  const tier = getTier(user.level);
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Minijuegos', callback_data: 'games' }, { text: '🪙 Tareas & Ofertas', callback_data: 'tasks' }],
        [{ text: '📊 Dashboard', callback_data: 'dashboard' }, { text: '🏆 Logros', callback_data: 'achievements' }],
        [{ text: '💰 Cartera', callback_data: 'wallet' }, { text: '👥 Referidos', callback_data: 'referrals' }],
        [{ text: '📈 Ranking', callback_data: 'leaderboard' }, { text: '🌐 Web App', url: WEBAPP_URL }],
        [{ text: '📱 Descargar App', callback_data: 'download' }]
      ]
    }
  };
}

function gamesMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎲 Dado Magico', callback_data: 'game_dice' }, { text: '🎯 Adivina', callback_data: 'game_guess' }],
        [{ text: '🪙 Cara o Cruz', callback_data: 'game_coinflip' }, { text: '🎰 Slot', callback_data: 'game_slot' }],
        [{ text: '🔢 Lucky Number', callback_data: 'game_lucky' }, { text: '🃏 High/Low', callback_data: 'game_highlow' }],
        [{ text: '⬅️ Menu', callback_data: 'main' }]
      ]
    }
  };
}

function tasksMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎁 Muro CPA - $0.50-$3.00', callback_data: 'offer_cpa' }],
        [{ text: '₿ Bono Cripto - Binance VIP', callback_data: 'offer_crypto' }],
        [{ text: '📺 Ver Anuncio +15 monedas', callback_data: 'offer_ad' }],
        [{ text: '📋 Tarea Diaria', callback_data: 'daily_task' }],
        [{ text: '🔥 Oferta Especial', callback_data: 'offer_special' }],
        [{ text: '⬅️ Menu', callback_data: 'main' }]
      ]
    }
  };
}

// ============ COMMANDS ============
bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  user.username = msg.from.username || msg.from.first_name || 'Usuario';
  saveUser(user);

  if (match && match[1]) {
    const refCode = match[1];
    if (!refCode.startsWith('RN') || refCode === user.referralCode) return;
    for (const u of users.values()) {
      if (u.referralCode === refCode && u.id !== chatId) {
        u.referrals += 1;
        u.coins += 50; u.totalEarned += 50;
        addXP(u, 20); saveUser(u);
        user.coins += 25; addXP(user, 10);
        saveUser(user);
        bot.sendMessage(u.id, `🎉 Nuevo referido: ${user.username}\n📈 +50 🪙 +20 XP\n👥 Total: ${u.referrals}`);
      }
    }
  }

  saveUser(user);
  const tier = getTier(user.level);
  const text =
    `🚀 *RewardNexus*\n\n` +
    `Bienvenido, ${user.username}!\n` +
    `📊 Nivel: ${user.level} ${tier.color} ${tier.name}\n` +
    `⚡ XP: ${user.xp}/${xpForLevel(user.level)}\n` +
    `🪙 Balance: ${user.coins} ($${(user.coins/100).toFixed(2)} USD)\n` +
    `👥 Referidos: ${user.referrals}\n` +
    `🔥 Racha: ${user.dailyStreak} dias\n\n` +
    `Completa tareas, juega y refiere amigos para ganar monedas.\n` +
    `_100 🪙 = $1.00 USD_\n\n` +
    `🔗 Codigo de referido: \`${user.referralCode}\``;

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(user) });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `📚 *RewardNexus - Comandos*\n\n` +
    `/start - Menu principal\n` +
    `/juegos - Minijuegos\n` +
    `/tareas - Tareas y ofertas\n` +
    `/cartera - Tu cartera\n` +
    `/referidos - Sistema de referidos\n` +
    `/nivel - Tu nivel y progreso\n` +
    `/ranking - Top 10 usuarios\n` +
    `/logros - Logros desbloqueados\n` +
    `/stats - Estadisticas globales\n` +
    `/bonus - Bonuses disponibles\n` +
    `/share - Compartir progreso\n` +
    `/app - Descargar app\n` +
    `/admin - Panel admin\n\n` +
    `_100 🪙 = $1.00 USD_`,
    { parse_mode: 'Markdown', ...mainMenu(getUser(msg.chat.id)) });
});

bot.onText(/\/juegos/, (msg) => {
  bot.sendMessage(msg.chat.id, '🎮 *Minijuegos*\n\nJuega y gana XP + monedas', { parse_mode: 'Markdown', ...gamesMenu() });
});

bot.onText(/\/tareas/, (msg) => {
  bot.sendMessage(msg.chat.id, '🪙 *Tareas y Ofertas*\n\nGana monedas reales:', { parse_mode: 'Markdown', ...tasksMenu() });
});

bot.onText(/\/cartera/, (msg) => showWallet(msg.chat.id, getUser(msg.chat.id), null));
bot.onText(/\/referidos/, (msg) => showReferrals(msg.chat.id, getUser(msg.chat.id), null));
bot.onText(/\/nivel/, (msg) => showLevel(msg.chat.id, getUser(msg.chat.id), null));
bot.onText(/\/logros/, (msg) => showAchievements(msg.chat.id, getUser(msg.chat.id), null));
bot.onText(/\/ranking/, (msg) => showLeaderboard(msg.chat.id, null));
bot.onText(/\/stats/, (msg) => showStats(msg.chat.id));
bot.onText(/\/bonus/, (msg) => showBonuses(msg.chat.id, getUser(msg.chat.id)));
bot.onText(/\/share/, (msg) => shareProgress(msg.chat.id, getUser(msg.chat.id)));
bot.onText(/\/app/, (msg) => showDownload(msg.chat.id, null));

bot.onText(/\/admin/, (msg) => {
  if (ADMIN_ID && msg.chat.id.toString() !== ADMIN_ID) return bot.sendMessage(msg.chat.id, '❌ Solo el admin puede usar este comando.');
  const totalUsers = users.size;
  const totalCoins = [...users.values()].reduce((s, u) => s + u.coins, 0);
  const totalPaid = [...users.values()].reduce((s, u) => s + u.totalEarned, 0);
  bot.sendMessage(msg.chat.id,
    `🔧 *Panel Admin - RewardNexus*\n\n` +
    `👥 Usuarios: ${totalUsers}\n` +
    `🪙 En circulacion: ${totalCoins} ($${(totalCoins/100).toFixed(2)})\n` +
    `📊 Total generado: ${totalPaid} 🪙\n` +
    `💸 Retiros pendientes: ${pendingWithdrawals.size}\n\n` +
    `_Comandos: /withdrawals | /pay <id> <amt> | /broadcast <msg>_`,
    { parse_mode: 'Markdown' });
});

// ============ CALLBACKS ============
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const user = getUser(chatId);
  user.username = query.from.username || query.from.first_name || 'Usuario';
  saveUser(user);

  if (data === 'claim_ad') {
    user.coins += 15; user.tasksCompleted++; user.totalEarned += 15;
    addXP(user, 5); saveUser(user);
    const ach = checkAchievements(user);
    let msg = `✅ +15 🪙 acreditadas\n📈 Balance: ${user.coins}`;
    if (ach.length) msg += `\n🏆 Logro: ${ach[0].emoji} ${ach[0].name}!`;
    bot.answerCallbackQuery(query.id, { text: '+15 🪙 +5 XP' });
    bot.editMessageText(msg, { chat_id: chatId, message_id: query.message.message_id, ...tasksMenu() });
    return;
  }

  if (data === 'confirm_withdraw') {
    if (user.coins < 100) { bot.answerCallbackQuery(query.id, { text: 'Necesitas minimo 100 🪙' }); return; }
    const amount = user.coins;
    pendingWithdrawals.set(chatId, { user, amount, date: Date.now() });
    bot.answerCallbackQuery(query.id, { text: 'Solicitud enviada' });
    bot.editMessageText(
      `✅ *Retiro Solicitado*\n\n🪙 ${amount} ($${(amount/100).toFixed(2)})\nID: ${chatId}\n\nEl admin procesara tu pago.`,
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
    if (ADMIN_ID) bot.sendMessage(ADMIN_ID, `💸 *Retiro pendiente*\nUsuario: ${user.username}\nID: ${chatId}\n🪙 ${amount} ($${(amount/100).toFixed(2)})`, { parse_mode: 'Markdown' });
    return;
  }

  switch(data) {
    case 'main': bot.editMessageText(`🚀 *RewardNexus*\n\nNivel ${user.level} ${getTier(user.level).color} | 🪙 ${user.coins}`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) }); break;
    case 'games': bot.editMessageText('🎮 *Minijuegos*\n\nJuega y gana XP + monedas', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...gamesMenu() }); break;
    case 'tasks': bot.editMessageText('🪙 *Tareas y Ofertas*\n\nGana monedas reales:', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...tasksMenu() }); break;
    case 'game_dice': handleDice(chatId, query); break;
    case 'game_guess': handleGuess(chatId, query); break;
    case 'game_coinflip': handleCoinFlip(chatId, query); break;
    case 'game_slot': handleSlot(chatId, query); break;
    case 'game_lucky': handleLucky(chatId, query); break;
    case 'game_highlow': handleHighLow(chatId, query); break;
    case 'offer_cpa': handleCPA(chatId, query); break;
    case 'offer_crypto': handleCrypto(chatId, query); break;
    case 'offer_ad': handleAd(chatId, query); break;
    case 'offer_special': handleSpecial(chatId, query); break;
    case 'daily_task': handleDaily(chatId, query); break;
    case 'dashboard': showDashboard(chatId, user, query); break;
    case 'wallet': showWallet(chatId, user, query); break;
    case 'referrals': showReferrals(chatId, user, query); break;
    case 'level': showLevel(chatId, user, query); break;
    case 'achievements': showAchievements(chatId, user, query); break;
    case 'leaderboard': showLeaderboard(chatId, query); break;
    case 'download': showDownload(chatId, query); break;
    case 'withdraw': showWithdraw(chatId, user, query); break;
    default:
      if (data.startsWith('guess_')) handleGuessAnswer(chatId, query, data);
      else if (data.startsWith('flip_')) handleFlipChoice(chatId, query, data);
      else if (data.startsWith('slot_')) handleSlotSpin(chatId, query, data);
      else if (data.startsWith('lucky_')) handleLuckyPick(chatId, query, data);
      else if (data.startsWith('hl_')) handleHighLowChoice(chatId, query, data);
      break;
  }
});

// ============ DASHBOARD ============
function showDashboard(chatId, user, query) {
  const tier = getTier(user.level);
  const xpNeeded = xpForLevel(user.level);
  const xpPct = Math.floor((user.xp / xpNeeded) * 100);
  const bar = '█'.repeat(Math.floor(xpPct/10)) + '░'.repeat(10 - Math.floor(xpPct/10));
  const text =
    `📊 *Dashboard - RewardNexus*\n\n` +
    `${tier.color} ${tier.name} | Nivel ${user.level}\n` +
    `⚡ XP: ${bar} ${user.xp}/${xpNeeded}\n` +
    `📈 Bonus: +${(tier.bonus*100)}% ganancias\n\n` +
    `🪙 Balance: ${user.coins} ($${(user.coins/100).toFixed(2)})\n` +
    `🎮 Juegos: ${user.gamesPlayed}\n` +
    `📋 Tareas: ${user.tasksCompleted}\n` +
    `👥 Referidos: ${user.referrals}\n` +
    `🏆 Total: ${user.totalEarned} 🪙\n` +
    `🔥 Racha: ${user.dailyStreak} dias\n` +
    `🏅 Logros: ${user.achievements.length}/${achievements.length}`;
  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(user) });
}

function showLevel(chatId, user, query) {
  const tier = getTier(user.level);
  let tiers = '';
  for (const t of TIERS) {
    const cur = t.name === user.vipTier ? '👈' : (user.level >= t.min ? '✅' : '🔒');
    tiers += `${cur} ${t.color} ${t.name} (Nv${t.min}+) +${(t.bonus*100)}%\n`;
  }
  const text = `🏆 *Niveles*\n\nNivel ${user.level} ${tier.color} ${tier.name}\nXP: ${user.xp}/${xpForLevel(user.level)}\n\n${tiers}\n_Sube completando tareas y jugando_`;
  bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
}

function showAchievements(chatId, user, query) {
  let text = `🏅 *Logros*\n\nDesbloqueados: ${user.achievements.length}/${achievements.length}\n\n`;
  for (const a of achievements) {
    const got = user.achievements.includes(a.id);
    text += `${got ? '✅' : '🔒'} ${a.emoji} ${a.name} - ${a.desc}\n`;
  }
  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(user) });
}

function showLeaderboard(chatId, query) {
  const sorted = [...users.values()].sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 10);
  let text = `📈 *Ranking Global*\n\n`;
  sorted.forEach((u, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
    text += `${medal} ${u.username} - ${u.totalEarned} 🪙 (Nv${u.level})\n`;
  });
  if (!sorted.length) text += 'Aun no hay datos. Se el primero!';
  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
}

function showStats(chatId) {
  const all = [...users.values()];
  const totalEarned = all.reduce((s, u) => s + u.totalEarned, 0);
  const avgLevel = all.length ? (all.reduce((s, u) => s + u.level, 0) / all.length).toFixed(1) : 0;
  bot.sendMessage(chatId,
    `📊 *Estadisticas RewardNexus*\n\n` +
    `👥 Usuarios: ${all.length}\n` +
    `🪙 Generado: ${totalEarned} ($${(totalEarned/100).toFixed(2)})\n` +
    `📊 Nivel promedio: ${avgLevel}\n` +
    `🎮 Partidas jugadas: ${all.reduce((s,u)=>s+u.gamesPlayed,0)}\n` +
    `📋 Tareas completadas: ${all.reduce((s,u)=>s+u.tasksCompleted,0)}`,
    { parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
}

function showBonuses(chatId, user) {
  const tier = getTier(user.level);
  bot.sendMessage(chatId,
    `⚡ *Bonuses Disponibles*\n\n` +
    `${tier.color} Tier ${tier.name}: +${(tier.bonus*100)}% en todas las ganancias\n` +
    `🔥 Racha ${user.dailyStreak} dias: +${Math.min(user.dailyStreak*2,30)} 🪙 extra en daily\n` +
    `👥 Referral: +50 🪙 por amigo, +25 🪙 para el\n` +
    `📺 Anuncio: +15 🪙 por visionado\n\n` +
    `_Sigue subiendo de nivel para mejores bonuses_`,
    { parse_mode: 'Markdown', ...mainMenu(user) });
}

function shareProgress(chatId, user) {
  const tier = getTier(user.level);
  const text =
    `🚀 *RewardNexus*\n\n` +
    `📊 Mi progreso:\n` +
    `${tier.color} Nivel ${user.level} - ${tier.name}\n` +
    `🪙 ${user.coins} monedas ($${(user.coins/100).toFixed(2)})\n` +
    `🏆 ${user.totalEarned} ganados\n` +
    `👥 ${user.referrals} referidos\n` +
    `🔥 ${user.dailyStreak} dias de racha\n\n` +
    `Únete y gana dinero real:\nhttps://t.me/${bot.username || 'xpe_official_bot'}?start=${user.referralCode}`;
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

// ============ GAMES ============
function handleDice(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.sendDice(chatId, { emoji: '🎲' }).then(msg => {
    setTimeout(() => {
      const val = msg.dice.value;
      const user = getUser(chatId);
      let reward, xp, result;
      if (val === 6) { reward = 30; xp = 15; result = `🎉 JACKPOT! Sacaste ${val}`; }
      else if (val >= 4) { reward = 10; xp = 8; result = `📈 Sacaste ${val} +${reward} 🪙`; }
      else { reward = 2; xp = 5; result = `📉 Sacaste ${val} +${reward} 🪙`; }
      user.coins += reward; user.gamesPlayed++; user.totalEarned += reward;
      const xpR = addXP(user, xp); saveUser(user);
      const ach = checkAchievements(user); saveUser(user);
      if (xpR.leveledUp) result += `\n🚀 SUBISTE AL NIVEL ${user.level}!`;
      if (ach.length) result += `\n🏆 Logro: ${ach[0].emoji} ${ach[0].name}!`;
      bot.sendMessage(chatId, `${result}\n⚡ +${xpR.gained} XP`, gamesMenu());
    }, 3000);
  }).catch(() => bot.sendMessage(chatId, 'Error. Intenta de nuevo.', gamesMenu()));
}

function handleGuess(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText('🎯 *Adivina el numero (1-5)*\nAciertas = 40🪙+15XP', {
    chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [
      [{ text: '1️⃣', callback_data: 'guess_1' }, { text: '2️⃣', callback_data: 'guess_2' }, { text: '3️⃣', callback_data: 'guess_3' }, { text: '4️⃣', callback_data: 'guess_4' }, { text: '5️⃣', callback_data: 'guess_5' }],
      [{ text: '⬅️ Volver', callback_data: 'games' }]
    ]}
  });
}

function handleGuessAnswer(chatId, query, data) {
  const guess = parseInt(data.split('_')[1]);
  const secret = Math.floor(Math.random() * 5) + 1;
  const user = getUser(chatId);
  let reward, xpGain, result;
  if (guess === secret) { reward = 40; xpGain = 15; result = `🎯 CORRECTO! Era ${secret}`; }
  else { reward = 5; xpGain = 5; result = `📉 Era ${secret}, elegiste ${guess}`; }
  user.coins += reward; user.gamesPlayed++; user.totalEarned += reward;
  const xp = addXP(user, xpGain); const ach = checkAchievements(user); saveUser(user);
  if (xp.leveledUp) result += `\n🚀 NIVEL ${user.level}!`;
  if (ach.length) result += `\n🏆 ${ach[0].emoji} ${ach[0].name}!`;
  bot.answerCallbackQuery(query.id, { text: result.replace(/\n/g, ' ') });
  bot.editMessageText(`${result}\n📈 +${reward} 🪙 ⚡ +${xp.gained} XP`, { chat_id: chatId, message_id: query.message.message_id, ...gamesMenu() });
}

function handleCoinFlip(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText('🪙 *Cara o Cruz?*\nAcertas = 20🪙+10XP', {
    chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [
      [{ text: '🪙 Cara', callback_data: 'flip_cara' }, { text: '🪙 Cruz', callback_data: 'flip_cruz' }],
      [{ text: '⬅️ Volver', callback_data: 'games' }]
    ]}
  });
}

function handleFlipChoice(chatId, query, data) {
  const choice = data.split('_')[1];
  const result = Math.random() < 0.5 ? 'cara' : 'cruz';
  const user = getUser(chatId);
  let reward, xpGain, msg;
  if (choice === result) { reward = 20; xpGain = 10; msg = `🪙 SALIO ${result.toUpperCase()} 📈 Ganaste!`; }
  else { reward = 3; xpGain = 4; msg = `🪙 SALIO ${result.toUpperCase()} 📉 Perdiste`; }
  user.coins += reward; user.gamesPlayed++; user.totalEarned += reward;
  const xp = addXP(user, xpGain); saveUser(user);
  if (xp.leveledUp) msg += `\n🚀 NIVEL ${user.level}!`;
  bot.answerCallbackQuery(query.id, { text: msg.replace(/\n/g, ' ') });
  bot.editMessageText(`${msg}\n📈 +${reward} 🪙 ⚡ +${xp.gained} XP`, { chat_id: chatId, message_id: query.message.message_id, ...gamesMenu() });
}

function handleSlot(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText('🎰 *Slot Machine*\nApostar 5🪙 - 3 iguales = 50🪙', {
    chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [
      [{ text: '🎰 GIRAR', callback_data: 'slot_spin' }],
      [{ text: '⬅️ Volver', callback_data: 'games' }]
    ]}
  });
}

function handleSlotSpin(chatId, query, data) {
  const user = getUser(chatId);
  if (user.coins < 5) { bot.answerCallbackQuery(query.id, { text: 'Necesitas 5 🪙' }); return; }
  user.coins -= 5;
  const emojis = ['🍒', '🍋', '🍊', '🍇', '🪙', '7️⃣'];
  const r1 = emojis[Math.floor(Math.random() * emojis.length)];
  const r2 = emojis[Math.floor(Math.random() * emojis.length)];
  const r3 = emojis[Math.floor(Math.random() * emojis.length)];
  let reward = 0, xpGain = 3, msg;
  if (r1 === r2 && r2 === r3) { reward = 50; xpGain = 20; msg = `🎰 ${r1}${r2}${r3}\n🎉 JACKPOT! +50 🪙`; }
  else if (r1 === r2 || r2 === r3 || r1 === r3) { reward = 10; xpGain = 8; msg = `🎰 ${r1}${r2}${r3}\n📈 Pareja! +10 🪙`; }
  else { reward = 0; msg = `🎰 ${r1}${r2}${r3}\n📉 Sin suerte. -5 🪙`; }
  user.coins += reward; user.gamesPlayed++; user.totalEarned += reward;
  const xp = addXP(user, xpGain); saveUser(user);
  if (xp.leveledUp) msg += `\n🚀 NIVEL ${user.level}!`;
  bot.answerCallbackQuery(query.id, { text: msg.replace(/\n/g, ' ') });
  bot.editMessageText(`${msg}\n🪙 Balance: ${user.coins}`, { chat_id: chatId, message_id: query.message.message_id, ...gamesMenu() });
}

function handleLucky(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText('🔢 *Lucky Number*\nElige 1-10. Acertas = 100🪙!', {
    chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [
      [{ text: '1', callback_data: 'lucky_1' }, { text: '2', callback_data: 'lucky_2' }, { text: '3', callback_data: 'lucky_3' }, { text: '4', callback_data: 'lucky_4' }, { text: '5', callback_data: 'lucky_5' }],
      [{ text: '6', callback_data: 'lucky_6' }, { text: '7', callback_data: 'lucky_7' }, { text: '8', callback_data: 'lucky_8' }, { text: '9', callback_data: 'lucky_9' }, { text: '10', callback_data: 'lucky_10' }],
      [{ text: '⬅️ Volver', callback_data: 'games' }]
    ]}
  });
}

function handleLuckyPick(chatId, query, data) {
  const pick = parseInt(data.split('_')[1]);
  const secret = Math.floor(Math.random() * 10) + 1;
  const user = getUser(chatId);
  let reward, xpGain, msg;
  if (pick === secret) { reward = 100; xpGain = 30; msg = `🎯 ${pick} = ${secret} JACKPOT! +100 🪙`; }
  else if (Math.abs(pick - secret) === 1) { reward = 20; xpGain = 10; msg = `📈 Casi! ${pick} vs ${secret} +20 🪙`; }
  else { reward = 2; xpGain = 5; msg = `📉 ${pick} vs ${secret} +2 🪙`; }
  user.coins += reward; user.gamesPlayed++; user.totalEarned += reward;
  const xp = addXP(user, xpGain); saveUser(user);
  if (xp.leveledUp) msg += `\n🚀 NIVEL ${user.level}!`;
  bot.answerCallbackQuery(query.id, { text: msg.replace(/\n/g, ' ') });
  bot.editMessageText(`${msg}\n🪙 Balance: ${user.coins}`, { chat_id: chatId, message_id: query.message.message_id, ...gamesMenu() });
}

function handleHighLow(chatId, query) {
  bot.answerCallbackQuery(query.id);
  const current = Math.floor(Math.random() * 50) + 1;
  bot.editMessageText(`🃏 *High or Low?*\n\nNumero actual: *${current}*\nAdivina si el siguiente sera mayor o menor\n\nAcertas = 25🪙+12XP`, {
    chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [
      [{ text: '📈 Mayor', callback_data: `hl_high_${current}` }, { text: '📉 Menor', callback_data: `hl_low_${current}` }],
      [{ text: '⬅️ Volver', callback_data: 'games' }]
    ]}
  });
}

function handleHighLowChoice(chatId, query, data) {
  const parts = data.split('_');
  const choice = parts[1];
  const current = parseInt(parts[2]);
  const next = Math.floor(Math.random() * 50) + 1;
  const user = getUser(chatId);
  let win = (choice === 'high' && next > current) || (choice === 'low' && next < current);
  let reward, xpGain, msg;
  if (win) { reward = 25; xpGain = 12; msg = `🃏 ${current} → ${next}\n📈 Ganaste! +25 🪙`; }
  else { reward = 3; xpGain = 5; msg = `🃏 ${current} → ${next}\n📉 Perdiste +3 🪙`; }
  user.coins += reward; user.gamesPlayed++; user.totalEarned += reward;
  const xp = addXP(user, xpGain); saveUser(user);
  if (xp.leveledUp) msg += `\n🚀 NIVEL ${user.level}!`;
  bot.answerCallbackQuery(query.id, { text: msg.replace(/\n/g, ' ') });
  bot.editMessageText(`${msg}\n🪙 Balance: ${user.coins}`, { chat_id: chatId, message_id: query.message.message_id, ...gamesMenu() });
}

// ============ OFFERS ============
function handleCPA(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText(
    `🎁 *Muro de Ofertas CPA*\n\n` +
    `Gana $0.50-$3.00 por accion:\n\n` +
    `• Descarga apps y juegos\n• Responde encuestas\n• Prueba servicios\n\n` +
    `Recompensa: 100-300 🪙 por oferta\n` +
    `Bonus nivel: +${(getTier(getUser(chatId).level).bonus*100)}%\n\n` +
    `🔗 [Abrir Muro](${CPA_LINK})\n\n` +
    `_Envia captura al admin para reclamar_`,
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
}

function handleCrypto(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText(
    `₿ *Bono Cripto - Binance*\n\n` +
    `Abre cuenta en Binance y gana:\n\n` +
    `✅ VIP permanente en RewardNexus\n✅ +200 🪙 monedas\n✅ +50 XP\n✅ Hasta $50 USD en comisiones\n\n` +
    `🔗 [Registrarse](${CRYPTO_LINK})\n\n` +
    `_Envia tu ID de Binance al admin_`,
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
}

function handleAd(chatId, query) {
  bot.answerCallbackQuery(query.id);
  const user = getUser(chatId);
  bot.editMessageText(
    `📺 *Ver Anuncio (Monetag)*\n\n` +
    `Recompensa: 15 🪙 + 5 XP\n` +
    `Bonus nivel: +${(getTier(user.level).bonus*100)}%\n\n` +
    `🔗 [Ver Anuncio](${MONETAG_LINK})`,
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [
        [{ text: '✅ Ya vi el anuncio - Reclamar', callback_data: 'claim_ad' }],
        [{ text: '⬅️ Volver', callback_data: 'tasks' }]
      ]}
    });
}

function handleSpecial(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText(
    `🔥 *Oferta Especial*\n\n` +
    `Completa 3 ofertas seguidas:\n\n` +
    `1. Ver anuncio (15 🪙)\n2. Muro CPA (100+ 🪙)\n3. Tarea diaria (10+ 🪙)\n\n` +
    `Completa todas y recibe +50 🪙 bonus!`,
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...tasksMenu() });
}

function handleDaily(chatId, query) {
  const user = getUser(chatId);
  const now = Date.now();
  const oneDay = 86400000;
  if (now - user.lastDaily < oneDay) {
    const remaining = Math.ceil((oneDay - (now - user.lastDaily)) / 3600000);
    bot.answerCallbackQuery(query.id, { text: `Vuelve en ${remaining}h` });
    return;
  }
  user.dailyStreak = (now - user.lastDaily < 2*oneDay) ? user.dailyStreak + 1 : 1;
  const streakBonus = Math.min(user.dailyStreak * 2, 30);
  const baseReward = 10 + streakBonus;
  const tier = getTier(user.level);
  const totalReward = Math.floor(baseReward * (1 + tier.bonus));
  user.coins += totalReward; user.tasksCompleted++; user.totalEarned += totalReward;
  user.lastDaily = now; addXP(user, 10);
  const ach = checkAchievements(user); saveUser(user);
  let msg = `📋 *Tarea Diaria*\n\n+${totalReward} 🪙 + 10 XP\n🔥 Racha: ${user.dailyStreak} dias\n🪙 Balance: ${user.coins}`;
  if (ach.length) msg += `\n🏆 Logro: ${ach[0].emoji} ${ach[0].name}!`;
  bot.answerCallbackQuery(query.id, { text: `+${totalReward} 🪙 Racha: ${user.dailyStreak}!` });
  bot.editMessageText(msg, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
}

// ============ WALLET ============
function showWallet(chatId, user, query) {
  const text =
    `💰 *Cartera*\n\n` +
    `🪙 Balance: ${user.coins}\n` +
    `💵 Valor: $${(user.coins/100).toFixed(2)} USD\n` +
    `📊 Tareas: ${user.tasksCompleted}\n` +
    `🎮 Juegos: ${user.gamesPlayed}\n` +
    `👥 Referidos: ${user.referrals}\n` +
    `🏆 Ganado: ${user.totalEarned} 🪙\n\n` +
    `_100 🪙 = $1.00 USD_`;
  const kb = { reply_markup: { inline_keyboard: [
    [{ text: '💸 Retirar', callback_data: 'withdraw' }, { text: '📋 Diaria', callback_data: 'daily_task' }],
    [{ text: '⬅️ Menu', callback_data: 'main' }]
  ]}};
  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...kb });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...kb });
}

function showWithdraw(chatId, user, query) {
  if (user.coins < 100) { bot.answerCallbackQuery(query.id, { text: 'Necesitas minimo 100 🪙' }); return; }
  bot.answerCallbackQuery(query.id);
  bot.editMessageText(
    `💸 *Retirar*\n\nDisponible: ${user.coins} 🪙 ($${(user.coins/100).toFixed(2)})\n\n` +
    `Metodos: PayPal, Binance Pay, Telegram Stars\n\nMinimo: 100 🪙 ($1.00)\nID: ${chatId}`,
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [
        [{ text: '✅ Confirmar Retiro', callback_data: 'confirm_withdraw' }],
        [{ text: '⬅️ Volver', callback_data: 'wallet' }]
      ]}
    });
}

// ============ REFERRALS ============
function showReferrals(chatId, user, query) {
  const botName = bot.username || 'xpe_official_bot';
  const text =
    `👥 *Referidos*\n\n` +
    `Codigo: \`${user.referralCode}\`\n` +
    `Enlace: https://t.me/${botName}?start=${user.referralCode}\n\n` +
    `Referidos: ${user.referrals}\n` +
    `Ganado: ${user.referrals * 50} 🪙\n\n` +
    `💰 Tu ganas 50 🪙 por referido\nTu amigo gana 25 🪙 al entrar`;
  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(user) });
}

// ============ DOWNLOAD ============
function showDownload(chatId, query) {
  const text =
    `📱 *Descargar App*\n\n` +
    `🔗 [APK Android](https://github.com/xpeee-banned/BOT-FATHER/releases)\n` +
    `🌐 [Web App](${WEBAPP_URL})\n` +
    `🤖 [Bot Telegram](https://t.me/${bot.username || 'xpe_official_bot'})`;
  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
}

// ============ ERRORS ============
bot.on('polling_error', (e) => console.error('Polling:', e.message));
bot.on('webhook_error', (e) => console.error('Webhook:', e.message));

console.log('RewardNexus bot v2.1 iniciado');
