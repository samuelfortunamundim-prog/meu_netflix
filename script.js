// Variáveis globais
let filmeSelecionado = null;
let serieSelecionada = null;
let TipoAtual = 'movie';

// Inicializar app
document.addEventListener('DOMContentLoaded', async () => {
    await inicializarApp();
});

// Inicializar aplicação
async function inicializarApp() {
    try {
        // Carregar banner principal
        await carregarBanner();

        // Carregar categorias
        await carregarCategorias();

        // Configurar scroll do header
        configurarScroll();
    } catch (erro) {
        console.error('Erro ao inicializar:', erro);
    }
}

// Carregar banner principal
async function carregarBanner() {
    const filmes = await getFilmesPopulares();
    if (!filmes || !filmes.results || filmes.results.length === 0) return;

    // Escolher um filme aleatório para o banner
    const filmeBanner = filmes.results[Math.floor(Math.random() * filmes.results.length)];
    
    const banner = document.getElementById('banner');
    const titulo = document.getElementById('banner-titulo');
    const descricao = document.getElementById('banner-descricao');

    // Configurar background
    banner.style.backgroundImage = `url(${BACKDROP_URL}${filmeBanner.backdrop_path})`;
    
    titulo.textContent = filmeBanner.title;
    descricao.textContent = filmeBanner.overview;

    // Guardar para uso global
    filmeSelecionado = {
        id: filmeBanner.id,
        titulo: filmeBanner.title,
        tipo: 'movie',
        poster: filmeBanner.poster_path
    };
}

// Carregar categorias
async function carregarCategorias() {
    // Populares
    const populares = await getFilmesPopulares();
    renderizarCarrossel('populares', populares?.results || [], 'movie');

    // Em Alta
    const emAlta = await getFilmesEmAlta();
    renderizarCarrossel('em-alta', emAlta?.results || [], 'movie');

    // Séries
    const series = await getSeriesPopulares();
    renderizarCarrossel('series', series?.results || [], 'tv');

    // Filmes
    const filmesDocs = await getFilmesEmAlta();
    renderizarCarrossel('filmes', filmesDocs?.results || [], 'movie');
}

// Renderizar carrossel
function renderizarCarrossel(id, items, tipo) {
    const container = document.getElementById(id);
    if (!container) return;

    container.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'filme-card';
        card.onclick = () => mostrarDetalhes(item.id, tipo);

        const imgSrc = tipo === 'movie' ? item.poster_path : item.poster_path;
        
        card.innerHTML = `
            <img src="${getImagemCAMINHO(imgSrc)}" alt="${tipo === 'movie' ? item.title : item.name}">
            <div class="filme-overlay">
                <span>${tipo === 'movie' ? item.title : item.name}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// Mostrar detalhes
async function mostrarDetalhes(id, tipo) {
    try {
        const detalhes = await getDetalhes(id, tipo);
        if (!detalhes) return;

        const modal = document.getElementById('modal-detalhes');
        
        document.getElementById('modal-banner').src = BACKDROP_URL + (detalhes.backdrop_path || detalhes.poster_path);
        document.getElementById('modal-titulo').textContent = tipo === 'movie' ? detalhes.title : detalhes.name;
        document.getElementById('modal-nota').textContent += ` ${(detalhes.vote_average * 10).toFixed(0)}%`;
        document.getElementById('modal-ano').textContent = new Date(detalhes.release_date || detalhes.first_air_date).getFullYear();
        document.getElementById('modal-tempo').textContent = `${detalhes.runtime || detalhes.episode_run_time?.[0] || 0} min`;
        document.getElementById('modal-sinopse').textContent = detalhes.overview;

        film/serieAtual = {
            id: id,
            titulo: tipo === 'movie' ? detalhes.title : detalhes.name,
            tipo: tipo,
            poster: detalhes.poster_path
        };

        modal.style.display = 'block';
    } catch (erro) {
        console.error('Erro ao carregar detalhes:', erro);
    }
}

// Funções diversas
function fecharModal() {
    document.getElementById('modal-detalhes').style.display = 'none';
}

function fecharPlayer() {
    playerNet.fecharPlayer();
}

function configurarScroll() {
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Funções de busca
async function buscar(event) {
    if (event.key === 'Enter' || event.target.value.length > 2) {
        await buscarFilmes();
    }
}

async function buscarFilmes() {
    const input = document.getElementById('input-busca');
    const query = input.value;
    if (!query) return;

    const resultados = await buscarOnline(query);
    const Container = document.getElementById('resultados-busca');
    
    Container.innerHTML = '';

    const todos = [...resultados.movies, ...resultados.tv];
    todos.forEach(item => {
        const card = document.createElement('div');
        card.className = 'filme-card';
        card.onclick = () => {
            const tipo = item.media_type === 'tv' ? 'tv' : 'movie';
            mostrarDetalhes(item.id
