<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

function responder_backup(int $codigo, array $contenido): void {
    http_response_code($codigo);
    echo json_encode($contenido, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder_backup(405, ['status' => 'error', 'mensaje' => 'Método no permitido.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || trim($raw) === '') {
    responder_backup(400, ['status' => 'error', 'mensaje' => 'Sin datos para respaldar.']);
}

json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    responder_backup(400, ['status' => 'error', 'mensaje' => 'El respaldo no contiene JSON válido.']);
}

$destino = __DIR__ . DIRECTORY_SEPARATOR . 'backup_auto.json';
$tmp = $destino . '.tmp';
if (file_put_contents($tmp, $raw, LOCK_EX) === false || !rename($tmp, $destino)) {
    if (is_file($tmp)) @unlink($tmp);
    responder_backup(500, ['status' => 'error', 'mensaje' => 'No se pudo guardar el respaldo.']);
}

echo json_encode(['status' => 'ok', 'mensaje' => 'Respaldo guardado en el servidor'], JSON_UNESCAPED_UNICODE);
