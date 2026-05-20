<?php
session_start();
$error = '';



if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $usuarioo = $_POST['usuario'];
    $senha = $_POST['senha'];
    

    require 'db.php';

    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE usuario = ?");
    $stmt->bind_param("s", $usuarioo);
    $stmt->execute();
    $result = $stmt->get_result();

   if ($user = $result->fetch_assoc()) {
      if (password_verify($_POST['senha'], $user['senha'])){
            $_SESSION['usuario'] = $user['usuario'];
            $_SESSION['tipo'] = $user['tipo'];
            $_SESSION['id_usuario'] = $user['id'];
            header("Location: dashboard.php");
            exit;
        } else {
            $error = "Senha incorreta.";
        }
    } else {
        $error = "Usuário não encontrados.";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Login - Cozinca Inox</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
  <div class="container d-flex flex-column justify-content-center align-items-center vh-100">
    <img src="assets/images/logo.png" width="200" alt="Logo Cozinca" class="mb-4">
    <div class="card shadow" style="width: 100%; max-width: 400px;">
      <div class="card-body">
        <h5 class="card-title mb-4 text-center">Acesso ao Sistema</h5>
        <?php if ($error): ?>
            <div class="alert alert-danger"><?= $error ?></div>
        <?php endif; ?>
        <form method="POST" action="">
          <div class="mb-3">
            <label class="form-label">Usuário</label>
            <input type="text" name="usuario" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Senha</label>
            <input type="password" name="senha" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary w-100">Entrar</button>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
