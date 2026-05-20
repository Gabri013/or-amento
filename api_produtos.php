<?php
// API: busca de produtos para autocomplete (JSON)
session_start();
if (!isset($_SESSION['usuario'])) { http_response_code(401); exit; }
require 'includes/db.php';

header('Content-Type: application/json; charset=utf-8');

$q = trim($_GET['q'] ?? '');
$out = [];

if ($q !== '') {
    $like = "%{$q}%";
    $sql = "SELECT id, nome, sku, descricao, preco_base, unidade, imagem
            FROM produtos
            WHERE nome LIKE ? OR sku LIKE ? OR descricao LIKE ?
            ORDER BY nome
            LIMIT 20";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param('sss', $like, $like, $like);
        $stmt->execute();
        $res = $stmt->get_result();
        while($r = $res->fetch_assoc()){
            // caminho de imagem já salvo no banco (use absoluto/relativo conforme seu projeto)
            $out[] = [
                'id'         => (int)$r['id'],
                'nome'       => $r['nome'],
                'sku'        => $r['sku'],
                'descricao'  => $r['descricao'],
                'preco_base' => (float)$r['preco_base'],
                'unidade'    => $r['unidade'],
                'imagem'     => $r['imagem']
            ];
        }
    }
}

echo json_encode($out, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
