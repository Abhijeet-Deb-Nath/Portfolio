<?php
// app/auth/me.php
require_once __DIR__ . '/../lib/session.php';
start_secure_session();
$isAdmin = !empty($_SESSION['admin']['id']);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true, 'is_admin' => $isAdmin]);
