"""Build private CyberFolks delivery without putting credentials or data in Git."""
import argparse
import base64
import csv
import hashlib
import json
from pathlib import Path
import secrets
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
HERE = ROOT / 'review-portal'
PRIVATE = ROOT / '.local/review-portal'
WORDS = 'atlas zorza wiatr fala niebo oblok deszcz rosa burza szron lampa okno woda pole las gory dolina szlak brzeg port zagiel ster kompas mapa zefir blask cien promien swiatlo granit piasek kamien szklo perla bursztyn ametyst opal rubin fiord zatoka wydma laka lipiec maj jesien wiosna lato zima ranek wieczor swit zmierzch polnoc poludnie wschod zachod punkt linia kolo luk most tunel droga tor'.split()
PHP_START = "<?php\nif (basename($_SERVER['SCRIPT_FILENAME'] ?? '') !== 'api.php') { http_response_code(404); exit; }\nreturn json_decode(base64_decode('"
PHP_END = "'), true, 512, JSON_THROW_ON_ERROR);\n"

def php_data(data):
    encoded = base64.b64encode(json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode()).decode()
    return PHP_START + encoded + PHP_END

def load_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle, delimiter=';'))

def build_update():
    """Ship code only: never replace deployed accounts, materials or responses."""
    target = ROOT / 'build/review-portal-update'
    target.mkdir(parents=True, exist_ok=True)
    archive = target / 'CHMURNIK-PANEL-AKTUALIZACJA-20260907.zip'
    instructions = '''AKTUALIZACJA PANELU OCENY CHMUR - 7 WRZEŚNIA 2026

Paczka aktualizuje istniejący panel, nie jest pełnym instalatorem.
1. Zrób prywatną kopię katalogu ocena, poza publicznym katalogiem strony.
2. Rozpakuj ZIP w katalogu głównym chmurnik.cloud, obok obecnego index.html.
   Potwierdź zastąpienie plików w ocena. Nie usuwaj całego katalogu ocena.
3. NIE zmieniaj ani nie usuwaj ocena/_private. Są tam konta, zdjęcia i oceny.
   Ta paczka celowo nie zawiera żadnych plików tego katalogu.
4. Otwórz https://chmurnik.cloud/ocena/ i odśwież stronę.
   Loginy i hasła pozostają te same. Nowa sekcja to „Piętro i kontekst zdjęcia”.
5. Pod https://chmurnik.cloud/ocena/api.php?action=health wersja powinna wynosić 2.

Co się zmienia: niezależna, opcjonalna ocena piętra i ograniczeń kadru,
zapisywana razem z odpowiedzią i widoczna w panelu koordynatora oraz eksporcie.
Brak dawnej oceny piętra nie zostanie zamieniony na „nie można ocenić”.
Zamknięte oceny pozostają zamknięte. Zdjęcia R001-R033 pozostają bez zmian.
Nowa seria szerszych fotografii nie jest częścią tej aktualizacji.
'''
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr('AKTUALIZACJA.txt', instructions)
        for name in ['api.php', 'index.html', 'portal.js', 'portal.css', '.htaccess']:
            z.write(HERE / 'site' / name, 'ocena/' + name)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == 6
        assert not any('_private' in name for name in z.namelist())
    print(f'Code-only update ready: {archive}')

