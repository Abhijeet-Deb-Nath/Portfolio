<?php
// app/api/posts.php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/session.php';


$pdo = db();
$m = method();

try {
  // --- PUBLIC: only published in list; detail by id allowed (editor needs it) ---
  if ($m === 'GET') {
    if (!empty($_GET['id'])) {
      $id = (int)$_GET['id'];
      $st = $pdo->prepare("SELECT * FROM posts WHERE id=?");
      $st->execute([$id]);
      $row = $st->fetch();
      json_out(['ok' => (bool)$row, 'data' => $row]);
    } else {
      $st = $pdo->query(
        "SELECT id, title, slug, body, cover_image, is_published, created_at, updated_at
         FROM posts
         WHERE is_published = 1
         ORDER BY created_at DESC"
      );
      json_out(['ok' => true, 'data' => $st->fetchAll()]);
    }
    exit;
  }

  // --- ADMIN: mutations ---
  require_once __DIR__ . '/../middleware/require_admin.php';

  if ($m === 'POST') {
    $d = body();
    $title = trim($d['title'] ?? '');
    $slug  = trim($d['slug'] ?? '');
    $body  = trim($d['body'] ?? '');
    $cover = trim($d['cover_image'] ?? '');
    $is_published = isset($d['is_published']) ? (int)!!$d['is_published'] : 1;

    if ($title === '' || $slug === '' || $body === '') {
      json_out(['ok' => false, 'error' => 'Title, slug and body are required'], 422);
    }

    $st = $pdo->prepare(
      "INSERT INTO posts (title, slug, body, cover_image, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())"
    );
    $st->execute([$title, $slug, $body, $cover, $is_published]);
    json_out(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
  }

  if ($m === 'PUT') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);

    $title = trim($d['title'] ?? '');
    $slug  = trim($d['slug'] ?? '');
    $body  = trim($d['body'] ?? '');
    $cover = trim($d['cover_image'] ?? '');
    $is_published = isset($d['is_published']) ? (int)!!$d['is_published'] : 1;

    $st = $pdo->prepare(
      "UPDATE posts
       SET title=?, slug=?, body=?, cover_image=?, is_published=?, updated_at=NOW()
       WHERE id=?"
    );
    $st->execute([$title, $slug, $body, $cover, $is_published, $id]);
    json_out(['ok' => true]);
  }

  if ($m === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);
    $st = $pdo->prepare("DELETE FROM posts WHERE id=?");
    $st->execute([$id]);
    json_out(['ok' => true]);
  }

  json_out(['ok' => false, 'error' => 'Unsupported'], 405);
} catch (Throwable $e) {
  if (APP_ENV === 'dev') json_out(['ok' => false, 'error' => $e->getMessage()], 500);
  json_out(['ok' => false, 'error' => 'Server error'], 500);
}
