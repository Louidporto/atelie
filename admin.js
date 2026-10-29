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
  updateDoc 
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
const prodImagemBase64 = document.getElementById('prod-imagem-base64');
const adminProdutosList = document.getElementById('admin-produtos-list');

// Modais e Formulários de Prova Social
const modalProva = document.getElementById('modal-prova');
const btnOpenModalProof = document.getElementById('btn-open-modal-proof');
const btnCloseModalProof = document.getElementById('btn-close-modal-proof');
const btnCancelModalProof = document.getElementById('btn-cancel-modal-proof');

const proofForm = document.getElementById('proof-form');
const proofClientInput = document.getElementById('proof-client');
const proofCommentInput = document.getElementById('proof-comment');
const proofImagemFile = document.getElementById('proof-imagem-file');
const adminProvasList = document.getElementById('admin-provas-list');


// ==========================================================
// 1. AUTENTICAÇÃO E OBSERVAÇÃO DE ESTADO
// ==========================================================

googleLoginBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Erro no login:", error);
    alert("Falha ao realizar login com o Google.");
  }
});

logoutBtn.addEventListener('click', async () => {
  if (confirm("Deseja realmente sair do painel?")) {
    await signOut(auth);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    userEmailDisplay.textContent = user.email;

    carregarProdutosAdmin();
    carregarProvasAdmin();
  } else {
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    userEmailDisplay.textContent = '';
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
    modalProdTitle.textContent = "Cadastrar Novo Item 📦";
    productForm.reset();
    prodIdInput.value = "";
    prodImagemBase64.value = "";
  }
  modalProduto.style.display = 'flex';
}

function fecharModalProduto() {
  modalProduto.style.display = 'none';
  productForm.reset();
  prodIdInput.value = "";
  prodImagemBase64.value = "";
}

btnOpenModalProd.addEventListener('click', () => abrirModalProduto(false));
btnCloseModalProd.addEventListener('click', fecharModalProduto);
btnCancelModalProd.addEventListener('click', fecharModalProduto);

function abrirModalProva() {
  proofForm.reset();
  modalProva.style.display = 'flex';
}

function fecharModalProva() {
  modalProva.style.display = 'none';
  proofForm.reset();
}

btnOpenModalProof.addEventListener('click', abrirModalProva);
btnCloseModalProof.addEventListener('click', fecharModalProva);
btnCancelModalProof.addEventListener('click', fecharModalProva);


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
// 5. GESTÃO DE PRODUTOS (FIRESTORE)
// ==========================================================

async function carregarProdutosAdmin() {
  adminProdutosList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #666;">Carregando produtos...</td></tr>`;

  try {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    adminProdutosList.innerHTML = '';
    statTotalProdutos.textContent = querySnapshot.size;

    if (querySnapshot.empty) {
      adminProdutosList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #666;">Nenhum produto cadastrado na nuvem.</td></tr>`;
      return;
    }

        // Na listagem de produtos do admin.js
    querySnapshot.forEach((docSnap) => {
      const produto = docSnap.data();
      const idDoc = docSnap.id;
      // Pega a primeira foto do array ou fallback
      const fotoThumb = produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : (produto.imagem || '');

      const linha = document.createElement('tr');
      linha.innerHTML = `
        <td><img src="${fotoThumb}" alt="${produto.nome}" class="thumb-img"></td>
        <td><strong>${produto.nome}</strong></td>
        <td>${capitalizar(produto.categoria)}</td>
        <td>R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}</td>
        <td>
          <button class="btn-action edit" onclick="prepararEdicaoProduto('${idDoc}', '${escapeHtml(produto.nome)}', '${produto.categoria}', ${produto.preco})">✏️</button>
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

// Salvar / Editar Produto com Feedback Visual
// No envio do Produto
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btnSalvar = document.getElementById('btn-save-prod');
  const textoOriginal = btnSalvar.textContent;

  try {
    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando produto...";

    const idDoc = prodIdInput.value;
    let imagensFinais = JSON.parse(prodImagemBase64.value || "[]");

    const novosArquivos = await converterMultiplosArquivosParaBase64(inputImagemFile);
    if (novosArquivos.length > 0) {
      imagensFinais = novosArquivos; // Substitui ou adiciona novas fotos
    }

    if (imagensFinais.length === 0 && !idDoc) {
      alert("Por favor, selecione pelo menos uma foto para o produto.");
      btnSalvar.disabled = false;
      btnSalvar.textContent = textoOriginal;
      return;
    }

    const dadosProduto = {
      nome: inputNome.value.trim(),
      categoria: inputCategoria.value,
      preco: parseFloat(inputPreco.value),
      imagens: imagensFinais, // Array com várias fotos
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

window.prepararEdicaoProduto = function(id, nome, categoria, preco, imagem) {
  prodIdInput.value = id;
  inputNome.value = nome;
  inputCategoria.value = categoria;
  inputPreco.value = preco;
  prodImagemBase64.value = imagem;

  modalProdTitle.textContent = "Editar Item ✏️";
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
// 6. GESTÃO DE PROVA SOCIAL
// ==========================================================

async function carregarProvasAdmin() {
  adminProvasList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #666;">Carregando festas...</td></tr>`;

  try {
    const querySnapshot = await getDocs(collection(db, "provas_sociais"));
    adminProvasList.innerHTML = '';
    statTotalProvas.textContent = querySnapshot.size;

    if (querySnapshot.empty) {
      adminProvasList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #666;">Nenhuma festa cadastrada.</td></tr>`;
      return;
    }

    // Na listagem de provas sociais do admin.js
    querySnapshot.forEach((docSnap) => {
      const prova = docSnap.data();
      const idDoc = docSnap.id;
      const fotoThumb = prova.imagens && prova.imagens.length > 0 ? prova.imagens[0] : (prova.imagem || '');

      const linha = document.createElement('tr');
      linha.innerHTML = `
        <td><img src="${fotoThumb}" alt="${prova.cliente}" class="thumb-img"></td>
        <td><strong>${prova.cliente}</strong></td>
        <td><em>"${prova.comentario}"</em></td>
        <td>
          <button class="btn-action delete" onclick="excluirProva('${idDoc}')">🗑️</button>
        </td>
      `;
      adminProvasList.appendChild(linha);
    });
  } catch (error) {
    console.error("Erro ao buscar provas sociais:", error);
    adminProvasList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #e74c3c;">Erro ao carregar festas.</td></tr>`;
  }
}

proofForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const imagensFinais = await converterMultiplosArquivosParaBase64(proofImagemFile);
    if (imagensFinais.length === 0) {
      alert("Por favor, selecione pelo menos uma foto da festa.");
      return;
    }

    const novaProva = {
      cliente: proofClientInput.value.trim(),
      comentario: proofCommentInput.value.trim(),
      imagens: imagensFinais, // Salva como array para o carrossel
      criadoEm: new Date()
    };

    await addDoc(collection(db, "provas_sociais"), novaProva);
    alert('Festa cadastrada com sucesso!');
    fecharModalProva();
    carregarProvasAdmin();
  } catch (error) {
    console.error("Erro ao salvar prova social:", error);
    alert('Erro ao salvar festa no banco de dados.');
  }
});

window.excluirProva = async function(idDoc) {
  if (confirm('Deseja excluir este registro de festa real?')) {
    try {
      await deleteDoc(doc(db, "provas_sociais", idDoc));
      alert('Registro excluído!');
      carregarProvasAdmin();
    } catch (error) {
      console.error("Erro ao excluir festa:", error);
      alert('Erro ao excluir registro.');
    }
  }
};


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