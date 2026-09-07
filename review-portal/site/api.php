<?php
declare(strict_types=1);
// All private reads use POST so the main application's offline cache ignores them.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('X-Robots-Tag: noindex, nofollow');
ini_set('display_errors', '0');
const GUARD = "<?php http_response_code(404); exit; ?>\n";
const COOKIE = 'chmurnik_review_session';
const TTL = 604800;
const GENERA = ['Ci','Cc','Cs','Ac','As','Ns','Sc','St','Cu','Cb'];
const LEVELS = ['', 'low', 'middle', 'high', 'multiple', 'uncertain', 'not_applicable'];
const CONTEXT_LIMITS = ['horizon', 'wide_frame', 'detail', 'light', 'reference'];

final class PortalError extends RuntimeException {
    public int $httpStatus;
    public function __construct(string $message, int $status = 400) {
        parent::__construct($message); $this->httpStatus = $status;
    }
}
function reject(string $message, int $status = 400): void { throw new PortalError($message, $status); }
function result(array $body, int $status = 200): never {
    http_response_code($status); echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit;
}
function secretHash(string $password, array $account): string {
    return hash_pbkdf2('sha256', $password, hex2bin($account['salt']), 600000, 64);
}
function saveDatabase(string $path, array $database): void {
    $bytes = GUARD . json_encode($database, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $temp = $path . '.' . bin2hex(random_bytes(8)) . '.php';
    $handle = fopen($temp, 'xb');
    if (!$handle) reject('Nie można zapisać odpowiedzi. Spróbuj ponownie.', 503);
    chmod($temp, 0600);
    try {
        $offset = 0;
        while ($offset < strlen($bytes)) {
            $count = fwrite($handle, substr($bytes, $offset));
            if ($count === false || $count === 0) reject('Zapis nie powiódł się. Nie zamykaj tej strony.', 503);
            $offset += $count;
        }
        fflush($handle); if (function_exists('fsync')) fsync($handle);
    } finally { fclose($handle); }
    if (!rename($temp, $path)) { @unlink($temp); reject('Zapis nie powiódł się.', 503); }
}
function withDatabase(array $config, callable $work): array {
    $dir = __DIR__ . '/_private';
    $lockPath = $dir . '/lock.php';
    if (!is_file($lockPath)) file_put_contents($lockPath, GUARD, LOCK_EX);
    $lock = fopen($lockPath, 'r+');
    if (!$lock || !flock($lock, LOCK_EX)) reject('Panel jest chwilowo zajęty. Spróbuj ponownie.', 503);
    try {
        $path = $dir . '/storage.php';
        if (is_file($path)) {
            $raw = file_get_contents($path);
            if (!str_starts_with($raw, GUARD)) reject('Magazyn danych wymaga sprawdzenia.', 503);
            $db = json_decode(substr($raw, strlen(GUARD)), true, 512, JSON_THROW_ON_ERROR);
        } else {
            $db = ['schema'=>1,'sessions'=>[],'limits'=>[],'reviews'=>[],'submissions'=>[]];
        }
        $now = time();
        foreach ($db['sessions'] as $key=>$session) if ($session['expires'] <= $now) unset($db['sessions'][$key]);
        foreach ($db['limits'] as $key=>$limit) if ($limit['until'] <= $now) unset($db['limits'][$key]);
        $response = $work($db);
        saveDatabase($path, $db);
        return $response;
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
function identity(array $db, array $config): array {
    $token = $_COOKIE[COOKIE] ?? '';
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) reject('Zaloguj się, aby kontynuować.', 401);
    $session = $db['sessions'][hash('sha256', $token)] ?? null;
    if (!$session || $session['expires'] <= time() || !isset($config['accounts'][$session['user']])) reject('Sesja wygasła. Zaloguj się ponownie.', 401);
    return $session;
}
function csrf(array $input, array $session): void {
    if (!isset($input['csrf']) || !is_string($input['csrf']) || !hash_equals($session['csrf'], $input['csrf'])) reject('Odśwież stronę i spróbuj ponownie.', 403);
}
function textField(array $input, string $key, int $max): string {
    $value = $input[$key] ?? '';
    if (!is_string($value) || strlen($value) > $max) reject('Pole „' . $key . '” jest zbyt długie lub nieprawidłowe.');
    return trim($value);
}
function genusList(array $input, string $key): array {
    $values = $input[$key] ?? [];
    if (!is_array($values) || count($values)>10 || count(array_unique($values, SORT_REGULAR))!==count($values)) reject('Sprawdź zaznaczone rodzaje chmur.');
    foreach ($values as $v) if (!is_string($v) || !in_array($v, GENERA, true)) reject('Nieprawidłowy rodzaj chmury.');
    return array_values($values);
}
function complete(array $answer): bool {
    $status = $answer['status'] ?? '';
    $n = count($answer['genera'] ?? []);
    if ($status==='single') return $n===1;
    if ($status==='mixed') return $n>=2;
    return in_array($status, ['uncertain','clear','unusable'], true) && $n===0;
}
function answersFor(array $db, string $user): array { return $db['reviews'][$user] ?? []; }
function sessionResponse(array $db, array $config, array $session): array {
    $user = $session['user']; $account = $config['accounts'][$user];
    $answers = answersFor($db, $user);
    return ['ok'=>true,'user'=>['login'=>$user,'name'=>$account['name'],'role'=>$account['role']],
        'csrf'=>$session['csrf'],'answers'=>(object)$answers,'submission'=>$db['submissions'][$user] ?? null,
        'count'=>count(array_filter($answers, 'complete')),'total'=>33];
}
function newSession(array &$db, string $user, bool $secure): array {
    $token = bin2hex(random_bytes(32));
    $session = ['user'=>$user,'csrf'=>bin2hex(random_bytes(24)),'expires'=>time()+TTL];
    $db['sessions'][hash('sha256', $token)] = $session;
    setcookie(COOKIE, $token, ['expires'=>time()+TTL,'path'=>'/ocena/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);
    return $session;
}

try {
    if (PHP_VERSION_ID < 80100) reject('Panel wymaga PHP 8.1 lub nowszego.', 503);
    $configPath = __DIR__ . '/_private/config.php';
    if (!is_file($configPath)) reject('Panel nie jest jeszcze skonfigurowany.', 503);
    $config = require $configPath;
    $isQa = ($config['allowLocalQa'] ?? false) === true;
    $secure = !$isQa;
    if (!$isQa && !in_array($_SERVER['HTTPS'] ?? '', ['on','1'], true)) reject('Otwórz panel przez bezpieczny adres HTTPS.', 403);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && ($_GET['action'] ?? '') === 'health') {
        result(['ok'=>true,'service'=>'chmurnik-review','version'=>2,'configured'=>true]);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reject('Ta operacja wymaga zalogowanego panelu.', 405);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = $origin === 'https://chmurnik.cloud' || ($isQa && preg_match('~^http://(?:127\.0\.0\.1|localhost):[0-9]+$~D', $origin));
    if (!$allowed || ($_SERVER['HTTP_X_PORTAL_REQUEST'] ?? '') !== '1') reject('Niedozwolone źródło żądania.', 403);
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) reject('Nieprawidłowy format żądania.', 415);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16000) reject('Żądanie jest zbyt duże.', 413);
    $raw = file_get_contents('php://input', false, null, 0, 16001);
    if (strlen($raw)>16000) reject('Żądanie jest zbyt duże.', 413);
    $input = json_decode($raw, true);
    if (!is_array($input)) reject('Nieprawidłowe dane.');
    $action = $input['action'] ?? '';
    $response = withDatabase($config, function(array &$db) use ($config,$input,$action,$secure): array {
        if ($action === 'login') {
            $user = strtolower(textField($input, 'login', 60));
            $password = textField($input, 'password', 200);
            $ipKey = 'ip:'.hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $config['rateSecret']);
            $userKey = 'user:'.(isset($config['accounts'][$user]) ? $user : 'unknown');
            foreach ([$ipKey,$userKey] as $key) if (($db['limits'][$key]['count'] ?? 0)>=10) return ['error'=>'Za dużo prób. Spróbuj ponownie za 15 minut.','httpStatus'=>429];
            $account = $config['accounts'][$user] ?? reset($config['accounts']);
            $valid = hash_equals($account['hash'], secretHash($password, $account)) && isset($config['accounts'][$user]);
            if (!$valid) {
                foreach ([$ipKey,$userKey] as $key) {
                    $db['limits'][$key] = ['count'=>($db['limits'][$key]['count'] ?? 0)+1,'until'=>$db['limits'][$key]['until'] ?? time()+900];
                }
                return ['error'=>'Nieprawidłowy login lub hasło.','httpStatus'=>401];
            }
            unset($db['limits'][$userKey]);
            $session = newSession($db, $user, $secure);
            return sessionResponse($db, $config, $session);
        }
        $session = identity($db, $config); $user = $session['user'];
        $admin = $config['accounts'][$user]['role'] === 'coordinator';
        if ($action === 'session') return sessionResponse($db, $config, $session);
        csrf($input, $session);
        if ($action === 'logout') {
            unset($db['sessions'][hash('sha256', $_COOKIE[COOKIE])]);
            setcookie(COOKIE, '', ['expires'=>1,'path'=>'/ocena/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);
            return ['ok'=>true];
        }
        if ($action === 'photo') {
            $id = textField($input, 'id', 4);
            if (!preg_match('/^R0(?:0[1-9]|[12][0-9]|3[0-3])$/D', $id)) reject('Nie ma takiego zdjęcia.', 404);
            $materials = require __DIR__.'/_private/materials.php';
            return ['image'=>$materials['photos'][$id]];
        }
        if ($action === 'save') {
            if ($admin) reject('Konto koordynatora nie wypełnia niezależnej oceny.', 403);
            if (isset($db['submissions'][$user])) reject('Ocena została zamknięta przed otwarciem raportu.', 409);
            $id = textField($input, 'id', 4);
            if (!preg_match('/^R0(?:0[1-9]|[12][0-9]|3[0-3])$/D', $id)) reject('Nie ma takiego zdjęcia.', 404);
            $previous = $db['reviews'][$user][$id] ?? ['revision'=>0];
            if (!is_int($input['revision'] ?? null) || $input['revision'] !== $previous['revision']) reject('Ta odpowiedź zmieniła się w innym oknie. Odśwież stronę.', 409);
            $answer = $input['answer'] ?? null;
            if (!is_array($answer)) reject('Brakuje odpowiedzi.');
            $status = textField($answer, 'status', 12);
            if (!in_array($status, ['', 'single','mixed','uncertain','clear','unusable'], true)) reject('Wybierz sposób oceny.');
            $genera = genusList($answer, 'genera'); $alternatives = genusList($answer, 'alternatives');
            if (in_array($status,['clear','unusable'],true) && ($genera || $alternatives)) reject('Dla tego wyboru nie zaznaczaj rodzajów.');
            if ($status==='uncertain' && $genera) reject('Możliwe rodzaje wpisz jako alternatywy, nie jako obecne.');
            $quality = textField($answer,'quality',20);
            if (!in_array($quality,['','dobra','ograniczona','nieprzydatna'],true)) reject('Sprawdź jakość zdjęcia.');
            // Preserve optional v2 fields when a still-open v1 client saves an answer.
            $contextInput = array_replace(array_intersect_key($previous, array_flip(['level', 'contextLimits'])), $answer);
            $level = textField($contextInput, 'level', 20);
            if (!in_array($level, LEVELS, true)) reject('Sprawdź ocenę piętra.');
            $contextLimits = $contextInput['contextLimits'] ?? [];
            if (!is_array($contextLimits) || count($contextLimits)>count(CONTEXT_LIMITS)) reject('Sprawdź ograniczenia kadru.');
            foreach ($contextLimits as $limit) if (!is_string($limit) || !in_array($limit, CONTEXT_LIMITS, true)) reject('Nieprawidłowe ograniczenie kadru.');
            if (count(array_unique($contextLimits))!==count($contextLimits)) reject('Powtórzone ograniczenie kadru.');
            $saved = ['status'=>$status,'genera'=>$genera,'alternatives'=>$alternatives,'quality'=>$quality,
                'level'=>$level,'contextLimits'=>array_values($contextLimits),
                'features'=>textField($answer,'features',2000),'limitations'=>textField($answer,'limitations',2000),
                'notes'=>textField($answer,'notes',3000),'revision'=>$previous['revision']+1,'updatedAt'=>gmdate('c')];
            $db['reviews'][$user][$id] = $saved;
            return ['ok'=>true,'id'=>$id,'answer'=>$saved,'complete'=>complete($saved),
                'count'=>count(array_filter(answersFor($db,$user),'complete'))];
        }
        if ($action === 'submit') {
            if ($admin) reject('Koordynator nie składa oceny.', 403);
            if (!isset($db['submissions'][$user])) {
                $answers = answersFor($db,$user); $count = count(array_filter($answers,'complete'));
                if ($count===0) reject('Zapisz przynajmniej jedną pełną ocenę zdjęcia.');
                if (($input['confirm'] ?? false)!==true) reject('Potwierdź zamknięcie oceny.');
                $db['submissions'][$user] = ['submittedAt'=>gmdate('c'),'count'=>$count,'total'=>33,'answers'=>(object)$answers];
            }
            return ['ok'=>true,'submission'=>$db['submissions'][$user]];
        }
        if ($action === 'report') {
            if (!$admin && !isset($db['submissions'][$user])) reject('Najpierw zapisz i zamknij własną ocenę.', 403);
            $materials = require __DIR__.'/_private/materials.php';
            return ['ok'=>true,'report'=>$materials['report'],'sourceLabels'=>$materials['sourceLabels'],'pilot'=>$materials['pilot']];
        }
        if ($action === 'overview') {
            if (!$admin) reject('Ta część jest dostępna tylko koordynatorowi.', 403);
            $reviewers = [];
            foreach ($config['accounts'] as $login=>$account) {
                if ($account['role']!=='reviewer') continue;
                $answers = answersFor($db,$login);
                $reviewers[] = ['login'=>$login,'name'=>$account['name'],'count'=>count(array_filter($answers,'complete')),
                    'answers'=>(object)$answers,'submission'=>$db['submissions'][$login] ?? null];
            }
            return ['ok'=>true,'reviewers'=>$reviewers,'total'=>33];
        }
        if ($action === 'export') {
            if ($admin) return ['ok'=>true,'data'=>['schema'=>1,'exportedAt'=>gmdate('c'),'reviews'=>(object)$db['reviews'],'submissions'=>(object)$db['submissions']]];
            return ['ok'=>true,'data'=>['schema'=>1,'login'=>$user,'exportedAt'=>gmdate('c'),'answers'=>(object)answersFor($db,$user),'submission'=>$db['submissions'][$user] ?? null]];
        }
        reject('Nieznana operacja.', 404);
    });
    if (isset($response['image'])) { header('Content-Type: image/jpeg'); echo base64_decode($response['image'], true); exit; }
    $status = $response['httpStatus'] ?? 200; unset($response['httpStatus']); result($response, $status);
} catch (PortalError $e) { result(['error'=>$e->getMessage()], $e->httpStatus); }
catch (Throwable $e) { error_log('CHMURNIK review: '.get_class($e)); result(['error'=>'Panel nie może teraz zapisać danych. Spróbuj ponownie; nie zamykaj niezapisanej odpowiedzi.'], 503); }
