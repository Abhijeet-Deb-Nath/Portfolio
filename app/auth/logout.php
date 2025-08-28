<?php
// app/auth/logout.php
require_once __DIR__ . '/../lib/session.php';

start_secure_session();
$_SESSION = [];
if (ini_get("session.use_cookies")) {
  $params = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true, 'redirect' => PUBLIC_BASE_URL . '/login.html']);
