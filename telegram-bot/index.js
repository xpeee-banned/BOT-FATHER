/**
 * RewardNexus Telegram Bot - xpe.nettt
 * Plataforma de monetizacion con niveles, minijuegos, CPA, crypto y mas
 * Desplegado en Railway
 */

require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// ============ CONFIG ============
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://xpeee-banned.github.io/BOT-FATHER/';
const ADMIN_ID = process.env.ADMIN_ID || '';
const MONETAG_LINK = process.env.MONETAG_LINK || 'https://omg10.com/4/11368455';
const CPA_LINK = process.env.CPA_LINK || 'https://cpalead.com/';
const CRYPTO_LINK = process.env.CRYPTO_LINK || 'https://www.binance.com/es/register';

if (!TOKEN) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN no configurado');
  process.exit(1);
}

// ============ INIT ============
const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', bot: 'RewardNexus', version: '2.0' }));
app.get('/', (req, res) => res.json({ status: 'ok', bot: 'RewardNexus', version: '2.0' }));

// Postback endpoint for Monetag S2S
app.get('/postback', (req, res) => {
  const { subid, payout, status } = req.query;
  if (status === '1' || status === 'true') {
    const userId = parseInt(subid);
    if (userId && users.has(userId)) {
      const user = users.get(userId);
      const diamonds = Math.floor(parseFloat(payout || 0) * 100);
      user.diamonds += diamonds;
      user.totalEarned += diamonds;
      user.tasksCompleted += 1;
      saveUser(user);
      bot.sendMessage(userId, '💎 ¡Oferta completada! +' + diamonds + ' diamantes acreditados.');
    }
  }
  res.send('OK');
});

app.listen(PORT, () => console.log('RewardNexus bot activo en puerto ' + PORT));

// ============ DATABASE ============
const users = new Map();
const pendingWithdrawals = new Map();

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      id: id,
      username: '',
      diamonds: 0,
      xp: 0,
      level: 1,
      referrals: 0,
      referralCode: 'RN' + id.toString(36).toUpperCase(),
      tasksCompleted: 0,
      gamesPlayed: 0,
      totalEarned: 0,
      joinedAt: Date.now(),
      lastDaily: 0,
      dailyStreak: 0,
      vipTier: 'Bronze',
      withdrawals: []
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
  { name: 'Platinum', min: 30, color: '💎', bonus: 0.35, maxDaily: 500 },
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

// ============ MENUS ============
function mainMenu(user) {
  const tier = getTier(user.level);
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎮 Minijuegos', callback_data: 'games' },
          { text: '💎 Tareas & Ofertas', callback_data: 'tasks' }
        ],
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '👥 Referidos', callback_data: 'referrals' }
        ],
        [
          { text: '💰 Cartera', callback_data: 'wallet' },
          { text: '🏆 Nivel ' + user.level + ' ' + tier.color, callback_data: 'level' }
        ],
        [
          { text: '📱 App', callback_data: 'download' },
          { text: '🌐 Web', url: WEBAPP_URL }
        ]
      ]
    }
  };
}

function gamesMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎲 Dado Magico', callback_data: 'game_dice' },
          { text: '🎯 Adivina', callback_data: 'game_guess' }
        ],
        [
          { text: '🪙 Cara o Cruz', callback_data: 'game_coinflip' },
          { text: '🎰 Slot (Pronto)', callback_data: 'game_soon' }
        ],
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
        [{ text: '📺 Ver Anuncio +15 diamantes', callback_data: 'offer_ad' }],
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

  if (match && match[1]) {
    const refCode = match[1];
    for (const u of users.values()) {
      if (u.referralCode === refCode && u.id !== chatId) {
        u.referrals += 1;
        const refReward = 50;
        u.diamonds += refReward;
        u.totalEarned += refReward;
        addXP(u, 20);
        saveUser(u);
        user.diamonds += 25;
        addXP(user, 10);
        saveUser(user);
        bot.sendMessage(u.id, '🎉 Nuevo referido: ' + user.username + '\n+50 💎 +20 XP');
      }
    }
  }

  saveUser(user);

  const tier = getTier(user.level);
  const text = '🚀 *RewardNexus*\n\n' +
    'Bienvenido, ' + user.username + '!\n' +
    'Nivel: ' + user.level + ' ' + tier.color + ' ' + tier.name + '\n' +
    'XP: ' + user.xp + '/' + xpForLevel(user.level) + '\n' +
    '💎 Balance: ' + user.diamonds + '\n' +
    '👥 Referidos: ' + user.referrals + '\n\n' +
    'Completa tareas, juega y refiere amigos para ganar diamantes.\n' +
    '100 💎 = $1.00 USD\n\n' +
    'Codigo de referido: `' + user.referralCode + '`';

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(user) });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '📚 *RewardNexus - Comandos*\n\n' +
    '/start - Menu principal\n' +
    '/juegos - Minijuegos\n' +
    '/tareas - Tareas y ofertas\n' +
    '/cartera - Tu cartera\n' +
    '/referidos - Sistema de referidos\n' +
    '/nivel - Tu nivel y progreso\n' +
    '/app - Descargar app\n' +
    '/admin - Panel admin (solo admin)',
    { parse_mode: 'Markdown', ...mainMenu(getUser(msg.chat.id)) });
});

