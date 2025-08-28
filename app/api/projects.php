<?php
// app/api/projects.php
require_once __DIR__ . '/../middleware/require_admin.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/http.php';

// Routes:
// GET    /app/api/projects.php            -> list
// GET    /app/api/projects.php?id=123     -> get one
// POST   /app/api/projects.php            -> create (JSON or form)
// PUT    /app/api/projects.php            -> update (JSON with id)
// DELETE /app/api/projects.php?id=123     -> delete

$pdo = db();
$m = method();

try {
  if ($m === 'GET') {
    if (!empty($_GET['id'])) {
      $id = (int)$_GET['id'];
      $st = $pdo->prepare("SELECT * FROM projects WHERE id=?");
      $st->execute([$id]);
      $row = $st->fetch();
      json_out(['ok' => (bool)$row, 'data' => $row]);
    } else {
      $st = $pdo->query("SELECT * FROM projects ORDER BY created_at DESC");
      $rows = $st->fetchAll();
      json_out(['ok' => true, 'data' => $rows]);
    }
  }

  if ($m === 'POST') {
    $d = body();
    $title = trim($d['title'] ?? '');
    $description = trim($d['description'] ?? '');
    $tags = trim($d['tags'] ?? '');
    $github_url = trim($d['github_url'] ?? '');
    $image_path = trim($d['image_path'] ?? '');

    if ($title === '' || $description === '') {
      json_out(['ok' => false, 'error' => 'Title and description are required'], 422);
    }

    $st = $pdo->prepare("INSERT INTO projects (title, description, tags, github_url, image_path, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
    $st->execute([$title, $description, $tags, $github_url, $image_path]);
    json_out(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
  }

  if ($m === 'PUT') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);

    $title = trim($d['title'] ?? '');
    $description = trim($d['description'] ?? '');
    $tags = trim($d['tags'] ?? '');
    $github_url = trim($d['github_url'] ?? '');
    $image_path = trim($d['image_path'] ?? '');

    $st = $pdo->prepare("UPDATE projects SET title=?, description=?, tags=?, github_url=?, image_path=?, updated_at=NOW() WHERE id=?");
    $st->execute([$title, $description, $tags, $github_url, $image_path, $id]);
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
