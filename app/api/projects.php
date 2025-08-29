<?php
// app/api/projects.php
declare(strict_types=1);
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/session.php';

$pdo = db();
$m = method();
$isAdmin = !empty($_SESSION['is_admin']);

try {
  // ---------- PUBLIC/ADMIN: GET ----------
  if ($m === 'GET') {
    if (!empty($_GET['id'])) {
      $id = (int)$_GET['id'];
      $st = $pdo->prepare("SELECT * FROM projects WHERE id=?");
      $st->execute([$id]);
      $row = $st->fetch();
      json_out(['ok' => (bool)$row, 'data' => $row]);
    } else {
      $sql = "
        SELECT id, title, description, tags, github_url, image_path, is_published, created_at, updated_at
        FROM projects
        " . ($isAdmin ? "" : "WHERE is_published = 1") . "
        ORDER BY created_at DESC
      ";
      $st = $pdo->query($sql);
      json_out(['ok' => true, 'data' => $st->fetchAll()]);
    }
    exit;
  }

  // ---------- ADMIN: POST/PUT/DELETE ----------
  require_once __DIR__ . '/../middleware/require_admin.php';

  if ($m === 'POST') {
    $d = body();
    $title        = trim($d['title'] ?? '');
    $description  = trim($d['description'] ?? '');
    $tags         = trim($d['tags'] ?? '');
    $github_url   = trim($d['github_url'] ?? '');
    $image_path   = trim($d['image_path'] ?? '');
    $is_published = isset($d['is_published']) ? (int)!!$d['is_published'] : 1;

    if ($title === '' || $description === '') {
      json_out(['ok' => false, 'error' => 'Title and description are required'], 422);
    }

    $st = $pdo->prepare(
      "INSERT INTO projects (title, description, tags, github_url, image_path, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())"
    );
    $st->execute([$title, $description, $tags, $github_url, $image_path, $is_published]);
    json_out(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
  }

  if ($m === 'PUT') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);

    $title        = trim($d['title'] ?? '');
    $description  = trim($d['description'] ?? '');
    $tags         = trim($d['tags'] ?? '');
    $github_url   = trim($d['github_url'] ?? '');
    $image_path   = trim($d['image_path'] ?? '');
    $is_published = isset($d['is_published']) ? (int)!!$d['is_published'] : 1;

    $st = $pdo->prepare(
      "UPDATE projects
       SET title=?, description=?, tags=?, github_url=?, image_path=?, is_published=?, updated_at=NOW()
       WHERE id=?"
    );
    $st->execute([$title, $description, $tags, $github_url, $image_path, $is_published, $id]);
    json_out(['ok' => true]);
  }

  if ($m === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);
    $st = $pdo->prepare("DELETE FROM projects WHERE id=?");
    $st->execute([$id]);
    json_out(['ok' => true]);
  }

  json_out(['ok' => false, 'error' => 'Unsupported'], 405);
} catch (Throwable $e) {
  if (APP_ENV === 'dev') json_out(['ok' => false, 'error' => $e->getMessage()], 500);
  json_out(['ok' => false, 'error' => 'Server error'], 500);
}
