# CHMURNIK: niezależna ocena zdjęć nieba

Otwórz `index.html`, żeby obejrzeć zdjęcia. Kliknięcie zdjęcia otwiera cały
dostępny plik. Odpowiedzi wpisz w `ocena.csv`, najlepiej w arkuszu kalkulacyjnym.
Plik ma kodowanie UTF-8, a kolumny rozdziela średnik. Zachowaj identyfikatory
zdjęć, nazwy plików, sumy kontrolne i nagłówki kolumn bez zmian.

Oceń wyłącznie to, co można wywnioskować z fotografii. Nie szukaj jej nazwy
w zbiorze źródłowym i nie korzystaj z podpowiedzi modelu. Brak możliwości
rozpoznania jest wartościowym wynikiem, nie błędem osoby oceniającej.
Nie trzeba dopasować każdego zdjęcia do jednego rodzaju.

## Jak Wypełnić Ocenę

W kolumnie `assessment` wpisz jeden z poniższych kodów:

- `single`: można wskazać jeden widoczny rodzaj. Wpisz jego kod w `genera`.
- `mixed`: widać co najmniej dwa różne rodzaje. Wpisz je w `genera`, oddzielając
  pionową kreską, np. `Cu|Ci`. To rodzaje obecne równocześnie, nie alternatywy.
- `uncertain`: zdjęcie nie pozwala na wiarygodne przypisanie rodzaju.
  Zostaw `genera` puste. Jeśli masz propozycje, wpisz je w `alternatives`,
  np. `Ac|Sc`. Nie musisz podawać propozycji.
- `clear`: można ocenić, że na widocznym fragmencie nieba nie ma chmur.
  Zostaw `genera` i `alternatives` puste.
- `unusable`: kadr nie nadaje się do oceny nieba. Obie kolumny z rodzajami
  pozostają puste.

W `comment` krótko opisz, co zdecydowało o ocenie. Wskaż również ograniczenia,
np. małą rozdzielczość, ciemny kadr, brak skali lub zasłoniętą część chmury.
Pole `alternatives` jest przeznaczone wyłącznie dla oceny `uncertain`.

Kody: `Ci` Cirrus, `Cc` Cirrocumulus, `Cs` Cirrostratus,
`Ac` Altocumulus, `As` Altostratus, `Ns` Nimbostratus,
`Sc` Stratocumulus, `St` Stratus, `Cu` Cumulus, `Cb` Cumulonimbus.

Nieocenione wiersze zostaw puste. Nie wpisuj domyślnie `clear`. Można oddać
częściową ocenę. Zachowaj ją jako nowy plik CSV UTF-8 i przekaż osobie, która
wysłała zestaw, wraz z krótką informacją o doświadczeniu w obserwacji chmur.
Nie potrzebujemy danych osobowych w arkuszu.

## O Zestawie

To kontrola jakości materiału do uczenia, a nie egzamin ani pomiar skuteczności
aplikacji. W paczce nie ma odpowiedzi modelu. Zmiana etykiet wymaga osobnego
przeglądu; ta ocena nie jest automatycznie wykorzystywana do treningu.

Zdjęcia pochodzą z publicznego zbioru IMGW. Autorzy: Szymon Kopeć, Grzegorz
Duniec, Bogdan Bochenek i Mariusz Figurski. Publikacja: DOI 10.1002/qj.4865.
Licencja: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
[Źródło danych](https://danepubliczne.imgw.pl/en/repository/Artificial-neural-networks-in-automatic-image-classifications-of-cloud-from-ground-based-observations-using-deep-learning-models).

Używamy wcześniej przygotowanych kopii: orientacja zgodna z EXIF, RGB,
maksymalny bok 640 pikseli, JPEG jakości 92. Nie dodaliśmy kadrowania ani
poprawiania zdjęć. Niektóre szczegóły mogą być niewidoczne w tej rozdzielczości;
uwzględnij to w ocenie.
