// Estado do jogo 
const game = {
  moedas: 0,
  danoClique: 1,
  cps: 0,
  tempoMaximo: 45,
  bonusMoedas: 0,
  chanceCritico: 0,
  pokedex: [],
  pokemon: null,
  tempo: 45,
  timer: null,
  loopCps: null,
  config: {
    maxPokemonId: 649,
    tema: 'padrao'
  },
  upgrades: [
    { id: 'clique_1', nome: 'Treino de Força', desc: '+1 Dano por Clique', custoBase: 10, custoAtual: 10, nivel: 0, tipo: 'clique', valor: 1, multCusto: 1.5 },
    { id: 'clique_2', nome: 'Luvas de Foco', desc: '+5 Dano por Clique', custoBase: 100, custoAtual: 100, nivel: 0, tipo: 'clique', valor: 5, multCusto: 1.6 },
    { id: 'clique_3', nome: 'Mega Bracelete', desc: '+30 Dano por Clique', custoBase: 1200, custoAtual: 1200, nivel: 0, tipo: 'clique', valor: 30, multCusto: 1.7 },
    { id: 'clique_4', nome: 'Poder Z-Ring', desc: '+150 Dano por Clique', custoBase: 15000, custoAtual: 15000, nivel: 0, tipo: 'clique', valor: 150, multCusto: 1.8 },
    { id: 'cps_1', nome: 'Pikachu Ajudante', desc: '+2 Dano/Seg (CPS)', custoBase: 25, custoAtual: 25, nivel: 0, tipo: 'cps', valor: 2, multCusto: 1.5 },
    { id: 'cps_2', nome: 'Charizard Suporte', desc: '+15 Dano/Seg (CPS)', custoBase: 350, custoAtual: 350, nivel: 0, tipo: 'cps', valor: 15, multCusto: 1.6 },
    { id: 'cps_3', nome: 'Bando de Pidgeot', desc: '+80 Dano/Seg (CPS)', custoBase: 3000, custoAtual: 3000, nivel: 0, tipo: 'cps', valor: 80, multCusto: 1.7 },
    { id: 'cps_4', nome: 'Mewtwo Psíquico', desc: '+500 Dano/Seg (CPS)', custoBase: 45000, custoAtual: 45000, nivel: 0, tipo: 'cps', valor: 500, multCusto: 1.8 },
    { id: 'tempo_1', nome: 'Quick Claw (Garra)', desc: '+5s no Cronômetro do Boss', custoBase: 200, custoAtual: 200, nivel: 0, tipo: 'tempo', valor: 5, multCusto: 2.0 },
    { id: 'tempo_2', nome: 'Trick Room (Tempo)', desc: '+10s no Cronômetro do Boss', custoBase: 2500, custoAtual: 2500, nivel: 0, tipo: 'tempo', valor: 10, multCusto: 2.2 },
    { id: 'moeda_1', nome: 'Amulet Coin', desc: '+15% de Moedas por Vitória', custoBase: 500, custoAtual: 500, nivel: 0, tipo: 'moeda', valor: 15, multCusto: 1.9 },
    { id: 'crit_1', nome: 'Scope Lens (Lente)', desc: '+5% Chance Crítico (Dano x3)', custoBase: 1000, custoAtual: 1000, nivel: 0, tipo: 'critico', valor: 5, multCusto: 2.0 }
  ]
};

// Inicialização
window.onload = () => {
  carregar();
  configurarEventos();
  atualizarLoja();
  atualizarInterface();
  carregarPokemon();

  game.loopCps = setInterval(aplicarDanoCps, 1000);
  setInterval(salvar, 10000);
};

function configurarEventos() {
  document.getElementById("ui-sprite").addEventListener("click", atacarPokemon);
  document.getElementById("btn-fechar-modal").addEventListener("click", fecharModal);

  document.getElementById("ui-pesquisa-pokedex").addEventListener("input", () => {
    atualizarPokedex();
  });
  
  document.getElementById("modal-pokemon").addEventListener("click", (e) => {
    if (e.target.id === "modal-pokemon") fecharModal();
  });

  document.getElementById("btn-config").addEventListener("click", abrirModalConfig);
  document.getElementById("btn-fechar-config").addEventListener("click", fecharModalConfig);

  document.getElementById("select-geracao").addEventListener("change", (e) => {
    game.config.maxPokemonId = parseInt(e.target.value);
    salvar();
  });

  document.getElementById("select-tema").addEventListener("change", (e) => {
    game.config.tema = e.target.value;
    document.body.setAttribute("data-theme", game.config.tema);
    salvar()
  })
}

