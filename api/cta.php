<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

/**
 * Загружает переменные окружения из .env (или env) один раз за запрос.
 */
function getEnvValue(string $key): ?string
{
    $direct = getenv($key);
    if ($direct !== false) {
        return $direct;
    }

    static $envCache = null;
    if ($envCache === null) {
        $envCache = [];
        $paths = [__DIR__ . '/../.env', __DIR__ . '/../env'];
        foreach ($paths as $path) {
            if (!is_readable($path)) {
                continue;
            }
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (!$lines) {
                continue;
            }
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                    continue;
                }
                [$envKey, $envValue] = array_pad(explode('=', $trimmed, 2), 2, '');
                $envKey = trim($envKey);
                if ($envKey === '') {
                    continue;
                }
                $value = trim($envValue);
                $value = trim($value, "'\"");
                $envCache[$envKey] = $value;
            }
        }

        if (isset($envCache['VITE_API_BASE_URL']) && !isset($envCache['API_BASE_URL'])) {
            $envCache['API_BASE_URL'] = $envCache['VITE_API_BASE_URL'];
        }
        if (isset($envCache['VITE_LO_TOKEN']) && !isset($envCache['LO_TOKEN'])) {
            $envCache['LO_TOKEN'] = $envCache['VITE_LO_TOKEN'];
        }
    }

    return $envCache[$key] ?? null;
}

function json_response(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$rawBody = file_get_contents('php://input');
$requestData = json_decode($rawBody, true);

if (!is_array($requestData)) {
    json_response(400, ['success' => false, 'message' => 'Некорректный формат данных']);
}

$name = trim((string)($requestData['name'] ?? ''));
$phone = preg_replace('/\D+/', '', (string)($requestData['phone'] ?? ''));
$consent = filter_var($requestData['consent'] ?? false, FILTER_VALIDATE_BOOLEAN);
$form = $requestData['form'] ?? 'cta';
$source = $requestData['source'] ?? '';

if ($name === '' || strlen($phone) < 11 || !$consent) {
    json_response(422, ['success' => false, 'message' => 'Заполните все поля корректно']);
}

$apiUrl = getEnvValue('API_BASE_URL');
$token = getEnvValue('LO_TOKEN');

if (!$apiUrl || !$token) {
    json_response(500, ['success' => false, 'message' => 'Сервис временно недоступен']);
}

$payload = [
    'name' => $name,
    'phone' => $phone,
];

$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-LO-Token: ' . $token,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_TIMEOUT => 10,
]);

$responseBody = curl_exec($ch);
$curlError = curl_error($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: 0;
curl_close($ch);

if ($curlError) {
    error_log('[cta.php] CURL error: ' . $curlError);
    json_response(502, ['success' => false, 'message' => 'Ошибка соединения с 1С']);
}

if ($statusCode < 200 || $statusCode >= 300) {
    error_log(sprintf('[cta.php] 1C response (%d): %s', $statusCode, $responseBody));
    json_response(502, ['success' => false, 'message' => '1С вернула ошибку', 'details' => $responseBody]);
}

json_response(200, ['success' => true, 'message' => 'Заявка отправлена']);
