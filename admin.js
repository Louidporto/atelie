// ==========================================================
// IMPORTAÇÕES DO FIREBASE
// ==========================================================
import { db, auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================================
// SELEÇÃO DOS ELEMENTOS DO DOM
// ==========================================================
const loginSection = document.getElementById('login-section');
const googleLoginBtn = document.getElementById('google-login-btn');
const dashboardSection = document.getElementById('dashboard-section');
const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');

const statTotalProdutos = document.getElementById('stat-total-produtos');
const statTotalProvas = document.getElementById('stat-total-provas');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Modais e Formulários de Produtos
const modalProduto = document.getElementById('modal-produto');
const btnOpenModalProd = document.getElementById('btn-open-modal-prod');
const btnCloseModalProd = document.getElementById('btn-close-modal-prod');
const btnCancelModalProd = document.getElementById('btn-cancel-modal-prod');
const modalProdTitle = document.getElementById('modal-prod-title');

const productForm = document.getElementById('product-form');
const prodIdInput = document.getElementById('prod-id');
const inputNome = document.getElementById('prod-nome');
const inputCategoria = document.getElementById('prod-categoria');
const inputPreco = document.getElementById('prod-preco');
const inputImagemFile = document.getElementById('prod-imagem-file');
const adminProdutosList = document.getElementById('admin-produtos-list');
const galeriaImagensContainer = document.getElementById('galeria-imagens-container');

// Array em memória para gerenciar a galeria de imagens do produto ativo no modal
let galeriaImagensAtual = [];

// Modais e Formulários de Prova Social (Instagram)
const modalProva = document.getElementById('modal-prova');
const btnOpenModalProof = document.getElementById('btn-open-modal-proof');
const btnCloseModalProof = document.getElementById('btn-close-modal-proof');
const btnCancelModalProof = document.getElementById('btn-cancel-modal-proof');

const proofForm = document.getElementById('proof-form');
const proofUrlInput = document.getElementById('proof-url');
const adminProvasList = document.getElementById('admin-provas-list');

// Elementos de Configuração / Dados da Empresa
const configForm = document.getElementById('config-form');
const configNome = document.getElementById('config-nome');
const configCnpj = document.getElementById('config-cnpj');
const configSlogan = document.getElementById('config-slogan');
const configWhatsapp = document.getElementById('config-whatsapp');
const configCidade = document.getElementById('config-cidade');
const configInstagram = document.getElementById('config-instagram');
const configLogoFile = document.getElementById('config-logo-file');
const configLogoBase64 = document.getElementById('config-logo-base64');


// ==========================================================
// 1. AUTENTICAÇÃO E OBSERVAÇÃO DE ESTADO
// ==========================================================
if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Falha ao realizar login com o Google.");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (confirm("Deseja realmente sair do painel?")) {
      await signOut(auth);
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (userEmailDisplay) userEmailDisplay.textContent = user.email;

    carregarProdutosAdmin();
    carregarProvasAdmin();
    carregarConfiguracoesAdmin();
  } else {
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userEmailDisplay) userEmailDisplay.textContent = '';
  }
});


// ==========================================================
// 2. CONTROLE DAS ABAS
// ==========================================================
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;

    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => {
      c.classList.remove('active');
      c.style.display = 'none';
    });

    btn.classList.add('active');
    const activeContent = document.getElementById(targetTab);
    if (activeContent) {
      activeContent.classList.add('active');
      activeContent.style.display = 'block';
    }
  });
});


// ==========================================================
// 3. CONTROLE DOS MODAIS
// ==========================================================
function abrirModalProduto(modoEdicao = false) {
  if (!modoEdicao) {
    if (modalProdTitle) modalProdTitle.textContent = "Cadastrar Novo Item 📦";
    if (productForm) productForm.reset();
    if (prodIdInput) prodIdInput.value = "";
    galeriaImagensAtual = [];
    renderizarGaleriaModal();
  }
  if (modalProduto) modalProduto.style.display = 'flex';
}

function fecharModalProduto() {
  if (modalProduto) modalProduto.style.display = 'none';
  if (productForm) productForm.reset();
  if (prodIdInput) prodIdInput.value = "";
  galeriaImagensAtual = [];
  renderizarGaleriaModal();
}