bot.onText(/\/admin/, (msg) => {
  if (ADMIN_ID && msg.chat.id.toString() !== ADMIN_ID) {
    bot.sendMessage(msg.chat.id, '❌ Solo el admin puede usar este comando.');
    return;
  }
  const totalUsers = users.size;
  const totalDiamonds = [...users.values()].reduce((s, u) => s + u.diamonds, 0);
  const totalPaid = [...users.values()].reduce((s, u) => s + u.totalEarned, 0);
  const pending = pendingWithdrawals.size;
  
  bot.sendMessage(msg.chat.id,
    '🔧 *Panel Admin - RewardNexus*\n\n' +
    '👥 Usuarios: ' + totalUsers + '\n' +
    '💎 Diamantes en circulacion: ' + totalDiamonds + '\n' +
    '💵 Valor total: $' + (totalDiamonds / 100).toFixed(2) + '\n' +
    '📊 Total generado: ' + totalPaid + ' 💎\n' +
    '💸 Retiros pendientes: ' + pending + '\n\n' +
    'Comandos admin:\n' +
    '/withdrawals - Ver retiros pendientes\n' +
    '/pay <id> <amt> - Pagar retiro\n' +
    '/broadcast <msg> - Enviar mensaje a todos',
    { parse_mode: 'Markdown' });
});

// ============ CALLBACKS ============
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const user = getUser(chatId);
  user.username = query.from.username || query.from.first_name || 'Usuario';
  saveUser(user);

  // ---- CLAIM AD ----
  if (data === 'claim_ad') {
    user.diamonds += 15;
    user.tasksCompleted += 1;
    user.totalEarned += 15;
    addXP(user, 5);
    saveUser(user);
    bot.answerCallbackQuery(query.id, { text: '+15 💎 +5 XP' });
    bot.editMessageText('✅ +15 💎 acreditados\n💎 Balance: ' + user.diamonds, { chat_id: chatId, message_id: query.message.message_id, ...tasksMenu() });
    return;
  }

  // ---- CONFIRM WITHDRAW ----
  if (data === 'confirm_withdraw') {
    if (user.diamonds < 100) {
      bot.answerCallbackQuery(query.id, { text: 'Necesitas minimo 100 💎' });
      return;
    }
    const amount = user.diamonds;
    pendingWithdrawals.set(chatId, { user, amount, date: Date.now() });
    bot.answerCallbackQuery(query.id, { text: 'Solicitud enviada' });
    bot.editMessageText(
      '✅ *Retiro Solicitado*\n\n💎 ' + amount + ' ($' + (amount / 100).toFixed(2) + ')\nID: ' + chatId + '\n\nEl admin procesara tu pago.',
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
    if (ADMIN_ID) bot.sendMessage(ADMIN_ID, '💸 *Retiro pendiente*\nUsuario: ' + user.username + '\nID: ' + chatId + '\n💎 ' + amount + ' ($' + (amount / 100).toFixed(2) + ')', { parse_mode: 'Markdown' });
    return;
  }

  switch(data) {
    case 'main':
      bot.editMessageText('🚀 *RewardNexus*\n\nNivel ' + user.level + ' ' + getTier(user.level).color + ' | 💎 ' + user.diamonds, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
      break;
    case 'games':
      bot.editMessageText('🎮 *Minijuegos*\n\nJuega y gana XP + diamantes', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...gamesMenu() });
      break;
    case 'tasks':
      bot.editMessageText('💎 *Tareas y Ofertas*\n\nGana diamantes reales:', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...tasksMenu() });
      break;
    case 'game_dice': handleDice(chatId, query); break;
    case 'game_guess': handleGuess(chatId, query); break;
    case 'game_coinflip': handleCoinFlip(chatId, query); break;
    case 'game_soon': bot.answerCallbackQuery(query.id, { text: 'Pronto!' }); break;
    case 'offer_cpa': handleCPA(chatId, query); break;
    case 'offer_crypto': handleCrypto(chatId, query); break;
    case 'offer_ad': handleAd(chatId, query); break;
    case 'offer_special': handleSpecial(chatId, query); break;
    case 'daily_task': handleDaily(chatId, query); break;
    case 'dashboard': showDashboard(chatId, user, query); break;
    case 'wallet': showWallet(chatId, user, query); break;
    case 'referrals': showReferrals(chatId, user, query); break;
    case 'level': showLevel(chatId, user, query); break;
    case 'download': showDownload(chatId, query); break;
    case 'withdraw': showWithdraw(chatId, user, query); break;
    default:
      if (data.startsWith('guess_')) handleGuessAnswer(chatId, query, data);
      else if (data.startsWith('flip_')) handleFlipChoice(chatId, query, data);
      break;
  }
});