def build(qa=False):
    PRIVATE.mkdir(parents=True, exist_ok=True)
    credentials_path = PRIVATE / 'credentials.json'
    if credentials_path.exists():
        accounts = json.loads(credentials_path.read_text())
    else:
        accounts = []
        for i in range(1, 4):
            password = '-'.join(secrets.choice(WORDS).capitalize() for _ in range(3)) + '-' + f'{secrets.randbelow(1000000):06d}'
            accounts.append({'login': f'meteo{i}', 'name': f'Ekspert {i}', 'role': 'reviewer', 'password': password})
        accounts.append({'login': 'koordynator', 'name': 'Koordynator', 'role': 'coordinator', 'password': secrets.token_urlsafe(18)})
        credentials_path.write_text(json.dumps(accounts, ensure_ascii=False, indent=2))
        credentials_path.chmod(0o600)
    out = PRIVATE / ('qa-root' if qa else 'delivery') / 'ocena'
    out.mkdir(parents=True, exist_ok=True)
    for name in ['index.html', 'portal.js', 'portal.css', '.htaccess', 'api.php']:
        shutil.copy2(HERE / 'site' / name, out / name)
    assets = out / 'assets'; assets.mkdir(exist_ok=True)
    for name in ['Roobert-Regular.woff2', 'Roobert-Bold.woff2', 'Romie-Regular.woff2']:
        shutil.copy2(ROOT / 'public/fonts' / name, assets / name)
    private = out / '_private'; private.mkdir(exist_ok=True)
    (private / '.htaccess').write_text('Require all denied\n')
    compiled = {}
    for account in accounts:
        salt = secrets.token_bytes(24)
        compiled[account['login']] = {'name': account['name'], 'role': account['role'], 'salt': salt.hex(),
            'hash': hashlib.pbkdf2_hmac('sha256', account['password'].encode(), salt, 600000).hex()}
    config = {'accounts': compiled, 'rateSecret': secrets.token_hex(32), 'allowLocalQa': qa}
    (private / 'config.php').write_text(php_data(config))
    source = ROOT / '.local/v4/consultation-20260907'
    manifest = json.loads((source / '01-ocena-bez-podpowiedzi/images.json').read_text())
    photos = {}
    for item in manifest['items']:
        image = (source / '01-ocena-bez-podpowiedzi' / item['image_file']).read_bytes()
        assert hashlib.sha256(image).hexdigest() == item['image_sha256']
        photos[item['photo_id']] = base64.b64encode(image).decode()
    report = source / '02-po-niezaleznej-ocenie'
    materials = {'photos': photos, 'attribution': manifest['attribution'], 'report': (report / 'RAPORT.md').read_text(),
        'sourceLabels': load_csv(report / 'R001-R033-etykiety-po-ocenie.csv'),
        'pilot': load_csv(report / 'P001-P022-historyczne-porownanie.csv')}
    (private / 'materials.php').write_text(php_data(materials))
    for file in private.glob('*.php'): file.chmod(0o600)
    if not qa:
        instructions = '''CHMURNIK — PANEL KONSULTACJI

1. Rozpakuj ZIP w katalogu, w którym jest obecny index.html chmurnik.cloud.
   Ma powstać katalog ocena, a w nim index.html, api.php, portal.js i _private.
2. Niczego nie usuwaj z istniejącej aplikacji. Paczka nie podmienia jej plików.
3. Katalog ocena/_private musi być zapisywalny przez PHP Twojego konta (zwykle
   domyślne uprawnienia wystarczają). Nie ustawiaj uprawnień 777.
4. Otwórz https://chmurnik.cloud/ocena/. Wymagane PHP 8.1+ i HTTPS.
5. Loginy i hasła otrzymujesz osobno. ZIP nie zawiera haseł w postaci jawnej.

WAŻNE PRZY AKTUALIZACJACH: nie usuwaj ocena/_private/storage.php. To zapis ocen.
Nie udostępniaj instalacyjnego ZIP-a publicznie. Konto koordynatora jest tylko
dla właściciela konsultacji. Każdemu ekspertowi przekaż osobno jego własne konto.
Nie używaj jednego konta dla kilku ekspertów.

To nie jest aktualizacja modelu ani niezależny test skuteczności.
'''
        (out.parent / 'INSTALACJA.txt').write_text(instructions)
        account_text = ['CHMURNIK — KONTA PRYWATNE', 'Panel: https://chmurnik.cloud/ocena/',
                        'Każdemu ekspertowi przekaż tylko jego własny login i hasło.\n']
        for a in accounts:
            account_text += [a['name'], 'Login: ' + a['login'], 'Hasło: ' + a['password'], '']
        account_text += ['Koordynator widzi wszystkie odpowiedzi. Nie przekazuj tego konta ekspertom.',
                         'Po zapisaniu i zamknięciu oceny ekspert może zobaczyć raport. Pierwszych ocen nie nadpisujemy.']
        (PRIVATE / 'CHMURNIK-KONTA-PRYWATNE.txt').write_text('\n'.join(account_text))
        (PRIVATE / 'CHMURNIK-KONTA-PRYWATNE.txt').chmod(0o600)
        archive = PRIVATE / 'CHMURNIK-PANEL-CYBERFOLKS.zip'
        included = [out.parent / 'INSTALACJA.txt'] + [out / name for name in
            ['index.html', 'portal.js', 'portal.css', '.htaccess', 'api.php',
             '_private/.htaccess', '_private/config.php', '_private/materials.php']]
        included += sorted(assets.glob('*.woff2'))
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for file in included:
                z.write(file, file.relative_to(out.parent))
        with zipfile.ZipFile(archive) as z:
            assert z.testzip() is None
            for a in accounts: assert all(a['password'].encode() not in z.read(n) for n in z.namelist())
        print(f'Private delivery ready: {archive}; 3 reviewer accounts + owner coordinator; no plaintext passwords in ZIP.')
    else:
        print(f'QA root ready: {out.parent}; test storage is separate from production.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--qa', action='store_true')
    mode.add_argument('--update-only', action='store_true')
    args = parser.parse_args()
    if args.update_only:
        build_update()
    else:
        build(args.qa)