if (btnOpenModalProd) btnOpenModalProd.addEventListener('click', () => abrirModalProduto(false));
if (btnCloseModalProd) btnCloseModalProd.addEventListener('click', fecharModalProduto);
if (btnCancelModalProd) btnCancelModalProd.addEventListener('click', fecharModalProduto);

function abrirModalProva() {
  if (proofForm) proofForm.reset();
  if (modalProva) modalProva.style.display = 'flex';
}

function fecharModalProva() {
  if (modalProva) modalProva.style.display = 'none';
  if (proofForm) proofForm.reset();
}

if (btnOpenModalProof) btnOpenModalProof.addEventListener('click', abrirModalProva);
if (btnCloseModalProof) btnCloseModalProof.addEventListener('click', fecharModalProva);
if (btnCancelModalProof) btnCancelModalProof.addEventListener('click', fecharModalProva);


// ==========================================================
// 4. FUNÇÃO DE COMPRESSÃO E CONVERSÃO DE IMAGENS
// ==========================================================
function converterMultiplosArquivosParaBase64(fileInput) {
  return new Promise(async (resolve, reject) => {
    const files = fileInput.files;
    if (!files || files.length === 0) {
      resolve([]);
      return;
    }

    const promessasArray = Array.from(files).map(file => {
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;

          img.onload = () => {
            const maxDimension = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            res(compressedBase64);
          };
          img.onerror = (err) => rej(err);
        };
        reader.onerror = (err) => rej(err);
      });
    });

    try {
      const resultados = await Promise.all(promessasArray);
      resolve(resultados);
    } catch (error) {
      reject(error);
    }
  });
}


// ==========================================================
// 5. GALERIA INTERATIVA NO MODAL DE PRODUTOS
// ==========================================================
function renderizarGaleriaModal() {
  if (!galeriaImagensContainer) return;
  galeriaImagensContainer.innerHTML = "";

  // Renderiza cada foto existente ou recém-adicionada
  galeriaImagensAtual.forEach((imgSrc, index) => {
    const cardImg = document.createElement('div');
    cardImg.style.position = "relative";
    cardImg.style.width = "70px";
    cardImg.style.height = "70px";
    cardImg.style.borderRadius = "8px";
    cardImg.style.overflow = "hidden";
    cardImg.style.border = "1px solid #ccc";
    cardImg.style.backgroundColor = "#f9f9f9";

    cardImg.innerHTML = `
      <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;">
      ${index === 0 ? '<span style="position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.6rem; text-align: center; font-weight: bold;">CAPA</span>' : ''}
      <button type="button" onclick="removerFotoGaleria(${index})" style="position: absolute; top: 2px; right: 2px; background: rgba(231,76,60,0.9); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Remover foto">✕</button>
    `;
    galeriaImagensContainer.appendChild(cardImg);
  });

  // Card pontilhado para adicionar mais fotos
  const btnAdicionarCard = document.createElement('div');
  btnAdicionarCard.style.width = "70px";
  btnAdicionarCard.style.height = "70px";
  btnAdicionarCard.style.borderRadius = "8px";
  btnAdicionarCard.style.border = "2px dashed #3498db";
  btnAdicionarCard.style.display = "flex";
  btnAdicionarCard.style.flexDirection = "column";
  btnAdicionarCard.style.alignItems = "center";
  btnAdicionarCard.style.justifyContent = "center";
  btnAdicionarCard.style.cursor = "pointer";
  btnAdicionarCard.style.backgroundColor = "#ecf0f1";
  btnAdicionarCard.innerHTML = `
    <span style="font-size: 1.2rem; color: #3498db; font-weight: bold;">+</span>
    <span style="font-size: 0.6rem; color: #3498db; font-weight: bold;">Adicionar</span>
  `;

  btnAdicionarCard.addEventListener('click', () => {
    if (inputImagemFile) inputImagemFile.click();
  });

  galeriaImagensContainer.appendChild(btnAdicionarCard);
}

window.removerFotoGaleria = function(index) {
  galeriaImagensAtual.splice(index, 1);
  renderizarGaleriaModal();
};

if (inputImagemFile) {
  inputImagemFile.addEventListener('change', async () => {
    const novosArquivos = await converterMultiplosArquivosParaBase64(inputImagemFile);
    if (novosArquivos && novosArquivos.length > 0) {
      galeriaImagensAtual.push(...novosArquivos);
      renderizarGaleriaModal();
    }
    inputImagemFile.value = "";
  });
}


