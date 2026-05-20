<?php
// transformar_em_venda.php — cria uma venda a partir de um orçamento (código sequencial)
session_start();
require 'includes/db.php';

if (!isset($_SESSION['usuario'])) {
  header("Location: login.php");
  exit;
}

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
  $_SESSION['mensagem_erro'] = "ID de orçamento inválido.";
  header("Location: listar_orcamentos.php");
  exit;
}

$id_orc = (int)$_GET['id'];
$id_usuario = (int)($_SESSION['id_usuario'] ?? 0);
date_default_timezone_set('America/Sao_Paulo');

try {
  // 1) Verifica orçamento
  $stmt = $conn->prepare("SELECT * FROM orcamentos WHERE id = ?");
  if (!$stmt) { throw new Exception("Falha ao preparar consulta de orçamento."); }
  $stmt->bind_param("i", $id_orc);
  $stmt->execute();
  $orc = $stmt->get_result()->fetch_assoc();
  if (!$orc) {
    $_SESSION['mensagem_erro'] = "Orçamento não encontrado.";
    header("Location: listar_orcamentos.php");
    exit;
  }

  // 2) Já existe venda deste orçamento?
  $stmt = $conn->prepare("SELECT id FROM vendas WHERE id_orcamento = ?");
  if (!$stmt) { throw new Exception("Falha ao preparar verificação de venda existente."); }
  $stmt->bind_param("i", $id_orc);
  $stmt->execute();
  $ja = $stmt->get_result()->fetch_assoc();
  if ($ja) {
    $_SESSION['mensagem_sucesso'] = "Este orçamento já foi convertido em venda.";
    header("Location: vendas.php");
    exit;
  }

  // 3) Carrega itens do orçamento
  $itens = [];
  $stmt = $conn->prepare("SELECT * FROM orcamento_itens WHERE id_orcamento = ? ORDER BY id");
  if (!$stmt) { throw new Exception("Falha ao preparar consulta de itens."); }
  $stmt->bind_param("i", $id_orc);
  $stmt->execute();
  $res_i = $stmt->get_result();
  while ($row = $res_i->fetch_assoc()) { $itens[] = $row; }

  // 4) Calcula totais
  $total_produtos = 0.0;
  foreach ($itens as $it) {
    $total_produtos += (float)$it['preco_total'];
  }
  $frete     = (float)$orc['frete'];
  $descPerc  = (float)$orc['desconto'];
  $base      = $total_produtos + $frete;
  $vDesc     = $base * ($descPerc / 100.0);
  $total_fin = $base - $vDesc;

  // 5) Inicia transação
  $conn->begin_transaction();

  // 6) Insere venda (codigo_venda será definido após obter o insert_id para garantir sequência 1,2,3…)
  $pagamento = (string)$orc['pagamento'];
  $entrega   = (string)$orc['entrega'];
  $assinatura= (string)$orc['assinatura'];
  $status    = 'aberta';
  $criado_em = date('Y-m-d H:i:s');

  $sqlV = "INSERT INTO vendas 
           (codigo_venda, id_orcamento, id_usuario, nome_cliente, endereco, telefone, email, cnpj, 
            frete, desconto, total_produtos, total_final, pagamento, entrega, assinatura, status, criado_em)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
  $stmt = $conn->prepare($sqlV);
  if (!$stmt) { throw new Exception("Falha ao preparar INSERT de venda."); }

  // código ainda vazio (será atualizado para o próprio id da venda)
  $codigo_venda_tmp = '';
  $stmt->bind_param(
    "siisssssddddsssss",
    $codigo_venda_tmp,          // codigo_venda (provisório)
    $id_orc,                    // id_orcamento
    $id_usuario,                // id_usuario
    $orc['nome_cliente'],       // nome_cliente
    $orc['endereco'],           // endereco
    $orc['telefone'],           // telefone
    $orc['email'],              // email
    $orc['cnpj'],               // cnpj
    $frete,                     // frete (double)
    $descPerc,                  // desconto (double)
    $total_produtos,            // total_produtos (double)
    $total_fin,                 // total_final (double)
    $pagamento,                 // pagamento
    $entrega,                   // entrega
    $assinatura,                // assinatura
    $status,                    // status
    $criado_em                  // criado_em
  );
  $stmt->execute();
  $id_venda = (int)$conn->insert_id;

  // 7) Atualiza codigo_venda = id da venda (sequencial 1,2,3…)
  $codigo_venda = (string)$id_venda;
  $stmt = $conn->prepare("UPDATE vendas SET codigo_venda = ? WHERE id = ?");
  if (!$stmt) { throw new Exception("Falha ao preparar UPDATE de código da venda."); }
  $stmt->bind_param("si", $codigo_venda, $id_venda);
  $stmt->execute();

  // 8) Copia itens -> venda_itens
  $sqlI = "INSERT INTO venda_itens 
           (id_venda, item, descricao, quantidade, preco_unitario, preco_total, imagem, setor)
           VALUES (?,?,?,?,?,?,?,?)";
  $stmtI = $conn->prepare($sqlI);
  if (!$stmtI) { throw new Exception("Falha ao preparar INSERT de itens da venda."); }

  foreach ($itens as $it) {
    $vi_id_venda       = $id_venda;
    $vi_item           = (string)$it['item'];
    $vi_descricao      = (string)$it['descricao'];
    $vi_quantidade     = (int)$it['quantidade'];
    $vi_preco_unit     = (float)$it['preco_unitario'];
    $vi_preco_total    = (float)$it['preco_total'];
    $vi_imagem         = (string)($it['imagem'] ?? '');
    $vi_setor          = (string)($it['setor'] ?? '');

    $stmtI->bind_param(
      "issiddss",
      $vi_id_venda,
      $vi_item,
      $vi_descricao,
      $vi_quantidade,
      $vi_preco_unit,
      $vi_preco_total,
      $vi_imagem,
      $vi_setor
    );
    $stmtI->execute();
  }

  // 9) Commit
  $conn->commit();

  $_SESSION['mensagem_sucesso'] = "Venda criada com sucesso (cód. $codigo_venda).";
  header("Location: vendas.php");
  exit;

} catch (Throwable $e) {
  // rollback apenas se a transação estiver ativa
  if ($conn && $conn->errno === 0) {
    // nada
  } else {
    // melhor tentar o rollback de qualquer forma
    if ($conn) { @$conn->rollback(); }
  }
  $_SESSION['mensagem_erro'] = "Erro ao transformar em venda: " . $e->getMessage();
  header("Location: listar_orcamentos.php");
  exit;
}
