<?php
// app/api/achievements.php
require_once __DIR__ . '/../middleware/require_admin.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/http.php';

$pdo = db();
$m = method();

try {
  if ($m === 'GET') {
    if (!empty($_GET['id'])) {
      $id = (int)$_GET['id'];
      $st = $pdo->prepare("SELECT * FROM achievements WHERE id=?");
      $st->execute([$id]);
      json_out(['ok' => true, 'data' => $st->fetch()]);
    } else {
      $st = $pdo->query("SELECT * FROM achievements ORDER BY issued_at DESC, created_at DESC");
      json_out(['ok' => true, 'data' => $st->fetchAll()]);
    }
  }

  if ($m === 'POST') {
    $d = body();
    $title = trim($d['title'] ?? '');
    $issuer = trim($d['issuer'] ?? '');
    $issued_at = trim($d['issued_at'] ?? '');
    $image_path = trim($d['image_path'] ?? '');
    $description = trim($d['description'] ?? '');

    if ($title === '') json_out(['ok' => false, 'error' => 'Title required'], 422);

    $st = $pdo->prepare("INSERT INTO achievements (title, issuer, issued_at, image_path, description, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
    $st->execute([$title, $issuer, $issued_at ?: null, $image_path ?: null, $description ?: null]);
    json_out(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
  }

  if ($m === 'PUT') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);

    $title = trim($d['title'] ?? '');
    $issuer = trim($d['issuer'] ?? '');
    $issued_at = trim($d['issued_at'] ?? '');
    $image_path = trim($d['image_path'] ?? '');
    $description = trim($d['description'] ?? '');

    $st = $pdo->prepare("UPDATE achievements SET title=?, issuer=?, issued_at=?, image_path=?, description=?, updated_at=NOW() WHERE id=?");
    $st->execute([$title, $issuer, $issued_at ?: null, $image_path ?: null, $description ?: null, $id]);
    json_out(['ok' => true]);
  }

  if ($m === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);

    $st = $pdo->prepare("DELETE FROM achievements WHERE id=?");
    $st->execute([$id]);
    json_out(['ok' => true]);
  }

  json_out(['ok' => false, 'error' => 'Unsupported'], 405);
} catch (Throwable $e) {
  if (APP_ENV === 'dev') json_out(['ok' => false, 'error' => $e->getMessage()], 500);
  json_out(['ok' => false, 'error' => 'Server error'], 500);
}