// ==========================================================
// 6. GESTÃO DE PRODUTOS (FIRESTORE)
// ==========================================================
async function carregarProdutosAdmin() {
  if (!adminProdutosList) return;
  adminProdutosList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #666;">Carregando produtos...</td></tr>`;

  try {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    adminProdutosList.innerHTML = '';
    if (statTotalProdutos) statTotalProdutos.textContent = querySnapshot.size;

    if (querySnapshot.empty) {
      adminProdutosList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #666;">Nenhum produto cadastrado na nuvem.</td></tr>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const produto = docSnap.data();
      const idDoc = docSnap.id;
      const fotoThumb = produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : (produto.imagem || '');
      const imagensJson = encodeURIComponent(JSON.stringify(produto.imagens || [fotoThumb]));

      const linha = document.createElement('tr');
      linha.innerHTML = `
        <td><img src="${fotoThumb}" alt="${produto.nome}" class="thumb-img"></td>
        <td><strong>${produto.nome}</strong></td>
        <td>${capitalizar(produto.categoria)}</td>
        <td>R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}</td>
        <td>
          <button class="btn-action edit" onclick="prepararEdicaoProduto('${idDoc}', '${escapeHtml(produto.nome)}', '${escapeHtml(produto.categoria)}', ${produto.preco}, '${imagensJson}')">✏️</button>
          <button class="btn-action delete" onclick="excluirProduto('${idDoc}')">🗑️</button>
        </td>
      `;
      adminProdutosList.appendChild(linha);
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    adminProdutosList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #e74c3c;">Erro ao carregar dados do Firebase.</td></tr>`;
  }
}

if (productForm) {
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSalvar = document.getElementById('btn-save-prod');
    const textoOriginal = btnSalvar.textContent;

    try {
      btnSalvar.disabled = true;
      btnSalvar.textContent = "Salvando produto...";

      const idDoc = prodIdInput.value;

      if (galeriaImagensAtual.length === 0) {
        alert("Por favor, adicione pelo menos uma foto para o produto.");
        btnSalvar.disabled = false;
        btnSalvar.textContent = textoOriginal;
        return;
      }

      const dadosProduto = {
        nome: inputNome.value.trim(),
        categoria: inputCategoria.value.trim().toLowerCase(),
        preco: parseFloat(inputPreco.value),
        imagens: galeriaImagensAtual,
        atualizadoEm: new Date()
      };

      if (idDoc) {
        await updateDoc(doc(db, "produtos", idDoc), dadosProduto);
        alert('Produto atualizado com sucesso!');
      } else {
        dadosProduto.criadoEm = new Date();
        await addDoc(collection(db, "produtos"), dadosProduto);
        alert('Produto cadastrado com sucesso!');
      }

      fecharModalProduto();
      carregarProdutosAdmin();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert('Erro ao salvar produto: ' + error.message);
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = textoOriginal;
    }
  });
}

window.prepararEdicaoProduto = function(id, nome, categoria, preco, imagensEncoded) {
  prodIdInput.value = id;
  inputNome.value = nome;
  inputCategoria.value = categoria;
  inputPreco.value = preco;

  try {
    galeriaImagensAtual = JSON.parse(decodeURIComponent(imagensEncoded));
  } catch (e) {
    galeriaImagensAtual = [];
  }

  renderizarGaleriaModal();
  if (modalProdTitle) modalProdTitle.textContent = "Editar Item ✏️";
  abrirModalProduto(true);
};

window.excluirProduto = async function(idDoc) {
  if (confirm('Deseja realmente excluir este item?')) {
    try {
      await deleteDoc(doc(db, "produtos", idDoc));
      alert('Produto excluído!');
      carregarProdutosAdmin();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert('Erro ao excluir produto.');
    }
  }
};


