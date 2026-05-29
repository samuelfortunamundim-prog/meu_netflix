# ==========================================
# BOT DO TELEGRAM PARA STORAGE + STREAMING
# ==========================================

import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Configure seu token
BOT_TOKEN = "SEU_BOT_TOKEN"

# Banco de dados simples em memória
filmes_db = {}

# Configurar logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# ==========================================
# COMANDOS
# ==========================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎬 *Netflix Clone Bot*\n\n"
        "Comandos disponíveis:\n"
        "/add [título] - Adicionar filme\n"
        "/lista - Ver minha lista\n"
        "/play [título] - Buscar stream\n"
        "/help - Ajuda",
        parse_mode='Markdown'
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📖 *Ajuda*\n\n"
        "Use /add [nome] para adicionar\n"
        "Use /play [nome] para reproduzir\n"
        "Use /lista para ver tudo",
        parse_mode='Markdown'
    )

async def lista(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not filmes_db:
        await update.message.reply_text("📋 Lista vazia!")
        return

    msg = "📋 *Minha Lista*\n\n"
    for i, (titulo, dados) in enumerate(filmes_db.items(), 1):
        stream = "✅" if dados.get('stream') else "⏳"
        msg += f"{i}. {titulo}
