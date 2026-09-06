"""Package retained evidence for private consultation; never infer or train."""
import csv
import hashlib
import html
import json
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '.local/v4/expert-review-v1-layout2'
OUT = ROOT / '.local/v4/consultation-20260907'
BLIND = OUT / '01-ocena-bez-podpowiedzi'
COMPARE = OUT / '02-po-niezaleznej-ocenie'
MANIFEST_SHA = '464e1318aaf914bb221ec53b3d211a64f83fdb21ee45c7b353d0f86bf162b799'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def write_csv(path, headers, rows):
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerow(headers)
        writer.writerows(rows)

def build():
    OUT.mkdir(parents=True, exist_ok=True)
    BLIND.mkdir(exist_ok=True)
    COMPARE.mkdir(exist_ok=True)
    assert sha(SOURCE / 'reviewer/images.json') == MANIFEST_SHA
    manifest = json.loads((SOURCE / 'reviewer/images.json').read_text())
    key = json.loads((SOURCE / 'PRIVATE-KEY-DO-NOT-SEND.json').read_text())
    assert len(manifest['items']) == 33
    assert len({r['group'] for r in key['items']}) == 33
    assert len({r['split_group'] for r in key['items']}) == 33
    assert all(r['role'] == 'train' and r['source_id'].startswith('imgw/') for r in key['items'])
    shutil.copytree(SOURCE / 'reviewer', BLIND, dirs_exist_ok=True)
    for item in manifest['items']:
        assert sha(BLIND / item['image_file']) == item['image_sha256']
    a = manifest['attribution']
    write_csv(BLIND / 'zrodla.csv', ['photo_id','autorzy','zrodlo','licencja','adres_licencji','przygotowanie','sha256'],
              [[i['photo_id'],a['authors'],a['source'],a['license'],a['license_url'],a['preparation'],i['image_sha256']] for i in manifest['items']])
    write_csv(BLIND / 'jakosc.csv', ['photo_id','jakosc','ograniczenia','widoczne_cechy'],
              [[i['photo_id'],'','',''] for i in manifest['items']])
    note = '''# Cel konsultacji

Chcemy sprawdzić, czy zdjęcia i ich dotychczasowe opisy nadają się do nauki
rozpoznawania rodzajów chmur. Prosimy o ocenę widocznego kadru, nie o odgadywanie
etykiety ze źródła. To 33 istniejące zdjęcia z materiału rozwojowego, a nie nowy,
nietknięty test skuteczności. Oceny nie zostaną automatycznie użyte do treningu.

## Wygodna kolejność

1. Rozpakuj wyłącznie paczkę 01 i otwórz index.html. Każde zdjęcie ma stały kod
   R001-R033. Kliknij miniaturę, by zobaczyć cały dostępny plik.
2. Wypełnij OCENA-33.xlsx albo ocena.csv i uzupełniający jakosc.csv. Wybierz jedną
   drogę, nie trzeba wypełniać obu. Zachowaj identyfikatory. Puste pole oznacza
   brak oceny, nie bezchmurne niebo. Można oddać częściową odpowiedź.
3. Dla jakości użyj dobra, ograniczona lub nieprzydatna. Wpisz widoczne cechy
   i ograniczenia kadru. INSTRUKCJA.md opisuje kody rozpoznania; wiele obecnych
   rodzajów oddziel znakiem |. Alternatywa to nie to samo co drugi obecny rodzaj.
4. Zapisz własną kopię przed oglądaniem raportu 02. Najlepiej, aby drugi
   doświadczony obserwator ocenił zdjęcia osobno, bez znajomości pierwszej oceny.
   Rozbieżności potem omawiamy, a nie rozstrzygamy głosowaniem modeli.

## Pytania do konsultacji

- Które cechy naprawdę uzasadniają nazwę rodzaju, a których na zdjęciu brakuje?
- Czy widać kilka rodzajów lub kilka możliwych interpretacji tej samej struktury?
- Czy rozdzielczość, światło i kadr pozwalają w ogóle postawić hipotezę?
- Jakiej dodatkowej fotografii lub obserwacji potrzeba, żeby rozstrzygnąć wątpliwość?
- Czy sensowniejszym celem aplikacji jest wskazany fragment, cała scena czy lista
  kilku rodzajów? Prosimy oddzielić to zalecenie od ocen konkretnych zdjęć.

## Ograniczenia

To mały pilotaż jakości oznaczeń jednego źródła, z 33 różnymi dniami obserwacji.
Nie reprezentuje częstości występowania chmur w terenie. Zdjęcia mają maksymalnie
640 px; drobne szczegóły mogły zniknąć. Nie należy wymuszać rozpoznania ani
wnioskować o wysokości, przyszłej pogodzie czy bezpieczeństwie lotu z samego kadru.
Ocena eksperta również może pozostać niejednoznaczna. Nie mamy jeszcze żadnej
niezależnej oceny człowieka. Brakuje nowego zbioru do potwierdzenia jakości modelu.

## Źródła i prywatność

Tylko wskazane zdjęcia IMGW, z autorstwem i CC BY 4.0 w zrodla.csv oraz images.json.
Nie dołączono prywatnych rozmów, filmów, zdjęć użytkowników ani odrzuconych zbiorów
o niejasnych prawach. Link do całego zbioru służy atrybucji; nie szukaj w nim
oryginalnych nazw przed zapisaniem własnej oceny. Paczka jest udostępniona tylko
właścicielowi; on decyduje, komu ją przekazać. Niczego nie wysłano meteorologowi.
'''
    (BLIND / 'KONSULTACJA.md').write_text(note, encoding='utf8')
    original_html = (BLIND / 'index.html').read_text()
    addition = '<section style="padding:1rem;overflow-wrap:anywhere"><h2>Konsultacja i pliki</h2><p>33 zdjęcia rozwojowe, nie nowy test skuteczności.</p><p><a href="OCENA-33.xlsx">Arkusz Excel do oceny</a> · <a href="jakosc.csv">Jakość zdjęć CSV</a> · <a href="zrodla.csv">Źródła i licencje</a> · <a href="KONSULTACJA.md">Cel i pytania</a> · <a href="PLAN-NOWYCH-DANYCH.md">Plan nowych danych</a></p></section>'
    assert '</h1>' in original_html
    (BLIND / 'index.html').write_text(original_html.replace('</h1>', '</h1>'+addition, 1), encoding='utf8')
    plan = '''# Plan po konsultacji

Obecny etap eksperymentów zakończono na dyspozycję właściciela. Nie uruchamiamy
dalszych treningów, strojenia progów ani kolejnych wariantów. Powrót wymaga nowej
dyspozycji oraz oceny, co rzeczywiście zmieniło się w danych.

## Rozdzielenie danych

R001-R033 pozostają materiałem rozwojowym. Wszystkie zdjęcia wcześniej oglądane,
testowane lub użyte przy wyborze modelu pozostają oznaczone jako ujawnione.
Żadna ponowna etykieta nie zmieni ich w niezależny test. Nie przenosimy ich do
nowej części potwierdzającej. Zachowujemy stare etykiety obok nowych ocen.

Nowe zdjęcia zbieramy od autorów z jednoznaczną zgodą na konsultację i planowany
zakres uczenia/oceny. Zachowujemy oryginał, autora, zakres praw, datę i kontekst
obserwacji; dokładne lokalizacje przechowujemy prywatnie tylko gdy potrzebne.
Włączamy różne urządzenia, pory dnia, pory roku, kadry mieszane oraz zdjęcia
nieprzydatne. Nie zbieramy wyłącznie ładnych i łatwych przykładów.

Najpierw dwie niezależne oceny bez modelu, potem uzgodnienie rozbieżności albo
status nierozstrzygnięty. Kilka widocznych rodzajów nie staje się automatycznie
jedną klasą. Oddzielamy obszar oceniany od innych warstw w tle.

Przed treningiem grupujemy całe serie, bliskie duplikaty, dni obserwacji i autorów.
Podział jest na poziomie grup, nie losowych plików z jednej serii. Propozycja
robocza: 60% grup uczenie, 15% wybór modelu, 10% kalibracja, 15% potwierdzenie.
Proporcje i liczebność należy ustalić przed otwarciem części potwierdzającej,
uwzględniając dostępność wszystkich rodzajów i rzeczywistą niezależność serii.
Nie deklarujemy dziś, że 33 zdjęcia wystarczą. Minimalną próbę należy policzyć
pod precyzję oszacowań i spodziewaną liczbę zaakceptowanych odpowiedzi, osobno
dla chmur, nieba bez chmur, trudnych kadrów i najrzadszych rodzajów.

## Warunki następnego etapu

Zamrozić manifest, hashe, grupy, protokół oraz kryteria przed kolejnym badaniem.
Porównać aktualną aplikację i jednego wybranego kandydata na tych samych obrazach.
Raportować liczby, top-1/top-3, macro-F1, błędy dla każdego rodzaju, odmowy,
precyzję wśród przyjętych odpowiedzi, pokrycie oraz przedziały ufności. Nie
używać samych przypadków przyjętych jako mianownika ogólnej skuteczności.

Dotychczasowe minimalne bramki nie są obniżane: kalibracyjna precyzja selektywna
90%; na teście co najmniej +5 punktów procentowych top-1 i +0,03 macro-F1;
osobno poprawa cloud-only +5 pp; przyjęte chmury: przynajmniej 20 przypadków
i co najmniej 85% obserwowanej precyzji. Pokrycie nie może spaść ponad 3 pp
względem porównywanego modelu. Wynik punktowy nie jest gwarancją wiarygodności.
Do zatwierdzenia z konsultantem: bardziej rygorystyczne granice ufności,
obsługa kadrów wielorodzajowych oraz minimalna liczebność dla każdego rodzaju.

Niezależnie obowiązują brak istotnej regresji atlasu/stress, zgodność eksportu
Core ML i rzeczywistego importu zdjęć, testy czasu/pamięci oraz prywatność.
Nie poprawiamy progów po zobaczeniu wyniku nowego testu. Nieudany kandydat nie
trafia do aplikacji. Nie ma gwarancji, że konsultacja da oczekiwany wzrost jakości.
'''
    for folder in [BLIND, COMPARE]:
        (folder / 'PLAN-NOWYCH-DANYCH.md').write_text(plan, encoding='utf8')
    baseline = json.loads((ROOT / '.local/v4/baseline-v3-native-imgw.json').read_text())
    byid = {r['id']:r for r in baseline['rows']}
    assert not any(r['source_id'] in byid for r in key['items'])
    write_csv(COMPARE / 'R001-R033-etykiety-po-ocenie.csv',
              ['photo_id','etykieta_zrodla_nie_wzorzec','dotychczasowa_predykcja','niezalezna_ocena','uwagi'],
              [[r['photo_id'],r['original_label'],'brak zachowanej predykcji dla tego wiersza treningowego','',''] for r in key['items']])
    pilot = json.loads((ROOT / '.local/v4/blind-vision-pilot-20260906/comparison.json').read_text())
    rows = pilot['rows']
    assert len(rows)==22
    assert sum(r['native_matches_source'] for r in rows)==8
    assert sum(r['a']['matches_source'] for r in rows)==3
    assert sum(r['b']['matches_source'] for r in rows)==4
    write_csv(COMPARE / 'P001-P022-historyczne-porownanie.csv',
              ['photo_id','etykieta_zrodla_nie_wzorzec','aplikacja_top1','aplikacja_przyjeta','zgodna_ze_zrodlem','astra_pelny_kadr','astra_srodek','pelny_kadr_uzasadnienie','pelny_kadr_ograniczenia'],
              [[r['photo_id'],r['source_label'],r['native_top1'],r['native_accepted'],r['native_matches_source'],r['a']['best_guess'],r['b']['best_guess'],r['a']['evidence_pl'],r['a']['limits_pl']] for r in rows])
    report = '''# Raport do otwarcia po niezależnej ocenie

## Co jest, a czego nie ma

R001-R033: oddzielna tabela zachowuje etykiety źródłowe do późniejszego porównania.
Nie są one zweryfikowanymi odpowiedziami. Nie ma zachowanych predykcji aplikacji
dla tych 33 wierszy treningowych. Brak oznaczono jawnie; nie wykonano dodatkowej
inferencji i nie pożyczono wyników innych zdjęć. Nie ma ocen meteorologa.

P001-P022: inny, wcześniej ujawniony pilotaż porównania. To NIE są zdjęcia
R001-R033. Nazwy P i R nie mogą być łączone po numerze. Dołączono wszystkie
22 zachowane wyniki liczbowe i opisy, nie tylko przypadki korzystne. Zdjęć
tego osobnego, mieszanego zbioru źródłowego nie redystrybuujemy w tej paczce.

## Dotychczasowe wyniki

W pilotażu P aplikacja zgadzała się z etykietą źródła w 8/22 przypadkach,
Astra w nowej sesji z pełnym kadrem w 3/22, a z kadrem środkowym w 4/22.
Tylko dwie surowe hipotezy aplikacji przeszły jej politykę akceptacji.
Były to sesje Codexa, nie odtworzenie ustawień nieznanego okna ChatGPT osoby
zgłaszającej feedback. Brak niezależnego wzorca i tylko jedna odpowiedź na
wariant nie pozwalają rozstrzygnąć ogólnej przewagi ani wpływu samego kadru.

W zachowanym 123-zdjęciowym teście rozwojowym rzeczywisty model aplikacji trafił
68/123 etykiet, a późniejszy kandydat 77/123. Dla samych zdjęć chmur odpowiednio
37/92 i 46/92. To małe, ujawnione zbiory, nie niezależna trafność terenowa.
Różnica 9 zdjęć ma zapisany sparowany 95% przedział od -0,813 do +15,447 pp.

Liczba 85,4% dotyczy najlepszego podzbioru po progowaniu: 35 zgodnych odpowiedzi
z 41 przyjętych spośród 260 zdjęć kalibracyjnych chmur. Pokrycie 15,8%.
Nie jest ogólną skutecznością. Żaden sprawdzony próg z wymaganym wsparciem
nie osiągnął celu 90%. Kandydat nie został wdrożony. Nie dowiedziono też,
że wyłącznie błędne etykiety odpowiadają za jego ograniczenia.

## Przykłady rozbieżności do dyskusji

P012: etykieta Ac i aplikacja Ac; obie sesje Astra wskazały Cu z alternatywą Cb.
P020: etykieta Ci, aplikacja Cu, obie sesje Astra Cb z Cu jako dodatkowym rodzajem.
P022: etykieta St i aplikacja St, obie sesje Astra Sc.
To rozbieżności, nie potwierdzone poprawki. Uzgodnienie dwóch modeli nie jest
niezależną oceną meteorologiczną. Pełna tabela zawiera też zgodności i odmowy.

## Co zamykamy

Na dyspozycję właściciela kończymy obecny etap eksperymentów bez uznania celu
poprawy jakości za osiągnięty. Kod, dane, negatywne wyniki i protokoły zachowano.
Ta paczka tylko porządkuje istniejące dowody. Dalszy etap wymaga nowej dyspozycji,
niezależnej konsultacji i decyzji o danych zgodnie z PLAN-NOWYCH-DANYCH.md.
'''
    (COMPARE / 'RAPORT.md').write_text(report, encoding='utf8')
    # Receipts contain hashes and neutral source descriptions, never credentials or local paths.
    evidence = {}
    for name, p in {
        'reviewer_manifest':SOURCE / 'reviewer/images.json',
        'native_baseline':ROOT / '.local/v4/baseline-v3-native-imgw.json',
        'pilot_comparison':ROOT / '.local/v4/blind-vision-pilot-20260906/comparison.json',
        'candidate_evaluation':ROOT / '.local/v4/dinov2-reliability-calibrated/evaluation.json',
        'policy_grid':ROOT / 'lore/1-tasks/active/0042_FEATURE_recognition-first-v4/policy-grid-evaluation.json',
    }.items(): evidence[name] = sha(p)
    (COMPARE / 'POCHODZENIE-RAPORTU.json').write_text(json.dumps(evidence,indent=2)+'\n')
    rows_html=''.join('<tr>'+''.join('<td>'+html.escape(str(v))+'</td>' for v in [r['photo_id'],r['source_label'],r['native_top1'],r['a']['best_guess'],r['b']['best_guess']])+'</tr>' for r in rows)
    (COMPARE / 'index.html').write_text('<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>CHMURNIK: raport po ocenie</title><style>body{max-width:1000px;margin:auto;padding:24px;background:#fff7eb;color:#3c4029;font:17px/1.55 system-ui}pre{white-space:pre-wrap;font:inherit}table{border-collapse:collapse;font-size:14px}td,th{padding:10px;border-bottom:1px solid #c8c8b8;text-align:left}.table{overflow:auto}</style><h1>Raport po niezależnej ocenie</h1><pre>'+html.escape(report)+'</pre><div class="table"><table><tr><th>ID</th><th>Etykieta źródłowa</th><th>Aplikacja</th><th>Astra pełny kadr</th><th>Astra środek</th></tr>'+rows_html+'</table></div><p><a href="P001-P022-historyczne-porownanie.csv">Pełna tabela CSV</a> · <a href="R001-R033-etykiety-po-ocenie.csv">Etykiety R001-R033</a></p></html>',encoding='utf8')
    print('Prepared consultation directories; build the blank XLSX before --zip.')

def package():
    assert (BLIND / 'OCENA-33.xlsx').is_file()
    receipts=[]
    for folder,name in [(BLIND,'CHMURNIK-01-OCENA-33-BEZ-PODPOWIEDZI.zip'),(COMPARE,'CHMURNIK-02-RAPORT-PO-OCENIE.zip')]:
        files=sorted(p for p in folder.rglob('*') if p.is_file() and not p.name.endswith('.inspect.ndjson'))
        target=OUT/name
        with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            for p in files:z.write(p,p.relative_to(folder))
        with zipfile.ZipFile(target) as z:
            assert z.testzip() is None
            assert not any('PRIVATE' in n or n.endswith('.py') for n in z.namelist())
        receipts.append({'file':name,'bytes':target.stat().st_size,'sha256':sha(target),'entries':len(files)})
    (OUT/'delivery-manifest.json').write_text(json.dumps(receipts,indent=2)+'\n')
    print(json.dumps(receipts,indent=2))

if __name__=='__main__':
    import sys
    package() if '--zip' in sys.argv else build()