// ==========================================================
// 7. GESTÃO DE PROVA SOCIAL (INSTAGRAM)
// ==========================================================
async function carregarProvasAdmin() {
  if (!adminProvasList) return;
  adminProvasList.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #666;">Carregando posts...</td></tr>`;

  try {
    const querySnapshot = await getDocs(collection(db, "provas_sociais"));
    adminProvasList.innerHTML = '';
    if (statTotalProvas) statTotalProvas.textContent = querySnapshot.size;

    if (querySnapshot.empty) {
      adminProvasList.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #666;">Nenhum post do Instagram cadastrado.</td></tr>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const prova = docSnap.data();
      const idDoc = docSnap.id;
      const dataCriacao = prova.criadoEm ? new Date(prova.criadoEm.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A';

      const linha = document.createElement('tr');
      linha.innerHTML = `
        <td><a href="${prova.url}" target="_blank" style="color: #3498db; text-decoration: none;">${prova.url.substring(0, 45)}...</a></td>
        <td>${dataCriacao}</td>
        <td>
          <button class="btn-action delete" onclick="excluirProva('${idDoc}')" title="Excluir Post">🗑️</button>
        </td>
      `;
      adminProvasList.appendChild(linha);
    });
  } catch (error) {
    console.error("Erro ao buscar provas sociais:", error);
    adminProvasList.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #e74c3c;">Erro ao carregar dados.</td></tr>`;
  }
}

if (proofForm) {
  proofForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSalvar = document.getElementById('btn-save-proof');
    const textoOriginal = btnSalvar.textContent;

    try {
      btnSalvar.disabled = true;
      btnSalvar.textContent = "Salvando...";

      const urlInserida = proofUrlInput.value.trim();

      if (!urlInserida.includes("instagram.com")) {
        alert("Por favor, insira um link válido do Instagram.");
        return;
      }

      const novaProva = {
        url: urlInserida,
        criadoEm: new Date()
      };

      await addDoc(collection(db, "provas_sociais"), novaProva);
      alert('Post do Instagram adicionado com sucesso!');
      fecharModalProva();
      carregarProvasAdmin();
    } catch (error) {
      console.error("Erro ao salvar prova social:", error);
      alert('Erro ao salvar o link no banco de dados.');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = textoOriginal;
    }
  });
}

window.excluirProva = async function(idDoc) {
  if (confirm('Deseja realmente remover este post do Instagram da loja?')) {
    try {
      await deleteDoc(doc(db, "provas_sociais", idDoc));
      alert('Post removido!');
      carregarProvasAdmin();
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      alert('Erro ao remover o registro.');
    }
  }
};


// ==========================================================
// 8. GESTÃO DE DADOS CADASTRAIS DA LOJA
// ==========================================================
async function carregarConfiguracoesAdmin() {
  try {
    const docRef = doc(db, "configuracoes", "loja");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (configNome) configNome.value = data.nome || "";
      if (configCnpj) configCnpj.value = data.cnpj || "";
      if (configSlogan) configSlogan.value = data.slogan || "";
      if (configWhatsapp) configWhatsapp.value = data.whatsapp || "";
      if (configCidade) configCidade.value = data.cidade || "";
      if (configInstagram) configInstagram.value = data.instagram || "";
      if (configLogoBase64) configLogoBase64.value = data.logo || "";
    }
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
  }
}

if (configForm) {
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSalvar = document.getElementById('btn-save-config');
    const textoOriginal = btnSalvar.textContent;

    try {
      btnSalvar.disabled = true;
      btnSalvar.textContent = "Salvando...";

      let logoFinal = configLogoBase64 ? configLogoBase64.value : "";
      if (configLogoFile) {
        const arquivosLogo = await converterMultiplosArquivosParaBase64(configLogoFile);
        if (arquivosLogo.length > 0) {
          logoFinal = arquivosLogo[0];
        }
      }

      const dadosLoja = {
        nome: configNome.value.trim(),
        cnpj: configCnpj.value.trim(),
        slogan: configSlogan.value.trim(),
        whatsapp: configWhatsapp.value.trim(),
        cidade: configCidade.value.trim(),
        instagram: configInstagram.value.trim(),
        logo: logoFinal,
        atualizadoEm: new Date()
      };

      await setDoc(doc(db, "configuracoes", "loja"), dadosLoja);
      alert("Configurações e logotipo atualizados com sucesso!");
      carregarConfiguracoesAdmin();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar dados.");
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = textoOriginal;
    }
  });
}


// ==========================================================
// FUNÇÕES AUXILIARES
// ==========================================================
function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function escapeHtml(texto) {
  return texto ? texto.replace(/'/g, "\\'") : '';
}
