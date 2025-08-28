<?php
// app/lib/http.php
require_once __DIR__ . '/session.php';

function method(): string {
  if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['_method'])) {
    return strtoupper($_POST['_method']);
  }
  return $_SERVER['REQUEST_METHOD'];
}

function body(): array {
  // Prefer JSON; fall back to POST form fields
  $json = read_json_body();
  if (!empty($json)) return $json;
  return $_POST ?? [];
}
