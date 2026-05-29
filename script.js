
// ==========================================
// SCRIPT PRINCIPAL
// ==========================================

let itemAtual = null;
let bannerFilme = null;

// Inicializar
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await carregarBanner();
    await carregarCategorias();
    configurarScroll();
}

// Banner
async function carregarBanner() {
    const dados = await getPopulares();
    if (!dados?.results) return;

    const filme = dados.results[Math.floor(Math.random() * dados.results.length)];
    bannerFilme = {
        id: filme.id,
        titulo: filme.title,
        tipo: 'movie',
        poster: filme.poster_path
    };

    document.getElementById('banner').style.backgroundImage = `url(${getBg(filme.backdrop_path)})`;
    document.getElementById('banner-titulo').textContent = filme.title;
    document.getElementById('banner-descricao').textContent = filme.overview;
}

// Categorias
async function carregarCategorias() {
    const populares = await getPopulares();
    renderizarCarrossel('populares', populares?.results || [], 'movie');

    const emAlta = await getEmAlta();
    renderizarCarrossel('em-alta', emAlta?.results || [], 'movie');

    const series = await getSeries();
    renderizarCarrossel('series', series?.results || [], 'tv');
}

// Renderizar
function renderizarCarrossel(id, items, tipo) {
    const container = document.getElementById(id);
    if (!container) return;

    container.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'filme-card';
        div.onclick = () => abrirDetalhes(item.id, tipo);
        div.innerHTML = `<img src="${getImg(item.poster_path)}" alt="${item.title || item.name}">`;
        container.appendChild(div);
    });
}

// Detalhes
async function abrirDetalhes(id, tipo) {
    const dados = await getDetalhes(id, tipo);
    if (!dados) return;

    itemAtual = {
        id: dados.id,
        titulo: dados.title || dados.name,
        tipo: tipo,
        poster: dados.poster_path
    };

    document.getElementById('modal-banner').src = getBg(dados.backdrop_path || dados.poster_path);
    document.getElementById('modal-titulo').textContent = dados.title || dados.name;
    document.getElementById('modal-nota').textContent = `${Math.round(dados.vote_average * 10)}%`;
    document.getElementById('modal-ano').textContent = new Date(dados.release_date || dados.first_air_date).getFullYear();
    document.getElementById('modal-tempo').textContent = `${dados.runtime || dados.episode_run_time?.[0] || 0} min`;
    document.getElementById('modal-sinopse').textContent = dados.overview;
    document.getElementById('modal-detalhes').style.display = 'block';
}

// Funções do player
async function playPlayer() {
    if (itemAtual) {
        await playerNet.play(itemAtual);
    }
}

async function playBanner() {
    if (bannerFilme) {
        await playerNet.play(bannerFilme);
    }
}

// Favoritos
async function addLista() {
    if (itemAtual) {
        await addFavorito(itemAtual);
    }
}

// Telegram
async function salvarNoTelegram() {
    if (itemAtual) {
        await telegramStore.adicionarFilme(itemAtual);
        alert('Enviado para o Telegram! 📱');
    }
}

function abrirTelegram() {
    if (BOT_TOKEN && MEU_CHAT_ID) {
        window.open(`https://t.me/SeuBotAqui`, '_blank');
    } else {
        alert('Configure o Bot Token em telegram.js!');
    }
}

// Fechar modais
function fecharModal() {
    document.getElementById('modal-detalhes').style.display = 'none';
}

function fecharPlayer() {
    playerNet.close();
}

function home() {
    window.location.reload();
}

// Scroll
function configurarScroll() {
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        header.classList.toggle('scrolled', window.scrollY > 100);
    });
}

// Clique fora para fechar
document.getElementById('modal-detalhes').addEventListener('click', (e) => {
    if (e.target.id === 'modal-detalhes') fecharModal();
});

document.getElementById('player').addEventListener('click', (e) => {
    if (e.target.id === 'player') fecharPlayer();
});