// ============ DASHBOARD ============
function showDashboard(chatId, user, query) {
  const tier = getTier(user.level);
  const xpNeeded = xpForLevel(user.level);
  const xpPct = Math.floor((user.xp / xpNeeded) * 100);
  const progressBar = '█'.repeat(Math.floor(xpPct / 10)) + '░'.repeat(10 - Math.floor(xpPct / 10));
  const conversionRate = (1 + tier.bonus).toFixed(2);
  
  const text = '📊 *Dashboard - RewardNexus*\n\n' +
    'Nivel ' + user.level + ' ' + tier.color + ' ' + tier.name + '\n' +
    'XP: ' + progressBar + ' ' + user.xp + '/' + xpNeeded + '\n' +
    'Bonus tier: +' + (tier.bonus * 100) + '% ganancias\n' +
    'Conversion: 1x = ' + conversionRate + 'x\n\n' +
    '💎 Balance: ' + user.diamonds + ' ($' + (user.diamonds / 100).toFixed(2) + ')\n' +
    '🎮 Juegos: ' + user.gamesPlayed + '\n' +
    '📋 Tareas: ' + user.tasksCompleted + '\n' +
    '👥 Referidos: ' + user.referrals + '\n' +
    '🏆 Total ganado: ' + user.totalEarned + ' 💎\n' +
    '🔥 Racha: ' + user.dailyStreak + ' dias\n\n' +
    '_Sigue subiendo de nivel para mejores recompensas_';

  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(user) });
}

// ============ LEVEL ============
function showLevel(chatId, user, query) {
  const tier = getTier(user.level);
  let tiersText = '';
  for (const t of TIERS) {
    const cur = t.name === user.vipTier ? '👈' : (user.level >= t.min ? '✅' : '🔒');
    tiersText += cur + ' ' + t.color + ' ' + t.name + ' (Nivel ' + t.min + '+) +' + (t.bonus * 100) + '% bonus\n';
  }
  const text = '🏆 *Sistema de Niveles*\n\n' +
    'Tu nivel: ' + user.level + ' ' + tier.color + ' ' + tier.name + '\n' +
    'XP: ' + user.xp + '/' + xpForLevel(user.level) + '\n\n' +
    tiersText + '\n' +
    '_Sube de nivel completando tareas y jugando para desbloquear mejores bonus de ganancias_';

  bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
}

// ============ GAMES ============
function handleDice(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.sendDice(chatId, { emoji: '🎲' }).then((msg) => {
    setTimeout(() => {
      const val = msg.dice.value;
      const user = getUser(chatId);
      let reward, xpGained, result;
      if (val === 6) { reward = 30; xpGained = 15; result = '🎉 JACKPOT! Sacaste ' + val; }
      else if (val >= 4) { reward = 10; xpGained = 8; result = '👍 Sacaste ' + val + ' +' + reward + ' 💎'; }
      else { reward = 2; xpGained = 5; result = '😅 Sacaste ' + val + ' +' + reward + ' 💎'; }
      user.diamonds += reward;
      user.gamesPlayed += 1;
      user.totalEarned += reward;
      const xp = addXP(user, xpGained);
      saveUser(user);
      if (xp.leveledUp) result += '\n🎊 SUBISTE AL NIVEL ' + user.level + '!';
      bot.sendMessage(chatId, result + '\n+' + xp.gained + ' XP', gamesMenu());
    }, 3000);
  }).catch(() => bot.sendMessage(chatId, 'Error. Intenta de nuevo.', gamesMenu()));
}

