<?php
// app/lib/session.php
require_once __DIR__ . '/../config/config.php';

function start_secure_session(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;

  session_name(SESSION_NAME);
  // Use config cookie params
  $params = [
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '',
    'secure'   => false,   // set true on HTTPS
    'httponly' => true,
    'samesite' => 'Lax',
  ];
  session_set_cookie_params($params);
  session_start();
}

function ensure_csrf_token(): string {
  start_secure_session();
  if (empty($_SESSION[CSRF_TOKEN_KEY])) {
    $_SESSION[CSRF_TOKEN_KEY] = bin2hex(random_bytes(32));
  }
  return $_SESSION[CSRF_TOKEN_KEY];
}

function verify_csrf_from_header(): bool {
  start_secure_session();
  $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  return is_string($sent) && hash_equals($_SESSION[CSRF_TOKEN_KEY] ?? '', $sent);
}

function require_admin_session(): void {
  start_secure_session();
  if (empty($_SESSION['admin']) || empty($_SESSION['admin']['id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
    exit;
  }
}

function json_out(array $payload, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload);
  exit;
}

function read_json_body(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}
