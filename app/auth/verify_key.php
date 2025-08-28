<?php
// app/auth/verify_key.php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/session.php';

header('Content-Type: application/json; charset=utf-8');

$key = $_POST['key'] ?? $_POST['adminKey'] ?? '';
$key = is_string($key) ? trim($key) : '';

if ($key === '') {
  json_out(['ok' => false, 'error' => 'Key required'], 400);
}

try {
  $pdo = db();
  // Minimal table: admin_keys(id, key_hash). We’ll scan all rows (tiny table).
  $stmt = $pdo->query("SELECT id, key_hash FROM admin_keys");
  $rows = $stmt->fetchAll();

  $validId = null;
  foreach ($rows as $r) {
    $hash = (string)$r['key_hash'];
    // If stored value looks like a password hash -> verify with password_verify
    if (preg_match('~^\$2y\$|\$argon2~', $hash)) {
      if (password_verify($key, $hash)) { $validId = (int)$r['id']; break; }
    } else {
      // Plain text fallback (dev convenience)
      if (hash_equals($hash, $key)) { $validId = (int)$r['id']; break; }
    }
  }

  if ($validId === null) {
    json_out(['ok' => false, 'error' => 'Invalid key'], 401);
  }

  // Success: start session, regen ID, set CSRF
  start_secure_session();
  session_regenerate_id(true);
  $_SESSION['admin'] = ['id' => $validId, 'role' => 'admin', 'at' => time()];
  $csrf = ensure_csrf_token();

  json_out([
    'ok' => true,
    'csrf' => $csrf,
    'redirect' => PUBLIC_BASE_URL . '/manhattan.html'
  ]);
} catch (Throwable $e) {
  if (APP_ENV === 'dev') { json_out(['ok' => false, 'error' => $e->getMessage()], 500); }
  json_out(['ok' => false, 'error' => 'Server error'], 500);
}
