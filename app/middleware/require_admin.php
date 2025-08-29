<?php
// app/middleware/require_admin.php
require_once __DIR__ . '/../lib/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  if (!verify_csrf_from_header()) {
    json_out(['ok' => false, 'error' => 'Invalid CSRF'], 419);
  }
}
require_admin_session();