function handleGuess(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText('🎯 Elige un numero (1-5). Acertas = 40💎+15XP', {
    chat_id: chatId, message_id: query.message.message_id,
    reply_markup: { inline_keyboard: [
      [{ text: '1', callback_data: 'guess_1' }, { text: '2', callback_data: 'guess_2' }, { text: '3', callback_data: 'guess_3' }, { text: '4', callback_data: 'guess_4' }, { text: '5', callback_data: 'guess_5' }],
      [{ text: '⬅️ Volver', callback_data: 'games' }]
    ]}
  });
}

function handleGuessAnswer(chatId, query, data) {
  const guess = parseInt(data.split('_')[1]);
  const secret = Math.floor(Math.random() * 5) + 1;
  const user = getUser(chatId);
  let reward, xpGain, result;
  if (guess === secret) { reward = 40; xpGain = 15; result = '🎯 CORRECTO! Era ' + secret; }
  else { reward = 5; xpGain = 5; result = '❌ Era ' + secret + ', elegiste ' + guess; }
  user.diamonds += reward; user.gamesPlayed++; user.totalEarned += reward;
  const xp = addXP(user, xpGain); saveUser(user);
  if (xp.leveledUp) result += '\n🎊 NIVEL ' + user.level + '!';
  bot.answerCallbackQuery(query.id, { text: result.replace(/\n/g, ' ') });
  bot.editMessageText(result + '\n+' + reward + ' 💎 +' + xp.gained + ' XP', { chat_id: chatId, message_id: query.message.message_id, ...gamesMenu() });
}

