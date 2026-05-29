// CONFIGURAÇÃO DO TELEGRAM BOT
const TELEGRAM_BOT_TOKEN = 'SEU_BOT_TOKEN_AQUI'; // Crie um bot via @BotFather
const CHAT_ID = 'SEU_CHAT_ID_AQUI'; // Seu ID do Telegram

// Classe para gerenciar favoritos no Telegram
class GerenciadorTelegram {
    constructor() {
        this.favoritos = this.carregarFavoritos();
    }

    // Carregar favoritos do localStorage
    carregarFavoritos() {
        const salvos = localStorage.getItem('netflix_favoritos');
        return salvos ? JSON.parse(salvos) : [];
    }

    // Salvar favoritos no localStorage
    salvarFavoritos() {
        localStorage.setItem('netflix_favoritos', JSON.stringify(this.favoritos));
    }

    // Adicionar aos favoritos
    adicionarFavorito(filme) {
        const novoFavorito = {
            id: filme.id,
            tipo: filme.tipo || 'movie',
            titulo: filme.titulo,
            poster: filme.poster,
            dataAdicao: new Date().toISOString()
        };

        // Verificar se já existe
        const existe = this.favoritos.some(f => f.id === novoFavorito.id && f.tipo === novoFavorito.tipo);
        
        if (!existe) {
            this.favoritos.push(novoFavorito);
            this.salvarFavoritos();
            this.enviarParaTelegram(novoFavorito);
            return true;
        }
        return false;
    }

    // Remover dos favoritos
    removerFavorito(id, tipo) {
        this.favoritos = this.favoritos.filter(f => !(f.id === id && f.tipo === tipo));
        this.salvarFavoritos();
    }

    // Verificar se é favorito
    eFavorito(id, tipo) {
        return this.favoritos.some(f => f.id === id && f.tipo === tipo);
    }

    // Obter lista de favoritos
    getFavoritos() {
        return this.favoritos;
    }

    // Enviar mensagem para o Telegram
    async enviarParaTelegram(filme) {
        const mensagem = `
🎬 *Novo Filme/Série Adicionado!*

*Título:* ${filme.titulo}
*Tipo:* ${filme.tipo === 'movie' ? 'Filme' : 'Série'}
*Data:* ${new Date(filme.dataAdicao).toLocaleDateString('pt-BR')}

🎥 Adicionado à sua lista no Netflix Clone!
        `.trim();

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: mensagem,
                    parse_mode: 'Markdown'
                })
            });
        } catch (erro) {
            console.log('Erro ao enviar para Telegram (modo local):', erro);
        }
    }

    // Enviar lista completa
    async enviarListaCompleta() {
        if (this.favoritos.length === 0) return;

        let mensagem = `📚 *Minha Lista - Netflix Clone*\n\n`;

        this.favoritos.forEach((filme, index) => {
            mensagem += `${index + 1}. ${filme.titulo} (${filme.tipo === 'movie' ? '🎬' : '📺'})\n`;
        });

        mensagem += `\n📊 Total: ${this.favoritos.length} itens`;

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: mensagem,
                    parse_mode: 'Markdown'
                })
            });
        } catch (erro) {
            console.log('Erro ao enviar lista (salvo localmente)');
        }
    }

    // Criar link para o bot
    getLinkBot() {
        return `https://t.me/SeuBot_Aqui?start=netflix`;
    }

    // Criar link para compartilhar um filme
    getLinkCompartilhar(filme) {
        const texto = `Check out ${filme.titulo}! 🎬`;
        return `https://t.me/share/url?url=${encodeURIComponent(texto)}`;
    }
}

// Inicializar gerenciador
const telegramManager = new GerenciadorTelegram();
