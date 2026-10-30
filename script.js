// ==========================================================
// IMPORTAÇÕES DO FIREBASE
// ==========================================================
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Arrays dinâmicos
let produtos = [];
let carrinho = [];
let telefoneLojaGlobal = "5531981198416"; // fallback padrão

// ==========================================================
// SELEÇÃO DOS ELEMENTOS DO DOM (Área Pública & Carrinho)
// ==========================================================
const menuBtn = document.getElementById("menu-btn");
const closeMenuBtn = document.getElementById("close-menu-btn");
const sidebar = document.getElementById("sidebar-menu");
const overlay = document.getElementById("overlay");

const cartBtn = document.getElementById("cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartCount = document.getElementById("cart-count");
const cartTotalValue = document.getElementById("cart-total-value");

const cartFormSection = document.getElementById("cart-form-section");
const cartFooterSection = document.getElementById("cart-footer-section");
const continueShoppingBtn = document.getElementById("continue-shopping-btn");
const proceedCheckoutBtn = document.getElementById("proceed-checkout-btn");
const whatsappBtn = document.getElementById("whatsapp-checkout-btn");

const clientNameInput = document.getElementById("client-name");
const partyDateInput = document.getElementById("party-date");
const clientNeighborhoodInput = document.getElementById("client-neighborhood");

const produtosContainer = document.getElementById("produtos-container");
const searchInput = document.getElementById("search-input");
const filterBtns = document.querySelectorAll(".filter-btn");

// ==========================================================
// CARREGAR CONFIGURAÇÕES GLOBAIS DA LOJA NO SITE PÚBLICO
// ==========================================================
async function carregarConfiguracoesPublicas() {
  try {
    const docRef = doc(db, "configuracoes", "loja");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      if (data.whatsapp) {
        telefoneLojaGlobal = data.whatsapp;
      }

      // Atualiza o Nome da Loja
      const h1Loja = document.querySelector(".marca-info h1");
      if (h1Loja && data.nome) h1Loja.textContent = data.nome;

      // Atualiza o Slogan
      const pSlogan = document.querySelector(".marca-info p");
      if (pSlogan && data.slogan) pSlogan.textContent = data.slogan;

      // Atualiza a Logo da Loja se o admin tiver alterado
      if (data.logo) {
        const logoImgs = document.querySelectorAll(".logo-img");
        logoImgs.forEach(img => {
          img.src = data.logo;
        });
      }

      // Atualiza o link do Instagram no menu lateral se preenchido
      const instaLinkElement = document.getElementById("sidebar-instagram-link");
      if (instaLinkElement && data.instagram) {
        instaLinkElement.href = data.instagram;
        instaLinkElement.style.display = "block";
      }

      // Atualiza Rodapé
      const footerContato = document.querySelector(".footer-contact");
      if (footerContato && data.whatsapp) {
        footerContato.innerHTML = `📲 WhatsApp: (${data.whatsapp.substring(2,4)}) ${data.whatsapp.substring(4,9)}-${data.whatsapp.substring(9)} | 📍 ${data.cidade || 'Contagem - MG'}`;
      }
    }
  } catch (error) {
    console.error("Erro ao carregar configurações públicas:", error);
  }
}

// ==========================================================
// 1. CARREGAR PRODUTOS DO FIRESTORE (VITRINE)
// ==========================================================
async function carregarProdutosPublicos() {
  produtosContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #666;">A carregar acervo da loja...</p>`;

  try {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    produtos = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      produtos.push({
        id: docSnap.id,
        nome: data.nome,
        categoria: data.categoria,
        preco: Number(data.preco),
        imagens:
          data.imagens && data.imagens.length > 0
            ? data.imagens
            : data.imagem
              ? [data.imagem]
              : [],
      });
    });

    if (produtos.length === 0) {
      produtosContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #666;">Nenhum produto disponível no momento.</p>`;
      return;
    }

    renderizarProdutos(produtos);
    gerarBotoesFiltroDinamicos();
  } catch (error) {
    console.error("Erro ao carregar produtos públicos:", error);
    produtosContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #e74c3c;">Erro ao carregar o catálogo da nuvem.</p>`;
  }
}

// ==========================================================
// 2. CARREGAR PROVA SOCIAL DO FIRESTORE (INSTAGRAM EMBEDS)
// ==========================================================
async function carregarProvaSocialPublica() {
  const container = document.getElementById("instagram-feed-container");
  if (!container) return;

  try {
    const querySnapshot = await getDocs(collection(db, "provas_sociais"));

    if (querySnapshot.empty) {
      container.innerHTML = `<p style="color: #666; font-size: 0.9rem; text-align: center;">Nenhuma festa cadastrada ainda.</p>`;
      return;
    }

    container.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      const embedHtml = `
        <div class="embed-wrapper" style="margin-bottom: 20px;">
          <blockquote class="instagram-media" 
            data-instgrm-permalink="${data.url}" 
            data-instgrm-version="14">
          </blockquote>
        </div>
      `;
      container.innerHTML += embedHtml;
    });

    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process();
    }
  } catch (error) {
    console.error("Erro ao carregar prova social do Instagram:", error);
  }
}

