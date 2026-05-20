<?php
// Retorna JSON de clientes para autocomplete (id, nome, documento, telefone, email, endereco)
session_start();
require 'includes/db.php';
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario'])) { http_response_code(401); echo json_encode([]); exit; }

$q = trim($_GET['q'] ?? '');
if ($q === '' || mb_strlen($q) < 2) { echo json_encode([]); exit; }

$sql = "SELECT id, nome, documento, telefone, email, endereco
        FROM clientes
        WHERE nome LIKE ? OR documento LIKE ? OR email LIKE ? OR telefone LIKE ?
        ORDER BY nome LIMIT 20";
$like = "%$q%";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ssss', $like, $like, $like, $like);
$stmt->execute();
$res = $stmt->get_result();

$out = [];
while ($r = $res->fetch_assoc()) {
  $out[] = [
    'id'        => (int)$r['id'],
    'nome'      => $r['nome'],
    'documento' => $r['documento'],
    'telefone'  => $r['telefone'],
    'email'     => $r['email'],
    'endereco'  => $r['endereco'],
  ];
}
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