// Buscar Pokémon com async e try
async function carregarPokemon() {
  clearInterval(game.timer);

  document.getElementById("ui-sprite").classList.add("hidden");
  document.getElementById("ui-loading").classList.remove("hidden");
  document.getElementById("ui-nome-pokemon").innerText = "Buscando...";

  const id =  Math.floor(Math.random() * game.config.maxPokemonId) + 1;

  try {
    const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const dados = await resposta.json();

    const vidaCalculada = Math.floor((dados.base_experience || 50) * 2.8);

    game.pokemon = {
      id: dados.id,
      nome: dados.name.toUpperCase(),
      sprite: dados.sprites.front_default,
      vidaMaxima: vidaCalculada,
      vida: vidaCalculada,
      recompensa: Math.floor(vidaCalculada / 2),
      stats: dados.stats.map(stat => ({
        nome: stat.stat.name.toUpperCase(),
        valor: stat.base_stat
      })),
      tipos: dados.types.map(tipo => tipo.type.name)
    };

    document.getElementById("ui-nome-pokemon").innerText = game.pokemon.nome;
    
    const sprite = document.getElementById("ui-sprite");
    sprite.src = game.pokemon.sprite;
    sprite.classList.remove("hidden");
    document.getElementById("ui-loading").classList.add("hidden");

    atualizarVida();
    iniciarTimer();
  } catch (erro) {
    console.error("Erro ao buscar Pokémon:", erro);
    setTimeout(carregarPokemon, 1000);
  }
}

// Batalha
function iniciarTimer() {
  game.tempo = game.tempoMaximo;
  document.getElementById("ui-tempo").innerText = `${game.tempo}s`;

  game.timer = setInterval(() => {
    game.tempo--;
    document.getElementById("ui-tempo").innerText = `${game.tempo}s`;

    if (game.tempo <= 0) {
      clearInterval(game.timer);
      alert(`O tempo acabou! ${game.pokemon.nome} fugiu!`);
      carregarPokemon();
    }
  }, 1000);
}

//funçao para atacar o pokemon ao clicar nele
function atacarPokemon(evento) {
  if (!game.pokemon || game.pokemon.vida <= 0) return;

  let dano = game.danoClique;
  const sprite = document.getElementById("ui-sprite");
  const aviso = document.getElementById("ui-aviso-critico");
  
  // Verifica se foi crítico
  const ehCritico = Math.random() * 100 < game.chanceCritico;

  if (ehCritico) {
    dano *= 3;
    sprite.classList.add("crit-shake");
    aviso.classList.remove("hidden");


    //criar a explosao do clique
    criarParticulasCriticas(evento.pageX, evento.pageY);

    setTimeout(() => {
      sprite.classList.remove("crit-shake");
      aviso.classList.add("hidden");
    }, 250);
  } else {
    sprite.classList.add("shake");
    setTimeout(() => sprite.classList.remove("shake"), 80);
  }

  //chama o texto flutuante usando as coordenadas do clique, Y e X
  criarTextoDano(evento.pageX, evento.pageY, dano, ehCritico);

  game.pokemon.vida -= dano;
  verificarBatalha();
}

function aplicarDanoCps() {
  if (game.cps > 0 && game.pokemon && game.pokemon.vida > 0) {
    game.pokemon.vida -= game.cps;
    verificarBatalha();
  }
}

//cria os numeros flutuando na tela
function criarTextoDano(x, y, dano, ehCritico) {
  const texto = document.createElement("span");
  texto.classList.add("dano-flutuante");

  if(ehCritico) {
    texto.classList.add("critico");
    texto.innerText = `CRITICO! -${dano}`;
  } else {
    texto.innerText = `-${dano}`
  }

//posiciona o texto exatamente onde o mouse clicou, apenas com um desvio
const desvioX = (Math.random() - 0.5) * 40;
texto.style.left = `${x + desvioX}px`;
texto.style.top = `${y - 20}px`;

document.body.appendChild(texto);

//remove a tag HTML apos 800ms(tempo da animacao no CSS)
setTimeout(() => {
  texto.remove();
  }, 800);
}


function verificarBatalha() {
  if (game.pokemon.vida < 0) game.pokemon.vida = 0;
  
  atualizarVida();

  if (game.pokemon.vida === 0) {
    clearInterval(game.timer);

    const bonus = 1 + (game.bonusMoedas / 100);
    const moedasGanhas = Math.floor(game.pokemon.recompensa * bonus);

    game.moedas += moedasGanhas;
    adicionarPokedex(game.pokemon);

    atualizarInterface();
    salvar();

    setTimeout(carregarPokemon, 300);
  }
}

