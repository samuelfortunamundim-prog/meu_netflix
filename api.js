// CONFIGURAÇÃO DA API TMDB
const API_KEY = '67387393296f4b25985d2b358b426fe4'; // Pegue em https://www.themoviedb.org/settings/api
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

// Função principal para buscar dados da API
async function buscarDaAPI(endpoint) {
    try {
        const resposta = await fetch(`${BASE_URL}${endpoint}&language=pt-BR`);
        const dados = await resposta.json();
        return dados;
    } catch (erro) {
        console.error('Erro na API:', erro);
        return null;
    }
}

// Buscar filmes populares
async function getFilmesPopulares() {
    return await buscarDaAPI(`/movie/popular?api_key=${API_KEY}&page=1`);
}

// Buscar séries populares
async function getSeriesPopulares() {
    return await buscarDaAPI(`/tv/popular?api_key=${API_KEY}&page=1`);
}

// Buscar filmes em alta
async function getFilmesEmAlta() {
    return await buscarDaAPI(`/trending/movie/week?api_key=${API_KEY}`);
}

// Buscar séries em alta
async function getSeriesEmAlta() {
    return await buscarDaAPI(`/trending/tv/week?api_key=${API_KEY}`);
}

// Buscar详细信息 de um filme/série
async function getDetalhes(id, tipo) {
    return await buscarDaAPI(`/${tipo}/${id}?api_key=${API_KEY}`);
}

// Buscar vídeos (trailer)
async function getVideos(id, tipo) {
    const dados = await buscarDaAPI(`/${tipo}/${id}/videos?api_key=${API_KEY}`);
    if (dados && dados.results) {
        return dados.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || dados.results[0];
    }
    return null;
}

//Buscar online
async function buscarOnline(query) {
    const movies = await buscarDaAPI(`/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const tv = await buscarDaAPI(`/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    return { movies: movies?.results || [], tv: tv?.results || [] };
}

// Pegar URL da imagem
function getImagemCAMINHO(posterPath, tamanho = 'w500') {
    if (!posterPath) return 'https://via.placeholder.com/500x750?text=Sem+Imagem';
    return `https://image.tmdb.org/t/p/${tamanho}${posterPath}`;
}