// ==========================================================
// 3. LÓGICA DO MENU E CARRINHO
// ==========================================================
function abrirMenu() {
  sidebar.classList.add("open");
  overlay.classList.add("active");
}

function fecharMenu() {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
}

function abrirCarrinho() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("active");
  resetarFluxoCarrinho();
  renderizarCarrinho();
}

function fecharCarrinho() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("active");
}

menuBtn.addEventListener("click", abrirMenu);
closeMenuBtn.addEventListener("click", fecharMenu);
overlay.addEventListener("click", fecharMenu);

cartBtn.addEventListener("click", abrirCarrinho);
closeCartBtn.addEventListener("click", fecharCarrinho);
cartOverlay.addEventListener("click", fecharCarrinho);

if (continueShoppingBtn) {
  continueShoppingBtn.addEventListener("click", fecharCarrinho);
}

function resetarFluxoCarrinho() {
  if (cartFormSection) cartFormSection.style.display = "none";
  if (proceedCheckoutBtn) proceedCheckoutBtn.style.display = "block";
  if (whatsappBtn) whatsappBtn.style.display = "none";
}

// ==========================================================
// 4. RENDERIZAÇÃO DOS PRODUTOS NA VITRINE
// ==========================================================
function renderizarProdutos(lista) {
  produtosContainer.innerHTML = "";

  if (lista.length === 0) {
    produtosContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #666;">Nenhum item encontrado.</p>`;
    return;
  }

  lista.forEach((produto) => {
    const listaImagens =
      produto.imagens && produto.imagens.length > 0
        ? produto.imagens
        : [produto.imagem || "https://via.placeholder.com/400"];

    let imagensHtml = "";
    let dotsHtml = "";

    listaImagens.forEach((imgSrc, index) => {
      imagensHtml += `<img src="${imgSrc}" alt="${produto.nome}" onclick="abrirZoomModal('${imgSrc}')" style="cursor: zoom-in;">`;
      dotsHtml += `<div class="slider-dot ${index === 0 ? "active" : ""}"></div>`;
    });

    const cardHtml = `
      <div class="card-produto">
        <div class="card-image-slider">
          <div class="slider-track" onscroll="atualizarPontoAtivo(this)">
            ${imagensHtml}
          </div>
          ${listaImagens.length > 1 ? `<div class="slider-dots">${dotsHtml}</div>` : ""}
        </div>
        <div class="card-info">
          <h3>${produto.nome}</h3>
          <p class="preco">R$ ${Number(produto.preco).toFixed(2).replace(".", ",")} <span>/ diária</span></p>
          <button class="add-cart-btn" onclick="adicionarAoCarrinho('${produto.id}')">Adicionar</button>
        </div>
      </div>
    `;
    produtosContainer.innerHTML += cardHtml;
  });
}

// ==========================================================
// 5. FILTROS E BUSCA
// ==========================================================
// ==========================================================
// GERAR FILTROS DINÂMICOS COM COMPATIBILIDADE EXATA
// ==========================================================
function gerarBotoesFiltroDinamicos() {
  const filterContainer = document.getElementById("filter-buttons-container");
  if (!filterContainer) return;

  // Normaliza as categorias (tudo em minúsculas e sem espaços extras nas pontas)
  const categoriasUnicas = [...new Set(produtos.map(p => p.categoria ? p.categoria.trim().toLowerCase() : ""))].filter(Boolean);

  let botoesHtml = `<button class="filter-btn active" data-filter="all">Todos</button>`;

  categoriasUnicas.forEach(cat => {
    // Formata a primeira letra maiúscula apenas para exibição bonita no botão
    const catFormatada = cat.charAt(0).toUpperCase() + cat.slice(1);
    // Armazena o valor limpo em minúsculas no data-filter para bater certo na busca
    botoesHtml += `<button class="filter-btn" data-filter="${cat}">${catFormatada}</button>`;
  });

  filterContainer.innerHTML = botoesHtml;

  // Reatribui os eventos de clique aos novos botões criados
  const novosFilterBtns = filterContainer.querySelectorAll(".filter-btn");
  novosFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      novosFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filtrarProdutos();
    });
  });
}

