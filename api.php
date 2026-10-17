<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$db = __DIR__ . DIRECTORY_SEPARATOR . 'database.json';

function responder(int $codigo, array $contenido): void {
    http_response_code($codigo);
    echo json_encode($contenido, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metodo === 'GET') {
    if (!is_file($db)) {
        echo '[]';
        exit;
    }
    $contenido = file_get_contents($db);
    if ($contenido === false || json_decode($contenido, true) === null && trim($contenido) !== 'null') {
        responder(500, ['status' => 'error', 'mensaje' => 'La base de datos no contiene JSON válido. No se modificó el archivo.']);
    }
    echo $contenido;
    exit;
}

if ($metodo !== 'POST') {
    header('Allow: GET, POST');
    responder(405, ['status' => 'error', 'mensaje' => 'Método no permitido.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || trim($raw) === '') {
    responder(400, ['status' => 'error', 'mensaje' => 'No se recibieron datos.']);
}

$datos = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($datos) || array_values($datos) !== $datos) {
    responder(400, ['status' => 'error', 'mensaje' => 'El contenido debe ser un arreglo JSON válido.']);
}

foreach ($datos as $registro) {
    if (!is_array($registro) || !array_key_exists('id', $registro) ||
        !isset($registro['nombre']) || !is_string($registro['nombre']) ||
        !isset($registro['categoria']) || !is_string($registro['categoria']) ||
        !array_key_exists('datos', $registro) || !is_array($registro['datos'])) {
        responder(400, ['status' => 'error', 'mensaje' => 'Hay un registro con una estructura inválida.']);
    }
}

$codificado = json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($codificado === false) {
    responder(400, ['status' => 'error', 'mensaje' => 'No se pudieron codificar los datos.']);
}

$tmp = $db . '.tmp';
$bytes = file_put_contents($tmp, $codificado, LOCK_EX);
if ($bytes === false || !rename($tmp, $db)) {
    if (is_file($tmp)) @unlink($tmp);
    responder(500, ['status' => 'error', 'mensaje' => 'No se pudo guardar la base de datos. Revisa permisos del servidor.']);
}

echo json_encode(['status' => 'ok', 'mensaje' => 'Base de datos guardada', 'registros' => count($datos)], JSON_UNESCAPED_UNICODE);
