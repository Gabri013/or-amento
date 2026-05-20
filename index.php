<?php
require_once '../../config/config.php';
requirePermission(['master', 'vendedor']);

$_SESSION['usuario'] = $_SESSION['usuario_nome'] ?? ($_SESSION['usuario'] ?? '');
$_SESSION['id_usuario'] = $_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null);
$_SESSION['tipo'] = ($_SESSION['usuario_tipo'] ?? '') === 'master' ? 'admin' : 'usuario';

$page_title = 'Orcamentos';

$allowed_pages = [
    'dashboard' => 'dashboard.php',
    'novo' => 'criar_orcamento.php',
    'listar' => 'listar_orcamentos.php',
    'vendas' => 'vendas.php',
    'cadastros' => 'cadastro.php',
    'relatorios' => 'relatorios.php'
];

$page_key = $_GET['page'] ?? 'dashboard';
if (!isset($allowed_pages[$page_key])) {
    $page_key = 'dashboard';
}

if ($page_key === 'novo') {
    header("Location: " . SITE_URL . '/modules/orcamento_2_0/criar_orcamento.php');
    exit;
}

$iframe_src = SITE_URL . '/modules/orcamento_2_0/' . $allowed_pages[$page_key];

include '../../includes/header.php';
?>

<style>
.orcamento-shell {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.orcamento-shell-card {
    background: linear-gradient(180deg, #ffffff 0%, #f4f6f8 100%);
    border: 1px solid #dde3ea;
    border-radius: 14px;
    padding: 18px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.orcamento-shell-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.orcamento-shell-title h3 {
    margin: 0;
}

.orcamento-shell-title p {
    margin: 6px 0 0;
    color: #6b7280;
}

.orcamento-shell-tabs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.orcamento-shell-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 999px;
    background: #eef2f5;
    color: #314155;
    text-decoration: none;
    font-weight: 700;
    border: 1px solid transparent;
}

.orcamento-shell-tab.active {
    background: #1f5f2b;
    color: #fff;
    border-color: #1f5f2b;
}

.orcamento-shell-frame-wrap {
    background: #fff;
    border: 1px solid #d9e1e8;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}

.orcamento-shell-frame {
    display: block;
    width: 100%;
    min-height: 78vh;
    border: 0;
    background: #fff;
}

@media (max-width: 768px) {
    .orcamento-shell-frame {
        min-height: 70vh;
    }
}
</style>

<div class="orcamento-shell">
    <div class="orcamento-shell-card">
        <div class="orcamento-shell-header">
            <div class="orcamento-shell-title">
                <h3>Modulo de Orcamentos 2.0</h3>
                <p>Interface integrada ao ERP principal com menu lateral e autenticacao unificada.</p>
            </div>
            <div class="orcamento-shell-tabs">
                <?php foreach ($allowed_pages as $key => $file): ?>
                    <?php
                    $labels = [
                        'dashboard' => 'Painel',
                        'novo' => 'Novo Orcamento',
                        'listar' => 'Listar',
                        'vendas' => 'Vendas',
                        'cadastros' => 'Cadastros',
                        'relatorios' => 'Relatorios'
                    ];
                    ?>
                    <a class="orcamento-shell-tab <?php echo $page_key === $key ? 'active' : ''; ?>"
                       href="<?php echo $key === 'novo' ? SITE_URL . '/modules/orcamento_2_0/criar_orcamento.php' : SITE_URL . '/modules/orcamentos/index.php?page=' . urlencode($key); ?>">
                        <?php echo $labels[$key]; ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <div class="orcamento-shell-frame-wrap">
        <iframe
            id="orcamentoLegacyFrame"
            class="orcamento-shell-frame"
            src="<?php echo htmlspecialchars($iframe_src, ENT_QUOTES, 'UTF-8'); ?>"
            title="Modulo de Orcamentos"
            loading="lazy"></iframe>
    </div>
</div>

<script>
function ajustarIframeOrcamento() {
    const frame = document.getElementById('orcamentoLegacyFrame');
    if (!frame) return;

    try {
        const doc = frame.contentDocument || frame.contentWindow.document;
        if (!doc) return;

        const styleId = 'erp-legacy-override';
        if (!doc.getElementById(styleId)) {
            const style = doc.createElement('style');
            style.id = styleId;
            style.textContent = `
                .menu, .sidebar, .navbar, .menu-links, .logo { display: none !important; }
                body { margin: 0 !important; background: #f5f7fa !important; }
                .main-content { margin-left: 0 !important; padding: 20px !important; }
                .container { max-width: none !important; padding: 20px !important; }
            `;
            doc.head.appendChild(style);
        }

        const frameBody = doc.body;
        const frameHtml = doc.documentElement;
        const height = Math.max(
            frameBody ? frameBody.scrollHeight : 0,
            frameHtml ? frameHtml.scrollHeight : 0
        );
        frame.style.height = Math.max(height + 24, 720) + 'px';
    } catch (error) {
        // same-origin expected; ignore if iframe not ready yet
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const frame = document.getElementById('orcamentoLegacyFrame');
    if (!frame) return;

    frame.addEventListener('load', function() {
        ajustarIframeOrcamento();

        try {
            const doc = frame.contentDocument || frame.contentWindow.document;
            if (!doc) return;

            doc.addEventListener('click', function() {
                window.setTimeout(ajustarIframeOrcamento, 250);
            });

            doc.addEventListener('submit', function() {
                window.setTimeout(ajustarIframeOrcamento, 400);
            });
        } catch (error) {
            // ignore
        }
    });
});
</script>

<?php include '../../includes/footer.php'; ?>