// ==========================================================
// FILTRAGEM CORRIGIDA (IGNORANDO DIFERENÇAS DE LETRAS)
// ==========================================================
if (searchInput) {
  searchInput.addEventListener("input", () => {
    filtrarProdutos();
  });
}
function filtrarProdutos() {
  const termoBusca = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const btnAtivo = document.querySelector(".filter-btn.active");
  const categoriaAtiva = btnAtivo ? btnAtivo.dataset.filter : "all";

  const produtosFiltrados = produtos.filter((produto) => {
    const nomeProduto = produto.nome ? produto.nome.toLowerCase() : "";
    const categoriaProduto = produto.categoria ? produto.categoria.trim().toLowerCase() : "";

    const bateNome = nomeProduto.includes(termoBusca);
    const bateCategoria = categoriaAtiva === "all" || categoriaProduto === categoriaAtiva;

    return bateNome && bateCategoria;
  });

  renderizarProdutos(produtosFiltrados);
}
// ==========================================================
// 6. GERENCIAMENTO DO CARRINHO
// ==========================================================
window.adicionarAoCarrinho = function (idProduto) {
  const produto = produtos.find((p) => p.id == idProduto);
  if (produto) {
    carrinho.push(produto);
    atualizarContadorCarrinho();
    abrirCarrinho();
  }
};

window.removerDoCarrinho = function (index) {
  carrinho.splice(index, 1);
  atualizarContadorCarrinho();
  renderizarCarrinho();
};

function atualizarContadorCarrinho() {
  if (cartCount) cartCount.textContent = carrinho.length;
}

function renderizarCarrinho() {
  cartItemsContainer.innerHTML = "";

  if (carrinho.length === 0) {
    cartItemsContainer.innerHTML = `<p class="cart-empty-msg">Seu carrinho está vazio.</p>`;
    if (cartFooterSection) cartFooterSection.style.display = "none";
    return;
  }

  if (cartFooterSection) cartFooterSection.style.display = "flex";
  let total = 0;

  carrinho.forEach((item, index) => {
    total += Number(item.preco);

    const itemHtml = `
      <div class="cart-item-card">
        <div class="cart-item-info">
          <h4>${item.nome}</h4>
          <p>R$ ${Number(item.preco).toFixed(2).replace(".", ",")}</p>
        </div>
        <button class="btn-remove-item" onclick="removerDoCarrinho(${index})">🗑️</button>
      </div>
    `;
    cartItemsContainer.innerHTML += itemHtml;
  });

  cartTotalValue.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;
}

// ==========================================================
// 7. FLUXO DE CHECKOUT E WHATSAPP
// ==========================================================
if (proceedCheckoutBtn) {
  proceedCheckoutBtn.addEventListener("click", () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    if (cartFormSection) cartFormSection.style.display = "block";
    proceedCheckoutBtn.style.display = "none";
    if (whatsappBtn) whatsappBtn.style.display = "block";
  });
}

if (whatsappBtn) {
  whatsappBtn.addEventListener("click", () => {
    const nomeCliente = clientNameInput.value.trim();
    const dataFesta = partyDateInput.value.trim();
    const bairroCliente = clientNeighborhoodInput.value.trim();

    if (!nomeCliente || !dataFesta || !bairroCliente) {
      alert(
        "Por favor, preencha todos os dados da locação antes de enviar o orçamento!",
      );
      return;
    }

    let mensagem = `*Olá! Gostaria de solicitar um orçamento de aluguel de festa:*\n\n`;
    mensagem += `👤 *Cliente:* ${nomeCliente}\n`;
    mensagem += `📅 *Data da Festa:* ${dataFesta}\n`;
    mensagem += `📍 *Bairro/Local:* ${bairroCliente}\n\n`;
    mensagem += `*Itens Selecionados:*\n`;

    let total = 0;
    carrinho.forEach((item) => {
      mensagem += `- ${item.nome} (R$ ${Number(item.preco).toFixed(2).replace(".", ",")})\n`;
      total += Number(item.preco);
    });

    mensagem += `\n💰 *Total Estimado das Peças:* R$ ${total.toFixed(2).replace(".", ",")}\n\n`;
    mensagem += `Aguardo confirmação de disponibilidade e cálculo do frete!`;

    // Utiliza o número dinâmico carregado do Firestore
    const urlWhatsApp = `https://wa.me/${telefoneLojaGlobal}?text=${encodeURIComponent(mensagem)}`;

    window.open(urlWhatsApp, "_blank");
  });
}

// ==========================================================
// 8. INICIALIZAÇÃO
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  carregarConfiguracoesPublicas();
  carregarProdutosPublicos();
  carregarProvaSocialPublica();
  atualizarContadorCarrinho();
});

// Criar dinamicamente o modal de zoom na tela
const zoomModalHtml = `
  <div id="image-zoom-modal" class="zoom-modal-overlay" style="display: none;" onclick="fecharZoomModal()">
    <div class="zoom-modal-content">
      <span class="zoom-close-btn">&times;</span>
      <img id="zoom-modal-img" src="" alt="Zoom da Imagem">
    </div>
  </div>
`;
document.body.insertAdjacentHTML("beforeend", zoomModalHtml);

window.abrirZoomModal = function (imgSrc) {
  const modal = document.getElementById("image-zoom-modal");
  const modalImg = document.getElementById("zoom-modal-img");
  modalImg.src = imgSrc;
  modal.style.display = "flex";
};

window.fecharZoomModal = function () {
  document.getElementById("image-zoom-modal").style.display = "none";
};
