<?php
// app/lib/db.php
require_once __DIR__ . '/../config/config.php';

function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;

  $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
  $opt = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
  ];
  $pdo = new PDO($dsn, DB_USER, DB_PASS, $opt);
  return $pdo;
}
