<?php
// criar_orcamento.php — Orçamento com modal para adicionar produtos (buscar ou manual), setores e soma dinâmica
session_start();
if (!isset($_SESSION['usuario'])) { header("Location: login.php"); exit; }
require 'includes/db.php';

function gerarCodigoOrcamento($conn, $id_usuario, $usuario) {
    $query = "SELECT COUNT(*) as total FROM orcamentos WHERE id_usuario = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $numero = str_pad(($result['total'] ?? 0) + 1, 3, '0', STR_PAD_LEFT);
    return $numero . strtoupper(substr($usuario, 0, 1));
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Criar Orçamento - Cozinca Inox</title>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css"/>

<style>
  :root { --cozinca:#ff530d; --cozinca2:#ffcb0c; --ink:#1c1c1c; }
  body { background:#f7f8fa; }
  .navbar { background:#1c1c1c; }
  .navbar-brand img { height:40px; }
  .navbar .nav-link { color:#ff530d !important; font-weight:700; }
  .card { border:0; box-shadow:0 2px 10px rgba(0,0,0,.06); border-radius:12px; }
  .card h5 .badge { background:var(--cozinca); }
  .btn-cozinca { background:var(--cozinca); color:#fff; }
  .btn-cozinca:hover{ background:#e0480c; color:#fff; }
  .badge-soft { background:#fff3e8; color:#8a3b12; border:1px solid #ffd6b8 }
  .item-grid { display:grid; grid-template-columns: .9fr 1.3fr 2fr .6fr .8fr 1fr .9fr .3fr; gap:12px; align-items:center; }
  .thumb { height:44px; border-radius:6px; border:1px solid #eaeaea; object-fit:cover }
  .subtotal { font-weight:700; }
  .totais .list-group-item { display:flex; justify-content:space-between; align-items:center; }
  .totais .valor { font-weight:800; }
  .accordion-button { background:#fff; }
  .accordion-button .setor-tag{ margin-left:.5rem; font-size:.85rem; }
</style>
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark px-3">
  <a class="navbar-brand" href="#"><img src="imagens/logo_cozinca.png" alt="Cozinca"></a>
  <div class="ms-auto">
    <a class="nav-link d-inline-block" href="dashboard.php">🏠 Painel</a>
    <a class="nav-link d-inline-block" href="listar_orcamentos.php">📄 Lista</a>
  </div>
</nav>

<div class="container my-4">
  <div class="d-flex align-items-center mb-3">
    <a href="/" class="btn btn-outline-secondary btn-sm me-3" id="btnVoltarPainel">← Voltar</a>
    <h2 class="me-2 mb-0" style="color:var(--cozinca)">Criar Novo Orçamento</h2>
    <span class="badge badge-soft ms-2"></span>
  </div>

  <form id="formOrc" action="salvar_orcamento.php" method="POST" enctype="multipart/form-data">
    <!-- DADOS DO CLIENTE -->
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title mb-3"><span class="badge">1</span> Dados do Cliente</h5>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Cliente (buscar cadastrado ou digite)</label>
            <select id="cliente_select" class="form-select">
              <option value="">Digite para buscar...</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Nome do Cliente</label>
            <input type="text" name="nome_cliente" class="form-control" placeholder="Ex.: Restaurante ABC">
          </div>
          <div class="col-md-6">
            <label class="form-label">Endereço</label>
            <input type="text" name="endereco" class="form-control" placeholder="Rua, nº, bairro, cidade">
          </div>
          <div class="col-md-3">
            <label class="form-label">Telefone</label>
            <input type="text" name="telefone" class="form-control" placeholder="(00) 00000-0000">
          </div>
          <div class="col-md-3">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-control" placeholder="contato@cliente.com.br">
          </div>
          <div class="col-md-3">
            <label class="form-label">CNPJ</label>
            <input type="text" name="cnpj" class="form-control" placeholder="00.000.000/0000-00">
          </div>
          <div class="col-md-3">
            <label class="form-label">Vendedor</label>
            <select id="vendedor" name="vendedor" class="form-select">
              <option value="Camille">Camille</option>
              <option value="Nilton">Nilton</option>
              <option value="David">David</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- PRODUTOS / SETORES -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h5 class="card-title mb-0"><span class="badge">2</span> Produtos / Setores</h5>
          <div class="d-flex gap-2">
            <!-- agora abre o modal -->
            <button type="button" class="btn btn-sm btn-cozinca" id="btnAddProdutoModal">+ Adicionar produto</button>
            <button type="button" class="btn btn-sm btn-outline-dark" data-bs-toggle="modal" data-bs-target="#modalSetor">+ Adicionar Setor</button>
          </div>
        </div>

        <div id="itens-livres" class="mb-3"></div>
        <div class="accordion" id="accSetores"></div>

        <!-- Totais -->
        <div class="row mt-3">
          <div class="col-lg-6">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Frete (R$)</label>
                <input type="text" id="frete_mask" class="form-control" placeholder="0,00">
                <input type="hidden" id="frete" name="frete" value="0">
              </div>
              <div class="col-md-6">
                <label class="form-label">Desconto (%)</label>
                <input type="number" step="0.01" id="desconto" name="desconto" class="form-control" value="0">
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <ul class="list-group totais">
              <li class="list-group-item"><span>Total Produtos</span><span class="valor" id="t_prod">R$ 0,00</span></li>
              <li class="list-group-item"><span>Total + Frete</span><span class="valor" id="t_geral">R$ 0,00</span></li>
              <li class="list-group-item"><span>Desconto (<span id="lab_desc">0,00%</span>)</span><span class="valor text-danger" id="t_desc">- R$ 0,00</span></li>
              <li class="list-group-item"><span>Total Final</span><span class="valor" id="t_final">R$ 0,00</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- CONDIÇÕES -->
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title mb-3"><span class="badge">3</span> Condições da Proposta</h5>
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Forma de Pagamento</label>
            <input type="text" name="forma_pagamento" class="form-control" placeholder="Ex.: à vista 5% / cartão 6x...">
          </div>
          <div class="col-md-4">
            <label class="form-label">Prazo para Entrega</label>
            <input type="text" name="condicoes_entrega" class="form-control" placeholder="Ex.: 15 dias">
          </div>
          <div class="col-md-4">
            <label class="form-label">Assinatura</label>
            <input type="text" name="assinatura_vendedor" class="form-control" placeholder="Nome do responsável">
          </div>
        </div>
      </div>
    </div>

    <input type="hidden" name="codigo_orcamento" value="<?php echo gerarCodigoOrcamento($conn, $_SESSION['id_usuario'], $_SESSION['usuario']); ?>">

    <div class="text-end">
      <button type="submit" class="btn btn-lg btn-cozinca">Salvar Orçamento</button>
    </div>
  </form>
</div>

<!-- MODAL: Novo Setor -->
<div class="modal fade" id="modalSetor" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <form class="modal-content" id="formSetor" onsubmit="event.preventDefault(); criarSetor();">
      <div class="modal-header">
        <h5 class="modal-title">Novo Setor</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body">
        <label class="form-label">Nome do setor</label>
        <input type="text" id="nomeSetor" class="form-control" placeholder="Ex.: Cozinha 1, Copa...">
      </div>
      <div class="modal-footer">
        <button class="btn btn-cozinca" type="submit">Adicionar</button>
      </div>
    </form>
  </div>
</div>

<!-- MODAL: Adicionar Produto -->
<div class="modal fade" id="modalProduto" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Adicionar produto</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body">
        <div class="row g-3 mb-2">
          <div class="col-md-6">
            <label class="form-label">Setor</label>
            <select id="produto_setor" class="form-select">
              <option value="">Sem setor</option>
            </select>
            <div class="form-text">Escolha onde o item será inserido.</div>
          </div>
        </div>

        <ul class="nav nav-tabs" id="tabProduto" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="tab-busca-tab" data-bs-toggle="tab" data-bs-target="#tab-busca" type="button" role="tab">Buscar produto cadastrado</button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="tab-manual-tab" data-bs-toggle="tab" data-bs-target="#tab-manual" type="button" role="tab">Adicionar manualmente</button>
          </li>
        </ul>
        <div class="tab-content p-3 border border-top-0 rounded-bottom">
          <!-- BUSCA -->
          <div class="tab-pane fade show active" id="tab-busca" role="tabpanel">
            <label class="form-label">Produto</label>
            <select id="busca_produto" class="form-select">
              <option value="">Digite para buscar...</option>
            </select>
            <div class="row g-3 mt-2">
              <div class="col-md-6">
                <label class="form-label">Nome</label>
                <input type="text" id="p_nome" class="form-control" placeholder="Nome do produto">
              </div>
              <div class="col-md-6">
                <label class="form-label">Preço unitário (R$)</label>
                <input type="number" step="0.01" id="p_preco" class="form-control" placeholder="0,00">
              </div>
              <div class="col-md-12">
                <label class="form-label">Descrição</label>
                <textarea id="p_desc" class="form-control" rows="2" placeholder="Descrição"></textarea>
              </div>
              <div class="col-md-4">
                <label class="form-label">Quantidade</label>
                <input type="number" id="p_qtd" class="form-control" min="1" step="1" value="1">
              </div>
              <div class="col-md-8 d-flex align-items-end">
                <img id="p_thumb" class="thumb d-none" alt="thumb">
              </div>
            </div>
          </div>
          <!-- MANUAL -->
          <div class="tab-pane fade" id="tab-manual" role="tabpanel">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nome do produto</label>
                <input type="text" id="m_nome" class="form-control" placeholder="Produto">
              </div>
              <div class="col-md-6">
                <label class="form-label">Preço unitário (R$)</label>
                <input type="number" step="0.01" id="m_preco" class="form-control" placeholder="0,00">
              </div>
              <div class="col-md-12">
                <label class="form-label">Descrição</label>
                <textarea id="m_desc" class="form-control" rows="2" placeholder="Descrição"></textarea>
              </div>
              <div class="col-md-4">
                <label class="form-label">Quantidade</label>
                <input type="number" id="m_qtd" class="form-control" min="1" step="1" value="1">
              </div>
              <div class="col-md-8">
                <label class="form-label">Foto (opcional)</label>
                <input type="file" id="m_foto" accept="image/*" class="form-control">
              </div>
            </div>
          </div>
        </div><!-- tab-content -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-cozinca" id="btnConfirmProduto">Adicionar</button>
      </div>
    </div>
  </div>
</div>

<!-- Template de linha -->
<template id="tplItem">
  <div class="item-grid align-items-center mb-2">
    <select class="form-select produto_select">
      <option value="">Buscar produto...</option>
    </select>
    <input type="hidden" name="setor[]" value="">
    <input type="hidden" name="produto_id[]" class="produto_id" value="">

    <input type="text" name="item[]" class="form-control inp-item" placeholder="Produto (livre)">
    <textarea name="descricao[]" class="form-control inp-desc" placeholder="Descrição"></textarea>
    <input type="number" name="quantidade[]" class="form-control inp-qtd" placeholder="Qtd" min="0" step="1">
    <input type="number" name="preco_unitario[]" class="form-control inp-preco" placeholder="Preço" min="0" step="0.01">
    <div class="d-flex align-items-center gap-2">
      <input type="file" name="foto[]" accept="image/*" class="form-control" style="padding:.375rem .5rem">
      <img class="thumb d-none" alt="thumb">
    </div>
    <div class="d-flex align-items-center gap-2">
      <span class="subtotal">R$ 0,00</span>
      <button type="button" class="btn btn-sm btn-outline-danger btnRemove">&times;</button>
    </div>
  </div>
</template>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/imask"></script>

<script>
/* ====== Plugins básicos ====== */
const vendedorChoices = new Choices('#vendedor', { searchEnabled: true, itemSelectText: '' });

const freteMask = IMask(document.getElementById('frete_mask'), {
  mask: Number, scale: 2, signed: false, thousandsSeparator: '.', padFractionalZeros: true,
  radix: ',', mapToRadix: ['.']
});
freteMask.on('accept', syncFreteHidden); freteMask.on('complete', syncFreteHidden);
function syncFreteHidden(){ const raw=freteMask.unmaskedValue; const num=raw?(parseInt(raw,10)/100):0; document.getElementById('frete').value=isNaN(num)?0:num; atualizarTotais(); }

/* ===== Helpers ===== */
function fmtBR(n){ return 'R$ ' + (Number(n||0).toFixed(2)).replace('.', ','); }
function debounce(fn, w){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), w); }; }

/* ===== Cliente autocomplete ===== */
const clienteChoices = new Choices('#cliente_select', {
  searchEnabled: true, itemSelectText: '', shouldSort:false, searchResultLimit:10,
  noResultsText:'Nenhum cliente encontrado', noChoicesText:'Digite para buscar'
});
const fetchClientes = debounce(async (term)=>{
  if(!term || term.length<2){ clienteChoices.clearChoices(); return; }
  const r = await fetch('api_buscar_clientes.php?q='+encodeURIComponent(term), {credentials:'same-origin'});
  if (!r.ok) { clienteChoices.clearChoices(); return; }
  const data = await r.json();
  clienteChoices.clearChoices();
  clienteChoices.setChoices((data||[]).map(c=>({value:String(c.id),label:`${c.nome}${c.documento?' • '+c.documento:''}`,customProperties:c})), 'value','label', true);
}, 250);
clienteChoices.passedElement.element.addEventListener('search', ev=>{
  const term = (ev.detail && ev.detail.value) ? ev.detail.value : '';
  fetchClientes(term);
});
document.getElementById('cliente_select').addEventListener('change', ()=>{
  const sel = clienteChoices.getValue();
  const c = sel && sel.customProperties ? sel.customProperties : null;
  if(!c) return;
  document.querySelector('input[name="nome_cliente"]').value = c.nome||'';
  document.querySelector('input[name="endereco"]').value     = c.endereco||'';
  document.querySelector('input[name="telefone"]').value     = c.telefone||'';
  document.querySelector('input[name="email"]').value        = c.email||'';
  document.querySelector('input[name="cnpj"]').value         = c.documento||'';
});

/* ===== Produtos (Choices por linha) ===== */
function initProdutoSelect(selectEl, rowRoot){
  const choices = new Choices(selectEl, {
    searchEnabled: true, itemSelectText: '', shouldSort:false, searchResultLimit:10,
    placeholderValue:'Buscar produto cadastrado', noResultsText:'Nenhum produto encontrado', noChoicesText:'Digite para buscar'
  });

  const fetchProdutos = debounce(async (term)=>{
    if (!term || term.trim().length < 2) { choices.clearChoices(); return; }
    const r = await fetch('api_produtos.php?q='+encodeURIComponent(term), {credentials:'same-origin'});
    if(!r.ok){ choices.clearChoices(); return; }
    const data = await r.json();
    choices.clearChoices();
    choices.setChoices((data||[]).map(p=>({ value:String(p.id), label:`${p.nome}${p.sku?' • '+p.sku:''}`, customProperties:p })), 'value','label', true);
  }, 250);

  choices.passedElement.element.addEventListener('search', ev=>{
    const term = (ev.detail && ev.detail.value) ? ev.detail.value : '';
    fetchProdutos(term);
  });

  selectEl.addEventListener('change', ()=>{
    const sel = choices.getValue();
    const p   = sel && sel.customProperties ? sel.customProperties : null;
    if(!p) return;
    rowRoot.querySelector('.produto_id').value   = p.id || '';
    rowRoot.querySelector('.inp-item').value     = p.nome || '';
    rowRoot.querySelector('.inp-desc').value     = p.descricao || '';
    rowRoot.querySelector('.inp-preco').value    = (p.preco_base ? Number(p.preco_base).toFixed(2) : '');
    const qtdEl = rowRoot.querySelector('.inp-qtd');
    if (!qtdEl.value || Number(qtdEl.value) <= 0) qtdEl.value = 1;
    const img = rowRoot.querySelector('.thumb');
    if (p.imagem){ img.src = p.imagem; img.classList.remove('d-none'); } else { img.classList.add('d-none'); }
    recalcRow(rowRoot);
  });

  return choices;
}

/* ===== Linhas / Setores ===== */
function criarLinhaItem(setorNome=''){
  const tpl = document.getElementById('tplItem').content.cloneNode(true);
  const root = tpl.querySelector('.item-grid');
  root.querySelector('input[name="setor[]"]').value = setorNome;

  // Choices do produto (cada linha tem sua busca)
  initProdutoSelect(root.querySelector('.produto_select'), root);

  const qtd   = root.querySelector('.inp-qtd');
  const preco = root.querySelector('.inp-preco');
  const subEl = root.querySelector('.subtotal');

  function calcSub(){ subEl.textContent = fmtBR((parseFloat(qtd.value)||0)*(parseFloat(preco.value)||0)); atualizarTotais(); }
  qtd.addEventListener('input', calcSub); preco.addEventListener('input', calcSub);

  const file = root.querySelector('input[type="file"]');
  const img  = root.querySelector('.thumb');
  file.addEventListener('change', () => {
    const f = file.files && file.files[0];
    if(!f){ img.classList.add('d-none'); return; }
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; img.classList.remove('d-none'); };
    reader.readAsDataURL(f);
  });

  root.querySelector('.btnRemove').addEventListener('click', () => { root.remove(); atualizarTotais(); });

  return root;
}

function recalcRow(row){
  const q = parseFloat(row.querySelector('.inp-qtd').value)||0;
  const p = parseFloat(row.querySelector('.inp-preco').value)||0;
  row.querySelector('.subtotal').textContent = fmtBR(q*p);
  atualizarTotais();
}

function atualizarTotais(){
  let totalProd = 0;
  document.querySelectorAll('.item-grid').forEach(row=>{
    const q = parseFloat(row.querySelector('.inp-qtd').value) || 0;
    const p = parseFloat(row.querySelector('.inp-preco').value) || 0;
    totalProd += (q*p);
  });
  const frete = parseFloat(document.getElementById('frete').value) || 0;
  const descP = parseFloat(document.getElementById('desconto').value) || 0;
  const totalGeral = totalProd + frete;
  const vDesc = totalGeral * (descP/100);
  const final = totalGeral - vDesc;
  document.getElementById('t_prod').textContent  = fmtBR(totalProd);
  document.getElementById('t_geral').textContent = fmtBR(totalGeral);
  document.getElementById('t_desc').textContent  = '- ' + fmtBR(vDesc);
  document.getElementById('t_final').textContent = fmtBR(final);
  document.getElementById('lab_desc').textContent = (descP || 0).toFixed(2) + '%';
}

/* ===== Setores ===== */
let accIndex = 0;
function listarSetores(){
  return Array.from(document.querySelectorAll('.accordion-item[data-setor]')).map(el => el.getAttribute('data-setor'));
}
function popularSelectSetorModal(){
  const sel = document.getElementById('produto_setor');
  const atual = sel.value;
  sel.innerHTML = '<option value="">Sem setor</option>';
  listarSetores().forEach(s=>{
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });
  if (Array.from(sel.options).some(o=>o.value===atual)) sel.value = atual;
}
function criarSetorAcordeao(nomeSetor){
  const acc = document.getElementById('accSetores');
  const id = 'setor' + (++accIndex);
  const wrap = document.createElement('div');
  wrap.className = 'accordion-item mb-2';
  wrap.setAttribute('data-setor', nomeSetor);
  wrap.innerHTML = `
    <h2 class="accordion-header" id="h-${id}">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#c-${id}">
        Setor: ${nomeSetor} <span class="badge-soft setor-tag ms-2 px-2 py-1 rounded-3">${nomeSetor}</span>
      </button>
    </h2>
    <div id="c-${id}" class="accordion-collapse collapse" data-bs-parent="#accSetores">
      <div class="accordion-body">
        <div class="d-flex flex-wrap gap-2 mb-2">
          <button type="button" class="btn btn-sm btn-cozinca btnOpenProdutoSetor" data-setor="${nomeSetor}">
            + Item neste setor
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.accordion-item').remove(); atualizarTotais();">
            Remover setor
          </button>
        </div>
        <div class="body-setor" data-setor="${nomeSetor}"></div>
      </div>
    </div>
  `;
  acc.appendChild(wrap);
  // re-vincula o botão que abre o modal já com setor selecionado
  wrap.querySelector('.btnOpenProdutoSetor').addEventListener('click', (e)=>{
    openProdutoModal(e.currentTarget.getAttribute('data-setor') || '');
  });
  // atualiza lista no modal
  popularSelectSetorModal();
  return wrap.querySelector('.body-setor');
}
function criarSetor(){
  const nome = (document.getElementById('nomeSetor').value || '').trim();
  if(!nome) return;
  criarSetorAcordeao(nome);
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalSetor'));
  modal.hide();
  document.getElementById('nomeSetor').value = '';
}

/* ===== Modal de Produto ===== */
let modalProduto, choicesBuscaProduto;
function openProdutoModal(prefSetor=''){
  // popular setores
  popularSelectSetorModal();
  document.getElementById('produto_setor').value = prefSetor || '';

  // limpar campos
  document.getElementById('busca_produto').value = '';
  if (choicesBuscaProduto){ choicesBuscaProduto.clearStore(); choicesBuscaProduto.clearChoices(); }
  document.getElementById('p_nome').value = '';
  document.getElementById('p_preco').value = '';
  document.getElementById('p_desc').value = '';
  document.getElementById('p_qtd').value = 1;
  document.getElementById('p_thumb').classList.add('d-none');

  document.getElementById('m_nome').value = '';
  document.getElementById('m_preco').value = '';
  document.getElementById('m_desc').value = '';
  document.getElementById('m_qtd').value = 1;
  document.getElementById('m_foto').value = '';

  (modalProduto ||= new bootstrap.Modal(document.getElementById('modalProduto'))).show();
}
document.getElementById('btnAddProdutoModal').addEventListener('click', ()=> openProdutoModal(''));

function initBuscaProdutoModal(){
  const sel = document.getElementById('busca_produto');
  choicesBuscaProduto = new Choices(sel, {
    searchEnabled:true, itemSelectText:'', shouldSort:false, searchResultLimit:10,
    placeholderValue:'Buscar produto...', noResultsText:'Nenhum produto encontrado', noChoicesText:'Digite para buscar'
  });

  const fetchProdutos = debounce(async (term)=>{
    if (!term || term.trim().length < 2) { choicesBuscaProduto.clearChoices(); return; }
    const r = await fetch('api_produtos.php?q='+encodeURIComponent(term), {credentials:'same-origin'});
    if(!r.ok){ choicesBuscaProduto.clearChoices(); return; }
    const data = await r.json();
    choicesBuscaProduto.clearChoices();
    choicesBuscaProduto.setChoices((data||[]).map(p=>({ value:String(p.id), label:`${p.nome}${p.sku?' • '+p.sku:''}`, customProperties:p })), 'value','label', true);
  }, 250);

  choicesBuscaProduto.passedElement.element.addEventListener('search', ev=>{
    const term = (ev.detail && ev.detail.value) ? ev.detail.value : '';
    fetchProdutos(term);
  });

  sel.addEventListener('change', ()=>{
    const selv = choicesBuscaProduto.getValue();
    const p = selv && selv.customProperties ? selv.customProperties : null;
    if(!p) return;
    document.getElementById('p_nome').value  = p.nome || '';
    document.getElementById('p_desc').value  = p.descricao || '';
    document.getElementById('p_preco').value = p.preco_base ? Number(p.preco_base).toFixed(2) : '';
    document.getElementById('p_qtd').value   = 1;
    const img = document.getElementById('p_thumb');
    if (p.imagem){ img.src = p.imagem; img.classList.remove('d-none'); } else { img.classList.add('d-none'); }
  });
}
initBuscaProdutoModal();

/* ===== Confirmar produto do modal -> cria linha ===== */
document.getElementById('btnConfirmProduto').addEventListener('click', ()=>{
  const setor = document.getElementById('produto_setor').value || '';

  // se o setor não existir e não for vazio, cria agora
  if (setor && !listarSetores().includes(setor)) {
    criarSetorAcordeao(setor);
  }

  // qual aba ativa?
  const abaBuscaAtiva = document.getElementById('tab-busca').classList.contains('active');

  let itemNome, desc, preco, qtd, produtoId=null, imgUrl=null;

  if (abaBuscaAtiva) {
    const sel = choicesBuscaProduto.getValue();
    const p   = sel && sel.customProperties ? sel.customProperties : null;
    itemNome = document.getElementById('p_nome').value.trim();
    desc     = document.getElementById('p_desc').value.trim();
    preco    = parseFloat(document.getElementById('p_preco').value) || 0;
    qtd      = parseInt(document.getElementById('p_qtd').value || '1', 10);
    if (p) { produtoId = p.id; imgUrl = p.imagem || null; }
    if (!itemNome) { alert('Informe o nome do produto.'); return; }
  } else {
    itemNome = document.getElementById('m_nome').value.trim();
    desc     = document.getElementById('m_desc').value.trim();
    preco    = parseFloat(document.getElementById('m_preco').value) || 0;
    qtd      = parseInt(document.getElementById('m_qtd').value || '1', 10);
    if (!itemNome) { alert('Informe o nome do produto.'); return; }
  }

  // criar linha e preencher
  const row = criarLinhaItem(setor);
  row.querySelector('.inp-item').value  = itemNome;
  row.querySelector('.inp-desc').value  = desc;
  row.querySelector('.inp-preco').value = preco ? preco.toFixed(2) : '';
  row.querySelector('.inp-qtd').value   = qtd > 0 ? qtd : 1;
  if (produtoId) row.querySelector('.produto_id').value = produtoId;

  if (imgUrl) { const im = row.querySelector('.thumb'); im.src = imgUrl; im.classList.remove('d-none'); }

  // onde inserir
  if (!setor) {
    document.getElementById('itens-livres').appendChild(row);
  } else {
    const alvo = document.querySelector(`.body-setor[data-setor="${CSS.escape(setor)}"]`);
    (alvo || document.getElementById('itens-livres')).appendChild(row);
  }

  recalcRow(row);
  atualizarTotais();
  bootstrap.Modal.getInstance(document.getElementById('modalProduto')).hide();
});

/* ===== Inicialização ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  // 1 linha livre por padrão? agora usamos modal; mas deixo uma:
  document.getElementById('itens-livres').appendChild(criarLinhaItem(''));
  atualizarTotais();
  // botão da seção para abrir modal
  document.getElementById('btnAddProdutoModal').addEventListener('click', ()=> openProdutoModal(''));
});

// Recalcula ao mudar desconto
document.getElementById('desconto').addEventListener('input', atualizarTotais);
</script>
</body>
</html>
