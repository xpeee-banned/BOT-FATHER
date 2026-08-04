import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// RewardNexus Telegram Bot - Webhook Handler
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const ADMIN_ID = "7901124886";
const WEBAPP_URL = "https://rewardnexus.vercel.app";
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId: string | number, text: string, keyboard: any = null) {
  if (!BOT_TOKEN) return;
  const body: any = { chat_id: chatId, text: text, parse_mode: "HTML" };
  if (keyboard) body.reply_markup = keyboard;
  try {
    await fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("sendMessage error:", err);
  }
}

async function answerCallbackQuery(callbackQueryId: string, text: string = "", showAlert: boolean = false) {
  if (!BOT_TOKEN) return;
  const body: any = { callback_query_id: callbackQueryId };
  if (text) {
    body.text = text;
    body.show_alert = showAlert;
  }
  try {
    await fetch(`${API_BASE}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("answerCallbackQuery error:", err);
  }
}

function mainKeyboard() {
  return JSON.stringify({
    inline_keyboard: [
      [{ text: "🎮 Minijuegos", callback_data: "games" }, { text: "💰 Balance", callback_data: "balance" }],
      [{ text: "📋 Tareas CPA", callback_data: "tasks" }, { text: "🪙 Cripto", callback_data: "crypto" }],
      [{ text: "🎁 Bonus Diario", callback_data: "daily" }, { text: "👥 Referidos", callback_data: "refer" }],
      [{ text: "📊 Ranking", callback_data: "ranking" }, { text: "🏆 Logros", callback_data: "achievements" }]
    ]
  });
}

function gamesKeyboard() {
  return JSON.stringify({
    inline_keyboard: [
      [{ text: "🎲 Dado", callback_data: "game_dice" }, { text: "🔢 Adivina", callback_data: "game_guess" }],
      [{ text: "🎰 Slot", callback_data: "game_slot" }, { text: "🪙 Cara/Cruz", callback_data: "game_coin" }],
      [{ text: "📈 High/Low", callback_data: "game_hilo" }, { text: "🎯 Lucky Number", callback_data: "game_lucky" }],
      [{ text: "⬅️ Volver", callback_data: "menu" }]
    ]
  });
}

function getDates() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterdayDate = new Date(now.valueOf() - 86400000);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  return { today, yesterday };
}

// Safely normalize user object from Base44 entity record
function uData(user: any) {
  if (!user) return {};
  const d = user.data || user;

  let ach = d.achievements ?? user.achievements ?? ["first_task"];
  if (typeof ach === "string") {
    try {
      ach = JSON.parse(ach);
    } catch {
      ach = ach ? ach.split(",").map((s: string) => s.trim()) : ["first_task"];
    }
  }
  if (!Array.isArray(ach)) ach = ["first_task"];

  return {
    id: user.id || d.id || "",
    telegram_id: String(d.telegram_id ?? user.telegram_id ?? ""),
    username: String(d.username ?? user.username ?? "Usuario"),
    coins: Number(d.coins ?? user.coins ?? 50),
    balance: Number(d.balance ?? user.balance ?? 0.50),
    level: Number(d.level ?? user.level ?? 1),
    xp: Number(d.xp ?? user.xp ?? 0),
    total_earned: Number(d.total_earned ?? user.total_earned ?? 0),
    tasks_completed: Number(d.tasks_completed ?? user.tasks_completed ?? 0),
    daily_streak: Number(d.daily_streak ?? user.daily_streak ?? 0),
    last_daily: String(d.last_daily ?? user.last_daily ?? ""),
    referral_code: String(d.referral_code ?? user.referral_code ?? ""),
    referred_by: String(d.referred_by ?? user.referred_by ?? ""),
    achievements: ach,
    raw: user
  };
}

async function getOrCreateUser(base44: any, telegramId: string, username: string, firstName: string, refCode: string = "") {
  let users: any[] = [];
  try {
    // SDK filter() taking query object
    users = await base44.asServiceRole.entities.TelegramUser.filter({ telegram_id: telegramId });
  } catch (e) {
    console.error("Error filtering user:", e);
  }

  if (users && users.length > 0) {
    const existing = users[0];
    const u = uData(existing);
    const currentName = username || firstName || "Usuario";
    if (u.username !== currentName && currentName !== "Usuario") {
      try {
        await base44.asServiceRole.entities.TelegramUser.update(existing.id, { username: currentName });
      } catch (e) {}
    }
    return existing;
  }

  const referralCode = "RN" + Math.random().toString(36).substring(2, 8).toUpperCase();
  let referredBy = "";

  if (refCode && refCode.trim() !== "") {
    const cleanRef = refCode.trim().toUpperCase();
    try {
      const referrers = await base44.asServiceRole.entities.TelegramUser.filter({ referral_code: cleanRef });
      if (referrers && referrers.length > 0) {
        const referrer = referrers[0];
        const r = uData(referrer);
        if (r.telegram_id !== telegramId) {
          referredBy = cleanRef;
          // Reward referrer: +100 coins, +$1.00 USD total earned
          const newRefCoins = r.coins + 100;
          const newRefEarned = r.total_earned + 1.0;
          await base44.asServiceRole.entities.TelegramUser.update(referrer.id, {
            coins: newRefCoins,
            total_earned: newRefEarned
          });
          const newUserDisplay = username ? `@${username}` : (firstName || "Un amigo");
          await sendMessage(r.telegram_id, `🎉 <b>¡Nuevo referido!</b>\n\n${newUserDisplay} se ha unido con tu enlace.\n🪙 <b>+100 monedas</b> acreditadas!`);
        }
      }
    } catch (e) {
      console.error("Error processing referral code:", e);
    }
  }

  // Create record passing fields directly (not nested under data)
  return await base44.asServiceRole.entities.TelegramUser.create({
    telegram_id: telegramId,
    username: username || firstName || "Usuario",
    coins: 50,
    balance: 0.50,
    level: 1,
    xp: 0,
    total_earned: 0,
    tasks_completed: 0,
    daily_streak: 0,
    last_daily: "",
    referral_code: referralCode,
    referred_by: referredBy,
    achievements: ["first_task"]
  });
}

async function updateUser(base44: any, userId: string, updates: any) {
  await base44.asServiceRole.entities.TelegramUser.update(userId, updates);
}

async function handleDailyClaim(base44: any, userRecord: any, chatId: string | number) {
  const u = uData(userRecord);
  const { today, yesterday } = getDates();

  if (u.last_daily === today) {
    await sendMessage(chatId, "⚠️ <b>Ya reclamaste tu bono diario hoy.</b>\n\n¡Vuelve mañana para mantener tu racha! 🔥", mainKeyboard());
    return;
  }

  const currentStreak = Number(u.daily_streak || 0);
  const newStreak = u.last_daily === yesterday ? currentStreak + 1 : 1;
  const bonus = 10 + (newStreak - 1) * 2;
  const newCoins = u.coins + bonus;

  await updateUser(base44, u.id, {
    coins: newCoins,
    last_daily: today,
    daily_streak: newStreak
  });

  await sendMessage(
    chatId,
    `🎁 <b>¡Bono Diario Reclamado!</b>\n\n🪙 <b>+${bonus}</b> monedas\n🔥 <b>Racha actual:</b> ${newStreak} días\n💰 <b>Total balance:</b> ${newCoins} monedas`,
    mainKeyboard()
  );
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    const callbackQuery = body.callback_query;
    const message = body.message || callbackQuery?.message;
    
    let chatId: any, text: string = "", userId: string = "", username: string = "", firstName: string = "", callbackData: any = null;
    
    if (callbackQuery) {
      chatId = callbackQuery.message.chat.id;
      userId = String(callbackQuery.from.id);
      username = callbackQuery.from.username || "";
      firstName = callbackQuery.from.first_name || "";
      callbackData = callbackQuery.data;
      
      await answerCallbackQuery(callbackQuery.id);
    } else if (message && message.text) {
      chatId = message.chat.id;
      text = message.text;
      userId = String(message.from.id);
      username = message.from.username || "";
      firstName = message.from.first_name || "";
    } else {
      return new Response(JSON.stringify({ status: "ok", message: "No action" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract referral code if present in /start RN123456
    let refCode = "";
    if (text && text.startsWith("/start")) {
      const parts = text.trim().split(/\s+/);
      if (parts.length > 1) {
        refCode = parts[1];
      }
    }

    const userRecord = await getOrCreateUser(base44, userId, username, firstName, refCode);
    const u = uData(userRecord);

    // ADMIN COMMANDS
    if (userId === ADMIN_ID && text && text.startsWith("/")) {
      const adminCmd = text.split(" ")[0].toLowerCase();
      
      if (adminCmd === "/admin" || adminCmd === "/stats") {
        let allUsers: any[] = [];
        try {
          // SDK list takes positional args: (sort, limit)
          allUsers = await base44.asServiceRole.entities.TelegramUser.list("-coins", 500);
        } catch (e) {}

        const totalUsers = allUsers.length;
        let totalCoins = 0;
        let totalEarned = 0;

        allUsers.forEach((usr: any) => {
          const ud = uData(usr);
          totalCoins += ud.coins;
          totalEarned += ud.total_earned;
        });

        const statsMsg = `👑 <b>Panel de Administración</b>\n\n` +
          `👥 <b>Usuarios totales:</b> ${totalUsers}\n` +
          `🪙 <b>Monedas circulantes:</b> ${totalCoins.toLocaleString()}\n` +
          `💰 <b>Total ganado:</b> $${totalEarned.toFixed(2)} USD\n\n` +
          `<b>Comandos de Admin:</b>\n` +
          `/broadcast &lt;mensaje&gt; - Enviar mensaje global\n` +
          `/addcoins &lt;telegram_id&gt; &lt;cantidad&gt; - Dar monedas`;

        await sendMessage(chatId, statsMsg, mainKeyboard());
        return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (adminCmd === "/broadcast") {
        const broadcastText = text.replace("/broadcast", "").trim();
        if (!broadcastText) {
          await sendMessage(chatId, "⚠️ Uso: <code>/broadcast Tu mensaje aquí</code>");
        } else {
          let allUsers: any[] = [];
          try {
            allUsers = await base44.asServiceRole.entities.TelegramUser.list(undefined, 500);
          } catch (e) {}
          
          let sentCount = 0;
          for (const usr of allUsers) {
            const ud = uData(usr);
            if (ud.telegram_id) {
              await sendMessage(ud.telegram_id, `📢 <b>Aviso Oficial</b>\n\n${broadcastText}`);
              sentCount++;
            }
          }
          await sendMessage(chatId, `✅ Mensaje enviado a ${sentCount} usuarios.`);
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (adminCmd === "/addcoins") {
        const parts = text.trim().split(/\s+/);
        if (parts.length < 3) {
          await sendMessage(chatId, "⚠️ Uso: <code>/addcoins &lt;telegram_id&gt; &lt;cantidad&gt;</code>");
        } else {
          const targetId = parts[1];
          const amount = parseInt(parts[2], 10);
          if (isNaN(amount)) {
            await sendMessage(chatId, "⚠️ Cantidad inválida.");
          } else {
            try {
              const targetUsers = await base44.asServiceRole.entities.TelegramUser.filter({ telegram_id: targetId });
              if (targetUsers && targetUsers.length > 0) {
                const target = targetUsers[0];
                const td = uData(target);
                const updatedCoins = td.coins + amount;
                await updateUser(base44, target.id, { coins: updatedCoins });
                await sendMessage(chatId, `✅ +${amount} monedas añadidas a ${td.username} (${targetId}). Nuevo balance: ${updatedCoins}`);
                await sendMessage(targetId, `🎁 <b>¡El Administrador te ha enviado ${amount} monedas!</b>\n\nNuevo balance: ${updatedCoins} 🪙`);
              } else {
                await sendMessage(chatId, "❌ Usuario no encontrado.");
              }
            } catch (e: any) {
              await sendMessage(chatId, `❌ Error: ${e.message}`);
            }
          }
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // /start command
    if (text && text.startsWith("/start")) {
      const welcomeText = `🚀 <b>¡Bienvenido a RewardNexus!</b>\n\n` +
        `Hola ${firstName}! 👋\n\n` +
        `RewardNexus es la plataforma #1 para ganar dinero jugando y completando tareas.\n\n` +
        `🎁 <b>Bono de bienvenida:</b> 50 monedas ($0.50)\n` +
        `🪙 <b>Balance:</b> ${u.coins} monedas\n` +
        `💰 <b>Dinero:</b> $${u.balance.toFixed(2)} USD\n` +
        `📊 <b>Nivel:</b> ${u.level} (${u.xp} XP)\n` +
        `🔥 <b>Racha:</b> ${u.daily_streak} días\n\n` +
        `🔗 <b>Tu código de referido:</b> <code>${u.referral_code}</code>`;
      
      await sendMessage(chatId, welcomeText, mainKeyboard());
      
      if (userId !== ADMIN_ID && refCode === "") {
        await sendMessage(ADMIN_ID, `📢 <b>Nuevo usuario registrado</b>\n\n👤 ${firstName} (@${username || 'N/A'})\n🆔 ID: ${userId}\n🪙 Código: ${u.referral_code}`);
      }
    }
    // /help command
    else if (text === "/help") {
      await sendMessage(
        chatId,
        `📋 <b>Menú de Ayuda</b>\n\n` +
        `/start - Abrir menú principal\n` +
        `/balance - Consultar tu saldo\n` +
        `/daily - Reclamar bono diario\n` +
        `/refer - Tu enlace de referidos\n` +
        `/ranking - Ver top 10 jugadores\n` +
        `/help - Mostrar esta ayuda\n\n` +
        `🌐 <b>Web App:</b> ${WEBAPP_URL}`,
        mainKeyboard()
      );
    }
    // /balance command
    else if (text === "/balance") {
      await sendMessage(
        chatId,
        `💰 <b>Tu Balance</b>\n\n` +
        `🪙 <b>Monedas:</b> ${u.coins}\n` +
        `💵 <b>Valor en USD:</b> $${u.balance.toFixed(2)}\n` +
        `📊 <b>Nivel:</b> ${u.level} (${u.xp} XP)\n` +
        `🔥 <b>Racha diaria:</b> ${u.daily_streak} días\n` +
        `✅ <b>Tareas completadas:</b> ${u.tasks_completed}\n` +
        `🏆 <b>Total ganado:</b> $${u.total_earned.toFixed(2)}`,
        mainKeyboard()
      );
    }
    // /daily command
    else if (text === "/daily") {
      await handleDailyClaim(base44, userRecord, chatId);
    }
    // /refer command
    else if (text === "/refer") {
      await sendMessage(
        chatId,
        `👥 <b>Sistema de Referidos</b>\n\n` +
        `Comparte tu enlace con tus amigos:\n` +
        `https://t.me/xpe_official_bot?start=${u.referral_code}\n\n` +
        `🎁 <b>Recompensa:</b> ¡Gana 100 🪙 ($1.00 USD) por cada amigo que se registre con tu enlace!`,
        mainKeyboard()
      );
    }
    // /ranking command
    else if (text === "/ranking") {
      let allUsers: any[] = [];
      try {
        // SDK list() takes positional arguments: (sort, limit)
        allUsers = await base44.asServiceRole.entities.TelegramUser.list("-coins", 10);
      } catch (e) {
        console.error("Error listing ranking:", e);
      }

      let rankText = "📊 <b>Top 10 Jugadores</b>\n\n";
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach((p: any, i: number) => {
          const d = uData(p);
          const medals = ["🥇", "🥈", "🥉"];
          const medal = medals[i] || `${i + 1}.`;
          rankText += `${medal} <b>${d.username}</b> — ${d.coins} 🪙\n`;
        });
      } else {
        rankText += "Aún no hay jugadores registrados.";
      }
      await sendMessage(chatId, rankText, mainKeyboard());
    }
    // Callback query: menu
    else if (callbackData === "menu") {
      await sendMessage(
        chatId,
        `🚀 <b>Menú Principal</b>\n\n` +
        `🪙 ${u.coins} monedas | $${u.balance.toFixed(2)} USD\n` +
        `📊 Nivel ${u.level} | ${u.xp} XP`,
        mainKeyboard()
      );
    }
    // Callback query: balance
    else if (callbackData === "balance") {
      await sendMessage(
        chatId,
        `💰 <b>Tu Balance</b>\n\n` +
        `🪙 <b>Monedas:</b> ${u.coins}\n` +
        `💵 <b>USD:</b> $${u.balance.toFixed(2)}\n` +
        `📊 <b>Nivel:</b> ${u.level} (${u.xp} XP)\n` +
        `🔥 <b>Racha:</b> ${u.daily_streak} días\n` +
        `🏆 <b>Total Ganado:</b> $${u.total_earned.toFixed(2)}`,
        mainKeyboard()
      );
    }
    // Callback query: games
    else if (callbackData === "games") {
      await sendMessage(chatId, "🎮 <b>Minijuegos</b>\n\nElige un juego para apostar 5 🪙 y ganar recompensas:", gamesKeyboard());
    }
    // Callback query: game_*
    else if (callbackData && callbackData.startsWith("game_")) {
      const gameType = callbackData.replace("game_", "");
      const bet = 5;

      if (u.coins < bet) {
        await sendMessage(chatId, "⚠️ Necesitas al menos 5 🪙 para jugar.", gamesKeyboard());
      } else {
        let resultText = "", won = false, reward = 0;

        if (gameType === "dice") {
          const roll = Math.floor(Math.random() * 6) + 1;
          won = roll >= 4;
          reward = won ? bet * 2 : 0;
          resultText = `🎲 <b>Dado:</b> Salió un <b>${roll}</b>\n\n${won ? `🎉 ¡Ganaste! <b>+${reward} 🪙</b>` : "❌ ¡Perdiste tu apuesta!"}`;
        } else if (gameType === "coin") {
          const flip = Math.random() < 0.5 ? "Cara" : "Cruz";
          won = flip === "Cara";
          reward = won ? bet * 2 : 0;
          resultText = `🪙 <b>Moneda:</b> Salió <b>${flip}</b>\n\n${won ? `🎉 ¡Ganaste! <b>+${reward} 🪙</b>` : "❌ ¡Perdiste tu apuesta!"}`;
        } else if (gameType === "slot") {
          const emojis = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];
          const r1 = emojis[Math.floor(Math.random() * emojis.length)];
          const r2 = emojis[Math.floor(Math.random() * emojis.length)];
          const r3 = emojis[Math.floor(Math.random() * emojis.length)];
          
          if (r1 === r2 && r2 === r3) {
            won = true;
            reward = bet * 5;
            resultText = `🎰 <b>Slot:</b> ${r1} | ${r2} | ${r3}\n\n🔥 <b>¡JACKPOT TRIPLE!</b> <b>+${reward} 🪙</b>`;
          } else if (r1 === r2 || r2 === r3 || r1 === r3) {
            won = true;
            reward = bet * 2;
            resultText = `🎰 <b>Slot:</b> ${r1} | ${r2} | ${r3}\n\n🎉 ¡Par coincidente! <b>+${reward} 🪙</b>`;
          } else {
            won = false;
            reward = 0;
            resultText = `🎰 <b>Slot:</b> ${r1} | ${r2} | ${r3}\n\n❌ Sigue intentando!`;
          }
        } else if (gameType === "guess") {
          const n = Math.floor(Math.random() * 10) + 1;
          won = n >= 7;
          reward = won ? bet * 3 : 0;
          resultText = `🔢 <b>Adivina:</b> Salió el número <b>${n}</b>\n\n${won ? `🎉 ¡Adivinaste alto! <b>+${reward} 🪙</b>` : "❌ Perdiste tu apuesta!"}`;
        } else if (gameType === "hilo") {
          const n = Math.floor(Math.random() * 13) + 1;
          won = n >= 8;
          reward = won ? bet * 2 : 0;
          resultText = `📈 <b>High/Low:</b> Carta <b>${n}</b>\n\n${won ? `🎉 ¡High! <b>+${reward} 🪙</b>` : "❌ Low, perdiste!"}`;
        } else if (gameType === "lucky") {
          const n = Math.floor(Math.random() * 100) + 1;
          won = n >= 80;
          reward = won ? bet * 4 : 0;
          resultText = `🎯 <b>Lucky Number:</b> Tu número es <b>${n}</b>\n\n${won ? `🎉 ¡Súper Suerte! <b>+${reward} 🪙</b>` : "❌ ¡Casi! Inténtalo de nuevo."}`;
        }

        const newCoins = Math.max(0, u.coins - bet + reward);
        const newXP = u.xp + (won ? 15 : 5);
        let newLevel = u.level;
        while (newXP >= 100 + (newLevel - 1) * 50) {
          newLevel++;
        }
        const netRewardUsd = won ? reward / 100 : 0;
        const newTotalEarned = u.total_earned + netRewardUsd;

        await updateUser(base44, userRecord.id, {
          coins: newCoins,
          xp: newXP,
          level: newLevel,
          total_earned: newTotalEarned
        });

        await sendMessage(chatId, `${resultText}\n\n🪙 <b>Nuevo balance:</b> ${newCoins} monedas`, gamesKeyboard());
      }
    }
    // Callback query: daily
    else if (callbackData === "daily") {
      await handleDailyClaim(base44, userRecord, chatId);
    }
    // Callback query: refer
    else if (callbackData === "refer") {
      await sendMessage(
        chatId,
        `👥 <b>Tu Enlace de Referidos</b>\n\n` +
        `https://t.me/xpe_official_bot?start=${u.referral_code}\n\n` +
        `🎁 Gana <b>100 🪙 ($1.00 USD)</b> por cada amigo invitado.`,
        mainKeyboard()
      );
    }
    // Callback query: tasks
    else if (callbackData === "tasks") {
      await sendMessage(
        chatId,
        `📋 <b>Tareas CPA Disponibles</b>\n\n` +
        `1. Instalar App Móvil — <b>45 🪙</b>\n` +
        `2. Encuesta Rápida — <b>12 🪙</b>\n` +
        `3. Registro en sitio — <b>25 🪙</b>\n` +
        `4. Ver Video Promocional — <b>2 🪙</b>\n\n` +
        `👉 <b>Ir al Muro de Ofertas:</b> https://cpalead.com/`,
        mainKeyboard()
      );
    }
    // Callback query: crypto
    else if (callbackData === "crypto") {
      await sendMessage(
        chatId,
        `🪙 <b>Ofertas Cripto VIP</b>\n\n` +
        `Regístrate en Binance y reclama recompensas VIP:\n` +
        `👉 https://www.binance.com/es/register\n\n` +
        `Retiros disponibles en USDT, LTC, BTC y TRX.`,
        mainKeyboard()
      );
    }
    // Callback query: ranking
    else if (callbackData === "ranking") {
      let allUsers: any[] = [];
      try {
        allUsers = await base44.asServiceRole.entities.TelegramUser.list("-coins", 10);
      } catch (e) {
        console.error("Error listing ranking:", e);
      }

      let rankText = "📊 <b>Top 10 Jugadores</b>\n\n";
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach((p: any, i: number) => {
          const d = uData(p);
          const medals = ["🥇", "🥈", "🥉"];
          const medal = medals[i] || `${i + 1}.`;
          rankText += `${medal} <b>${d.username}</b> — ${d.coins} 🪙\n`;
        });
      } else {
        rankText += "Aún no hay jugadores registrados.";
      }
      await sendMessage(chatId, rankText, mainKeyboard());
    }
    // Callback query: achievements
    else if (callbackData === "achievements") {
      const achList = Array.isArray(u.achievements) ? u.achievements : [];
      let achText = `🏆 <b>Tus Logros Desbloqueados</b>\n\n`;
      achText += `🎯 Primera tarea: ${u.tasks_completed >= 1 ? "✅" : "❌"}\n`;
      achText += `💼 10 tareas completadas: ${u.tasks_completed >= 10 ? "✅" : "❌"}\n`;
      achText += `🚀 50 tareas completadas: ${u.tasks_completed >= 50 ? "✅" : "❌"}\n`;
      achText += `🔥 Racha de 7 días: ${u.daily_streak >= 7 ? "✅" : "❌"}\n`;
      achText += `💰 $1.00 USD ganado: ${u.total_earned >= 1 ? "✅" : "❌"}\n`;
      achText += `⭐ Nivel 5 alcanzado: ${u.level >= 5 ? "✅" : "❌"}\n`;
      await sendMessage(chatId, achText, mainKeyboard());
    }
    // Fallback for non-command text
    else if (text && !text.startsWith("/")) {
      await sendMessage(chatId, `¡Hola ${firstName}! 👋 Usa /start para ver el menú principal.`, mainKeyboard());
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Bot error:", error);
    return new Response(JSON.stringify({ status: "ok", error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
