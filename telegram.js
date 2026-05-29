// ==========================================
// TELEGRAM STORAGE + PLAYER INTEGRADO
// ==========================================

const BOT_TOKEN = 'SEU_BOT_TOKEN_AQUI';
const MEU_CHAT_ID = 'SEU_CHAT_ID_AQUI';

// ==========================================
// CLASSE PRINCIPAL
// ==========================================

class TelegramStorage {
    constructor() {
        this.favoritos = this.carregarLocal();
        this.filmesDB = this.carregarDB();
    }

    // Carregar do localStorage
    carregarLocal() {
        return JSON.parse(localStorage.getItem('netflix_filmes') || '[]');
    }

    // Salvar no localStorage
    salvarLocal() {
        localStorage.setItem('netflix_filmes', JSON.stringify(this.favoritos));
    }

    // ==========================================
    // ADICIONAR FILME (Vai pro Telegram + Local)
    // ==========================================
    async adicionarFilme(filme) {
        // Verificar se já existe
        const existe = this.favoritos.some(f => f.id === filme.id);
        
        if (existe) {
            return { sucesso: false, msg: 'Filme já está na lista!' };
        }

        // Adicionar ao local
        this.favoritos.push({
            ...filme,
            dataAdd: new Date().toISOString(),
            status: 'pendente'
        });
        this.salvarLocal();

        // Enviar para o Telegram
        await this.enviarParaTelegram(filme, 'adicionar');

        return { sucesso: true, msg: 'Filme adicionado!' };
    }

    // ==========================================
    // REMOVER FILME
    // ==========================================
    async removerFilme(id) {
        this.favoritos = this.favoritos.filter(f => f.id !== id);
        this.salvarLocal();
        
        await this.enviarParaTelegram({ id }, 'remover');
    }

    // ==========================================
    // OBTER LISTA COMPLETA
    // ==========================================
    getLista() {
        return this.favoritos;
    }

    // ==========================================
    // BUSCAR STREAM NO TELEGRAM
    // ==========================================
    async buscarStream(filmeId) {
        // Primeiro tenta buscar nos favoritos locais
        const filme = this.favoritos.find(f => f.id === filmeId);
        
        if (filme && filme.streamUrl) {
            return filme.streamUrl;
        }

        // Se não tiver, pergunta ao Telegram
        if (BOT_TOKEN && MEU_CHAT_ID) {
            await this.pedirStreamAoBot(filmeId);
            return null;
        }

        return null;
    }

    // ==========================================
    // ENVIAR MENSAGEM PARA O TELEGRAM
    // ==========================================
    async enviarParaTelegram(filme, acao) {
        if (!BOT_TOKEN || !MEU_CHAT_ID) return;

        const acoes = {
            adicionar: `🎬 *NOVO FILME ADICIONADO*\n\n*Título:* ${filme.titulo}\n*Tipo:* ${filme.tipo === 'movie' ? '🎬 Filme' : '📺 Série'}\n*Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n➕ Adicionado à lista`,
            remover: `🗑️ *FILME REMOVIDO*\n\n*ID:* ${filme.id}\n\n➖ Removido da lista`,
            lista: `📋 *MINHA LISTA*\n\n${this.formatarLista()}`
        };

        const mensagem = acoes[acao] || 'Mensagem';

        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: MEU_CHAT_ID,
                    text: mensagem,
                    parse_mode: 'Markdown'
                })
            });
        } catch (e) {
            console.log('Erro ao enviar para Telegram');
        }
    }

    // ==========================================
    // PEDIR STREAM AO BOT
    // ==========================================
    async pedirStreamAoBot(filmeId) {
        if (!BOT_TOKEN) return null;

        try {
            const resposta = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: MEU_CHAT_ID,
                        text: `🔍 *PEDIDO DE STREAM*\n\nBuscando stream para filme ID: ${filmeId}\n\nAguarde...`
                    })
                }
            );
            return await resposta.json();
        } catch (e) {
            return null;
        }
    }

    // ==========================================
    // ENVIAR LISTA COMPLETA
    // ==========================================
    async enviarListaCompleta() {
        const ListaFormatada = this.favoritos.map((f, i) => 
            `${i + 1}. ${f.titulo} (${f.tipo === 'movie' ? '🎬' : '📺'})`
        ).join('\n');

        const msg = `📺 *MINHA LISTA - Netflix Clone*\n\n` +
            (ListaFormatada || 'Nenhum filme ainda!') +
            `\n\n📊 Total: ${this.favoritos.length} filmes`;

        if (BOT_TOKEN && MEU_CHAT_ID) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: MEU_CHAT_ID,
                    text: msg,
                    parse_mode: 'Markdown'
                })
            });
        }
    }

    // ==========================================
    // ATUALIZAR STREAM DE UM FILME
    // ==========================================
    atualizarStream(id, streamUrl) {
        const filme = this.favoritos.find(f => f.id === id);
        if (filme) {
            filme.streamUrl = streamUrl;
            this.salvarLocal();
        }
    }

    formatarLista() {
        if (this.favoritos.length === 0) return 'Nenhum filme na lista!';
        
        return this.favoritos.map((f, i) => 
            `${i + 1}. ${f.titulo} ${f.streamUrl ? '✅' : '⏳'}`
        ).join('\n');
    }
}

