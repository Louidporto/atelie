// ==========================================================
// IMPORTAÇÕES DO FIREBASE
// ==========================================================
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Arrays dinâmicos
let produtos = [];
let carrinho = [];

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

// Container de Prova Social na página pública
const proofGridContainer = document.querySelector(".proof-grid");

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
  } catch (error) {
    console.error("Erro ao carregar produtos públicos:", error);
    produtosContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #e74c3c;">Erro ao carregar o catálogo da nuvem.</p>`;
  }
}

// ==========================================================
// 2. CARREGAR PROVA SOCIAL DO FIRESTORE (FESTAS REAIS)
// ==========================================================
async function carregarProvaSocialPublica() {
  if (!proofGridContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "provas_sociais"));

    if (querySnapshot.empty) {
      proofGridContainer.innerHTML = `<p style="color: #666; font-size: 0.9rem;">Nenhuma festa cadastrada ainda.</p>`;
      return;
    }

    proofGridContainer.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const prova = docSnap.data();
      const listaImagens =
        prova.imagens && prova.imagens.length > 0
          ? prova.imagens
          : prova.imagem
            ? [prova.imagem]
            : ["https://via.placeholder.com/400"];

      let imagensHtml = "";
      let dotsHtml = "";

      listaImagens.forEach((imgSrc, index) => {
        // Cada imagem agora chama a função de zoom passando a si mesma
        imagensHtml += `<img src="${imgSrc}" alt="Festa Cliente" onclick="abrirZoomModal('${imgSrc}')" style="cursor: zoom-in;">`;
        dotsHtml += `<div class="slider-dot ${index === 0 ? "active" : ""}"></div>`;
      });

      const proofCardHtml = `
        <div class="proof-card">
          <div class="card-image-slider">
            <div class="slider-track" onscroll="atualizarPontoAtivo(this)">
              ${imagensHtml}
            </div>
            ${listaImagens.length > 1 ? `<div class="slider-dots">${dotsHtml}</div>` : ""}
          </div>
          <p class="client-name">"${prova.comentario}"</p>
          <span>- ${prova.cliente}</span>
        </div>
      `;
      proofGridContainer.innerHTML += proofCardHtml;
    });
  } catch (error) {
    console.error("Erro ao carregar prova social:", error);
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
      // Cada imagem do produto agora abre o zoom dela própria ao ser clicada
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
function filtrarProdutos() {
  const termoBusca = searchInput.value.toLowerCase();
  const btnAtivo = document.querySelector(".filter-btn.active");
  const categoriaAtiva = btnAtivo ? btnAtivo.dataset.filter : "all";

  const produtosFiltrados = produtos.filter((produto) => {
    const bateNome = produto.nome.toLowerCase().includes(termoBusca);
    const bateCategoria =
      categoriaAtiva === "all" || produto.categoria === categoriaAtiva;
    return bateNome && bateCategoria;
  });

  renderizarProdutos(produtosFiltrados);
}

if (searchInput) {
  searchInput.addEventListener("input", filtrarProdutos);
}

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filtrarProdutos();
  });
});

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

    const telefoneLoja = "31988712203";
    const urlWhatsApp = `https://wa.me/${telefoneLoja}?text=${encodeURIComponent(mensagem)}`;

    window.open(urlWhatsApp, "_blank");
  });
}

// ==========================================================
// 8. INICIALIZAÇÃO
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
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
