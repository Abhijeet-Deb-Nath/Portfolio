<?php
// app/api/achievements.php
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
      $st = $pdo->prepare("SELECT * FROM achievements WHERE id=?");
      $st->execute([$id]);
      json_out(['ok' => true, 'data' => $st->fetch()]);
    } else {
      $sql = "
        SELECT id, title, issued_at, image_path, description, is_published, created_at, updated_at
        FROM achievements
        " . ($isAdmin ? "" : "WHERE is_published = 1") . "
        ORDER BY issued_at DESC, created_at DESC
      ";
      $st = $pdo->query($sql);
      json_out(['ok' => true, 'data' => $st->fetchAll()]);
    }
    exit;
  }

  // ---------- ADMIN: POST/PUT/DELETE ----------
  require_once __DIR__ . '/../middleware/require_admin.php';

  /*
  if ($m === 'POST') {
    $d = body();
    $title        = trim($d['title'] ?? '');
    $issued_at    = trim($d['issued_at'] ?? '');
    $image_path   = trim($d['image_path'] ?? '');
    $description  = trim($d['description'] ?? '');
    $is_published = isset($d['is_published']) ? (int)!!$d['is_published'] : 1;

    if ($title === '') json_out(['ok' => false, 'error' => 'Title required'], 422);

    $st = $pdo->prepare(
      "INSERT INTO achievements (title, issued_at, image_path, description, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())"
    );
    $st->execute([$title, $issued_at ?: null, $image_path ?: null, $description ?: null, $is_published]);
    json_out(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
  }
    */
  if ($m === 'POST') {
  $d = body();
  $title        = trim($d['title'] ?? '');
  $issued_at    = trim($d['issued_at'] ?? '');
  // normalize YYYY-MM -> YYYY-MM-01 for DATE columns
  if ($issued_at !== '' && preg_match('/^\d{4}-\d{2}$/', $issued_at)) {
    $issued_at .= '-01';
  }
  $image_path   = trim($d['image_path'] ?? '');
  $description  = trim($d['description'] ?? '');
  $is_published = isset($d['is_published']) ? (int)!!$d['is_published'] : 1;

  if ($title === '') json_out(['ok' => false, 'error' => 'Title required'], 422);

  $st = $pdo->prepare(
    "INSERT INTO achievements (title, issued_at, image_path, description, is_published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())"
  );
  $st->execute([$title, $issued_at ?: null, $image_path ?: null, $description ?: null, $is_published]);
  json_out(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
}

/*

  if ($m === 'PUT') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);

    $title        = trim($d['title'] ?? '');
    $issued_at    = trim($d['issued_at'] ?? '');
    $image_path   = trim($d['image_path'] ?? '');
    $description  = trim($d['description'] ?? '');
    $is_published = isset($d['is_published']) ? (int)!!$d['is_published'] : 1;

    $st = $pdo->prepare(
      "UPDATE achievements
       SET title=?, issued_at=?, image_path=?, description=?, is_published=?, updated_at=NOW()
       WHERE id=?"
    );
    $st->execute([$title, $issued_at ?: null, $image_path ?: null, $description ?: null, $is_published, $id]);
    json_out(['ok' => true]);
  }
    */
  if ($m === 'PUT') {
  $d = body();
  $id = (int)($d['id'] ?? 0);
  if ($id <= 0) json_out(['ok' => false, 'error' => 'Missing id'], 422);

  $title        = trim($d['title'] ?? '');
  $issued_at    = trim($d['issued_at'] ?? '');
  if ($issued_at !== '' && preg_match('/^\d{4}-\d{2}$/', $issued_at)) {
    $issued_at .= '-01';
  }
  $image_path   = trim($d['image_path'] ?? '');
  $description  = trim($d['description'] ?? '');
  $is_published = isset($d['is_published']) ? (int)!!$d['is_published'] : 1;

  $st = $pdo->prepare(
    "UPDATE achievements
     SET title=?, issued_at=?, image_path=?, description=?, is_published=?, updated_at=NOW()
     WHERE id=?"
  );
  $st->execute([$title, $issued_at ?: null, $image_path ?: null, $description ?: null, $is_published, $id]);
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