function handleCoinFlip(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText('🪙 Cara o Cruz? Acertas = 20💎+10XP', {
    chat_id: chatId, message_id: query.message.message_id,
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
  if (choice === result) { reward = 20; xpGain = 10; msg = '🪙 Salio ' + result.toUpperCase() + ' Ganaste!'; }
  else { reward = 3; xpGain = 4; msg = '🪙 Salio ' + result.toUpperCase() + ' Perdiste'; }
  user.diamonds += reward; user.gamesPlayed++; user.totalEarned += reward;
  const xp = addXP(user, xpGain); saveUser(user);
  if (xp.leveledUp) msg += '\n🎊 NIVEL ' + user.level + '!';
  bot.answerCallbackQuery(query.id, { text: msg.replace(/\n/g, ' ') });
  bot.editMessageText(msg + '\n+' + reward + ' 💎 +' + xp.gained + ' XP', { chat_id: chatId, message_id: query.message.message_id, ...gamesMenu() });
}

// ============ OFFERS ============
function handleCPA(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText(
    '🎁 *Muro de Ofertas CPA*\n\n' +
    'Gana $0.50-$3.00 por accion:\n\n' +
    '• Descarga apps y juegos\n• Responde encuestas\n• Prueba servicios\n\n' +
    'Recompensa: 100-300 💎 por oferta\n' +
    'Bonus por nivel: +' + (getTier(getUser(chatId).level).bonus * 100) + '%\n\n' +
    '🔗 [Abrir Muro de Ofertas](' + CPA_LINK + ')\n\n' +
    '_Envia captura al admin para reclamar_',
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
}

function handleCrypto(chatId, query) {
  bot.answerCallbackQuery(query.id);
  bot.editMessageText(
    '₿ *Bono Cripto - Binance*\n\n' +
    'Abre cuenta en Binance y gana:\n\n' +
    '✅ VIP permanente en RewardNexus\n✅ +200 💎 diamantes\n✅ +50 XP\n✅ Hasta $50 USD en comisiones\n\n' +
    '🔗 [Registrarse en Binance](' + CRYPTO_LINK + ')\n\n' +
    '_Envia tu ID de Binance al admin_',
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
}

function handleAd(chatId, query) {
  bot.answerCallbackQuery(query.id);
  const user = getUser(chatId);
  bot.editMessageText(
    '📺 *Ver Anuncio (Monetag)*\n\n' +
    'Mira el anuncio y gana al instante.\n\n' +
    'Recompensa: 15 💎 + 5 XP\n' +
    'Bonus nivel: +' + (getTier(user.level).bonus * 100) + '%\n\n' +
    '🔗 [Ver Anuncio](' + MONETAG_LINK + ')',
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
    '🔥 *Oferta Especial*\n\n' +
    'Completa 3 ofertas seguidas y gana bonus:\n\n' +
    '1. Ver anuncio (15 💎)\n2. Muro CPA (100+ 💎)\n3. Tarea diaria (10 💎)\n\n' +
    'Completa todas y recibe +50 💎 bonus!\n\n' +
    '_Bonus acumulativo con tu tier_',
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...tasksMenu() });
}

function handleDaily(chatId, query) {
  const user = getUser(chatId);
  const now = Date.now();
  const oneDay = 86400000;
  if (now - user.lastDaily < oneDay) {
    const remaining = Math.ceil((oneDay - (now - user.lastDaily)) / 3600000);
    bot.answerCallbackQuery(query.id, { text: 'Vuelve en ' + remaining + 'h' });
    return;
  }
  user.dailyStreak = (now - user.lastDaily < 2 * oneDay) ? user.dailyStreak + 1 : 1;
  const streakBonus = Math.min(user.dailyStreak * 2, 30);
  const baseReward = 10 + streakBonus;
  const tier = getTier(user.level);
  const totalReward = Math.floor(baseReward * (1 + tier.bonus));
  user.diamonds += totalReward; user.tasksCompleted++; user.totalEarned += totalReward;
  user.lastDaily = now; addXP(user, 10); saveUser(user);
  bot.answerCallbackQuery(query.id, { text: '+' + totalReward + ' 💎 Racha: ' + user.dailyStreak + ' dias!' });
  bot.editMessageText(
    '📋 *Tarea Diaria*\n\n+' + totalReward + ' 💎 + 10 XP\n🔥 Racha: ' + user.dailyStreak + ' dias\n💎 Balance: ' + user.diamonds,
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
}

// ============ WALLET ============
function showWallet(chatId, user, query) {
  const usd = (user.diamonds / 100).toFixed(2);
  const text = '💰 *Cartera*\n\n' +
    '💎 Balance: ' + user.diamonds + '\n' +
    '💵 Valor: $' + usd + ' USD\n' +
    '📊 Tareas: ' + user.tasksCompleted + '\n' +
    '🎮 Juegos: ' + user.gamesPlayed + '\n' +
    '👥 Referidos: ' + user.referrals + '\n' +
    '🏆 Ganado: ' + user.totalEarned + ' 💎\n\n' +
    '_100 💎 = $1.00 USD_';
  const kb = { reply_markup: { inline_keyboard: [
    [{ text: '💸 Retirar', callback_data: 'withdraw' }, { text: '📋 Diaria', callback_data: 'daily_task' }],
    [{ text: '⬅️ Menu', callback_data: 'main' }]
  ]}};
  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...kb });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...kb });
}

function showWithdraw(chatId, user, query) {
  if (user.diamonds < 100) {
    bot.answerCallbackQuery(query.id, { text: 'Necesitas minimo 100 💎' });
    return;
  }
  bot.answerCallbackQuery(query.id);
  bot.editMessageText(
    '💸 *Retirar*\n\nDisponible: ' + user.diamonds + ' 💎 ($' + (user.diamonds / 100).toFixed(2) + ')\n\n' +
    'Metodos: PayPal, Binance Pay, Telegram Stars\n\n' +
    'Minimo: 100 💎 ($1.00)\nID: ' + chatId,
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
  const text = '👥 *Referidos*\n\n' +
    'Codigo: `' + user.referralCode + '`\n' +
    'Enlace: https://t.me/' + botName + '?start=' + user.referralCode + '\n\n' +
    'Referidos: ' + user.referrals + '\n' +
    'Ganado: ' + (user.referrals * 50) + ' 💎\n\n' +
    '💰 Tu ganas 50 💎 por referido\nTu amigo gana 25 💎 al entrar';
  if (query) bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(user) });
  else bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...mainMenu(user) });
}

// ============ DOWNLOAD ============
function showDownload(chatId, query) {
  bot.editMessageText(
    '📱 *Descargar App*\n\n🔗 [APK Android](https://github.com/xpeee-banned/BOT-FATHER/releases)\n🌐 [Web](' + WEBAPP_URL + ')',
    { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenu(getUser(chatId)) });
}

// ============ ERRORS ============
bot.on('polling_error', (e) => console.error('Polling:', e.message));
bot.on('webhook_error', (e) => console.error('Webhook:', e.message));

console.log('RewardNexus bot iniciado v2.0');