// Loja dos upgrades
function atualizarLoja() {
  const lista = document.getElementById("ui-loja-lista");
  lista.innerHTML = "";

  game.upgrades.forEach((up, index) => {
    const item = document.createElement("div");
    item.classList.add("upgrade-item");

    const podeComprar = game.moedas >= up.custoAtual;

    item.innerHTML = `
      <div class="upgrade-info">
        <strong>${up.nome} <span style="color:#f8b400; font-size:0.8rem;">(Nv. ${up.nivel})</span></strong>
        <p>${up.desc}</p>
        <small>Custo: ${up.custoAtual} moedas</small>
      </div>
      <button class="btn-buy" ${!podeComprar ? 'disabled' : ''} onclick="comprarUpgrade(${index})">
        Comprar
      </button>
    `;

    lista.appendChild(item);
  });
}

//funçao para comprar upgrade
function comprarUpgrade(index) {
  const up = game.upgrades[index];

  if (game.moedas >= up.custoAtual) {
    game.moedas -= up.custoAtual;
    up.nivel += 1;

    if (up.tipo === 'clique') game.danoClique += up.valor;
    if (up.tipo === 'cps') game.cps += up.valor;
    if (up.tipo === 'tempo') game.tempoMaximo += up.valor;
    if (up.tipo === 'moeda') game.bonusMoedas += up.valor;
    if (up.tipo === 'critico') game.chanceCritico += up.valor;

    up.custoAtual = Math.floor(up.custoAtual * up.multCusto);

    atualizarInterface();
    atualizarLoja();
    salvar();
  }
}

// Pokédex
function adicionarPokedex(pokemon) {
  const existe = game.pokedex.some(p => p.id === pokemon.id);
  if (!existe) {
    game.pokedex.push({
      id: pokemon.id,
      nome: pokemon.nome,
      sprite: pokemon.sprite,
      stats: pokemon.stats,
      tipos: pokemon.tipos,
      favorito: false //nasce sendo normal(sem ser favorito)
    });
    atualizarPokedex();
  }
}

function atualizarPokedex() {
  const grid = document.getElementById("ui-lista-pokedex");
  grid.innerHTML = "";

  document.getElementById("ui-total-capturados").innerText = game.pokedex.length;

  //Le o texto da barra de pesquisa (em minúsculo)
  const termoBusca = document.getElementById("ui-pesquisa-pokedex").value.toLowerCase();

  // 2. Filtra pelo nome e coloca os favoritos em primeiro
  const listaFiltrada = game.pokedex
    .filter(poke => poke.nome.toLowerCase().includes(termoBusca))
    .sort((a, b) => (b.favorito ? 1 : 0) - (a.favorito ? 1 : 0));

  listaFiltrada.forEach(poke => {
    const img = document.createElement("img");
    img.src = poke.sprite;
    img.title = `${poke.nome} ${poke.favorito ? '(Favorito )' : ''}`;
    img.classList.add("pokedex-icon");

    // Adiciona a classe visual dourada se for favorito
    if (poke.favorito) {
      img.classList.add("fav-icon");
    }

    img.addEventListener("click", () => abrirModal(poke));

    grid.appendChild(img);
  });
}

// Interface
function atualizarVida() {
  const vida = game.pokemon.vida;
  const max = game.pokemon.vidaMaxima;
  const porcentagem = Math.max(0, (vida / max) * 100);

  const barra = document.getElementById("ui-barra-vida");
  barra.style.width = `${porcentagem}%`;
  document.getElementById("ui-texto-vida").innerText = `${vida} / ${max} HP`;

  if (porcentagem < 25) {
    barra.style.backgroundColor = "#ff4757";
  } else if (porcentagem < 50) {
    barra.style.backgroundColor = "#ffa502";
  } else {
    barra.style.backgroundColor = "#4ccd99";
  }
}

function atualizarInterface() {
  document.getElementById("ui-moedas").innerText = game.moedas;
  document.getElementById("ui-dano").innerText = game.danoClique;
  document.getElementById("ui-cps").innerText = game.cps;
  document.getElementById("ui-critico").innerText = `${game.chanceCritico}%`;
  document.getElementById("ui-bonus-moeda").innerText = `+${game.bonusMoedas}%`;

  atualizarLoja();
}