// ==========================================
// PLAYER INTEGRADO
// ==========================================

class PlayerInterno {
    constructor() {
        this.storage = new TelegramStorage();
    }

    async play(filme) {
        const titulo = document.getElementById('player-titulo');
        const frame = document.getElementById('video-frame');
        const modal = document.getElementById('player');

        titulo.textContent = filme.titulo;
        modal.style.display = 'block';

        // 1️⃣ Primeiro tenta trailer do TMDB
        const video = await getVideos(filme.id, filme.tipo);
        if (video && video.key) {
            frame.src = `https://www.youtube.com/embed/${video.key}?autoplay=1`;
            return;
        }

        // 2️⃣ Procura stream salvo
        const streamUrl = await this.storage.buscarStream(filme.id);
        if (streamUrl) {
            frame.src = streamUrl;
            return;
        }

        // 3️⃣ Abre opções do Telegram
        this.mostrarOpcoes(filme);
    }

    async mostrarOpcoes(filme) {
        const opcoes = `
            <div class="opcoes-stream">
                <h3>Escolha como assistir:</h3>
                <button class="btn" onclick="playerNet.playTrailer(${filme.id}, '${filme.tipo}')">
                    🎬 Assistir Trailer
                </button>
                <button class="btn" onclick="playerNet.pedirNoTelegram(${filme.id}, '${filme.titulo}')">
                    📱 Pedir no Telegram
                </button>
                <button class="btn" onclick="playerNet.assistirDoTelegram()">
                    ▶️ Ver Lista Completa
                </button>
            </div>
        `;

        alert('Selecione uma opção acima!');
    }

    async pedirNoTelegram(id, titulo) {
        if (!BOT_TOKEN) {
            alert('Bot não configurado!');
            return;
        }

        const link = `https://t.me/SeuBotAqui?start=play_${id}`;
        window.open(link, '_blank');
    }

    async assistirDoTelegram() {
        await this.storage.enviarListaCompleta();
        const link = `https://t.me/SeuBotAqui?start=lista`;
        window.open(link, '_blank');
    }

    close() {
        document.getElementById('video-frame').src = '';
        document.getElementById('player').style.display = 'none';
    }
}

// ==========================================
// INSTÂNCIAS
// ==========================================

const telegramStore = new TelegramStorage();
const playerNet = new PlayerInterno();

// Funções globais para o HTML
async function addFavorito(filme) {
    const resultado = await telegramStore.adicionarFilme(filme);
    alert(resultado.msg);
}

function getStreams() {
    return telegramStore.getLista().filter(f => f.streamUrl);
}
