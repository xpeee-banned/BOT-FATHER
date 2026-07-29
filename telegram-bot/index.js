require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Configuración de entorno
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL || 'https://tu-usuario.github.io/tu-repo/'; 
const monetagDirectLink = process.env.MONETAG_LINK || 'https://tu-link-monetag.com/?subid='; 

if (!token) {
  console.error("FATAL ERROR: TELEGRAM_BOT_TOKEN is missing in environment variables.");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// 1. Comando /start - El puente hacia la Web App
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Pasamos el userId a la Web App para sincronizar cuentas
  const syncUrl = `${webAppUrl}?tg_id=${userId}`;

  const welcomeMessage = `¡Hola, *${msg.from.first_name}*! 🚀\n\nBienvenido a la nueva era de recompensas. Aquí tu tiempo vale oro (literalmente diamantes 💎).\n\n🔹 *Gana puntos* viendo anuncios, completando tareas y jugando.\n🔹 *Canjea* por beneficios VIP, cuentas premium, descargas directas y más.\n\n👇 ¡Haz clic abajo para abrir la App y empezar a ganar!`;
  
  const opts = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 ABRIR APP DE RECOMPENSAS", web_app: { url: syncUrl } }],
        [{ text: "🎁 Canal Oficial / Códigos", url: "https://t.me/tu_canal_oficial" }],
        [{ text: "❓ Ayuda", callback_data: "help_menu" }]
      ]
    }
  };

  bot.sendMessage(chatId, welcomeMessage, opts);
});

// 2. Comando /download - Integración de enlaces Monetag
bot.onText(/\/download (.*)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const item = match[1]; // Lo que el usuario quiere descargar

  // Generamos un enlace de Monetag que incluye el ID del usuario como parámetro de seguimiento
  const personalizedAdLink = `${monetagDirectLink}${userId}_${encodeURIComponent(item)}`;

  const message = `📥 *Descarga solicitada:* ${item}\n\nPara desbloquear el enlace directo y ganar *10 💎 diamantes extra*, haz clic en el siguiente enlace y completa el captcha/vista:\n\n🔗 [Desbloquear Enlace de Descarga](${personalizedAdLink})\n\n_Los diamantes se sumarán automáticamente a tu cuenta cuando el sistema verifique tu visita._`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

bot.onText(/\/download$/, (msg) => {
  bot.sendMessage(msg.chat.id, "⚠️ *Uso correcto:* `/download <nombre del archivo/juego>`\nEjemplo: `/download GTA V`", { parse_mode: 'Markdown' });
});

// 3. Comando /perfil - Ver estadísticas desde el bot
bot.onText(/\/perfil/, (msg) => {
  const chatId = msg.chat.id;
  
  // Aquí consultaríamos una base de datos real. Por ahora es un mockup.
  const profileMsg = `👤 *Tu Perfil*\n\n💎 *Diamantes:* 0 (Sincroniza entrando a la Web App)\n🏆 *Nivel:* Bronce 🥉\n🔥 *Racha:* 0 días\n\n_Usa la Web App para ver los datos en tiempo real._`;
  
  bot.sendMessage(chatId, profileMsg, { parse_mode: 'Markdown' });
});

// 4. Comando /ayuda o menú de callbacks
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  if (query.data === 'help_menu') {
    const helpMsg = `📖 *Menú de Ayuda*\n\n/start - Iniciar el bot y abrir la App\n/perfil - Ver tu progreso\n/download [archivo] - Buscar y descargar archivos ganando puntos\n\n¿Tienes problemas? Contacta al soporte en nuestro canal.`;
    bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
  }
});

// Manejo de errores
bot.on('polling_error', (error) => {
  console.log('Polling Error:', error.code, error.message);
});

// Express Server (Backend para Railway y Postbacks de Monetag)
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Sistema Bot/Backend corriendo sin problemas.');
});

// Endpoint Postback (S2S) para Monetag (Recibe notificaciones cuando un anuncio fue visto)
app.get('/postback', (req, res) => {
  // Ejemplo de URL: /postback?subid=123456789_GTAV&payout=0.01
  const subid = req.query.subid; // Contiene el Telegram ID y el item
  const payout = req.query.payout;

  if (subid) {
    const [userId, item] = subid.split('_');
    console.log(`[POSTBACK] Usuario ${userId} completó un anuncio por ${item}. Payout: ${payout}`);
    
    // Aquí conectaríamos a la Base de Datos para sumar +10 diamantes al usuario
    // y podríamos enviarle un mensaje por Telegram notificando el éxito:
    /*
    bot.sendMessage(userId, `🎉 ¡Verificación completada para ${item}!\nSe han añadido +10 💎 a tu cuenta.`);
    */
  }

  res.status(200).send('OK');
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Express server corriendo en el puerto ${port}`);
  console.log('Bot de Telegram iniciado con múltiples comandos.');
});