function abrirModal(poke) {
  document.getElementById("modal-nome").innerText = poke.nome;
  document.getElementById("modal-sprite").src = poke.sprite;

  // Configura o botão de Favorito no Modal
  const btnFav = document.getElementById("btn-favoritar");
  atualizarBotaoFavorito(btnFav, poke);

  // Ao clicar, inverte o estado (de favorito para não-favorito e vice-versa)
  btnFav.onclick = () => {
    poke.favorito = !poke.favorito;
    atualizarBotaoFavorito(btnFav, poke);
    atualizarPokedex();
    salvar();
  };

  const tipos = document.getElementById("modal-tipos");
  tipos.innerHTML = "";
  if (poke.tipos) {
    poke.tipos.forEach(tipo => {
      const badge = document.createElement("span");
      badge.classList.add("type-badge");
      badge.innerText = tipo;
      tipos.appendChild(badge);
    });
  }

  const stats = document.getElementById("modal-stats");
  stats.innerHTML = "";

  if (poke.stats) {
    poke.stats.forEach(stat => {
      const porcentagem = Math.min(100, (stat.valor / 150) * 100);

      const linha = document.createElement("div");
      linha.classList.add("stat-row");
      linha.innerHTML = `
        <span class="stat-name">${stat.nome.replace("SPECIAL-", "SP. ")}:</span>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width: ${porcentagem}%"></div>
        </div>
        <span class="stat-val">${stat.valor}</span>
      `;
      stats.appendChild(linha);
    });
  } else {
    stats.innerHTML = "<p><em>Estatísticas não disponíveis.</em></p>";
  }

  const modal = document.getElementById("modal-pokemon");
  modal.style.display = "flex";
  modal.classList.remove("hidden");
}

//função auxiliar para mudar a cor/texto do botão
function atualizarBotaoFavorito(btn, poke) {
  if (poke.favorito) {
    btn.innerText = "Favoritado ";
    btn.classList.add("favoritado");
  } else {
    btn.innerText = "Favoritar ";
    btn.classList.remove("favoritado");
  }
}

function fecharModal() {
  const modal = document.getElementById("modal-pokemon");
  modal.style.display = "none";
  modal.classList.add("hidden");
}

// Salvamento
function salvar() {
  const dados = {
    moedas: game.moedas,
    danoClique: game.danoClique,
    cps: game.cps,
    tempoMaximo: game.tempoMaximo,
    bonusMoedas: game.bonusMoedas,
    chanceCritico: game.chanceCritico,
    pokedex: game.pokedex,
    config: game.config,
    upgrades: game.upgrades.map(u => ({ id: u.id, nivel: u.nivel, custoAtual: u.custoAtual }))
  };
  localStorage.setItem("PokeClickerSave_v2", JSON.stringify(dados));
}

function carregar() {
  const salvo = localStorage.getItem("PokeClickerSave_v2");
  if (salvo) {
    const dados = JSON.parse(salvo);
    game.moedas = dados.moedas || 0;
    game.danoClique = dados.danoClique || 1;
    game.cps = dados.cps || 0;
    game.tempoMaximo = dados.tempoMaximo || 45;
    game.bonusMoedas = dados.bonusMoedas || 0;
    game.chanceCritico = dados.chanceCritico || 0;
    game.pokedex = dados.pokedex || [];

    if(dados.config) {
      game.config = dados.config;
      document.getElementById("select-geracao").value = game.config.maxPokemonId;
      document.getElementById("select-tema").value = game.config.tema;
      document.body.setAttribute("data-theme", game.config.tema);
    }

    if (dados.upgrades) {
      dados.upgrades.forEach(upSalvo => {
        const upgrade = game.upgrades.find(u => u.id === upSalvo.id);
        if (upgrade) {
          upgrade.nivel = upSalvo.nivel;
          upgrade.custoAtual = upSalvo.custoAtual;
        }
      });
    }

    atualizarPokedex();
  }
}

//Funcao para criar as particulas do critico
function criarParticulasCriticas(x, y) {
  //container para as particulas serem inseridas
  const container = document.body;

  for(let i = 0; i < 20; i++){
    const particula = document.createElement('span');
    particula.classList.add('critico-particula');

    //define direcao e velocidade aleatoria
    const angulo = Math.random() * Math.PI * 2; //0 a 360 graus
    const velocidade = 100 + Math.random() * 150; // Velocidade aleatoria

    particula.style.setProperty('--dx', `${Math.cos(angulo) * velocidade}px`);
    particula.style.setProperty('--dy', `${Math.sin(angulo) * velocidade}px`);

    //Define uma cor aleatoria
    const cor = i % 2 === 0 ? 'var(--crit-yellow)' : 'var(--accent-color)';
    particula.style.backgroundColor = cor;

    //posiciona a particula bem em cima do local do clique
    particula.style.left = `${x}px`;
    particula.style.top = `${y}px`;

    //adiciona ao container
    container.appendChild(particula);

    //remove a tag HTML para n pesar
    setTimeout(() => {
      particula.remove();
    }, 600);
  }
}
//abrir o modal config
function abrirModalConfig() {
  const modal = document.getElementById("modal-config");
  modal.style.display = "flex";
  modal.classList.remove("hidden");
}
//fechar o modal config
function fecharModalConfig() {

  const modal = document.getElementById("modal-config");

  modal.style.display = "none";
  modal.classList.add("hidden");
}
