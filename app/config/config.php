<?php
// app/config/config.php

// ---- Database ----
// XAMPP default: user 'root' with empty password. Change if you created a dedicated user.
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'portfolio_db');
define('DB_USER', 'root');            // e.g. 'portfolio_user'
define('DB_PASS', '');                // e.g. 'strong-password'
define('DB_CHARSET', 'utf8mb4');

// ---- App ----
define('APP_ENV', 'dev');             // 'dev' or 'prod'
define('APP_BASE_PATH', dirname(__DIR__, 1)); // /app
define('PUBLIC_BASE_URL', '/portfolio/public'); // adjust if your folder name differs

// ---- Sessions / Cookies ----
define('SESSION_NAME', 'pf_admin');
define('CSRF_TOKEN_KEY', 'csrf_token');

// HTTPS note: set 'secure' => true once you serve over HTTPS.
$cookieParams = [
  'lifetime' => 0,
  'path'     => '/',
  'domain'   => '',
  'secure'   => false,   // change to true on HTTPS
  'httponly' => true,
  'samesite' => 'Lax'
];
