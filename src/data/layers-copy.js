export const layersHeadings = {
  decoder: ["Mapy pogodowe", "Jak czytać Windy", "Wybierz warstwę, sprawdź jej jednostki i przećwicz odczytywanie mapy. To objaśnienie narzędzi, nie podgląd aktualnej pogody."],
  lab: ["Wysokość i ciśnienie", "Wysokość nad morzem i nad ziemią", "Zmień wysokość terenu i wybierz poziom ciśnienia. Schemat pokaże różnicę między wysokością nad poziomem morza (MSL) a wysokością nad gruntem (AGL)."],
  wind: ["Kierunek wiatru", "Co mówi ruch chmur?", "Ustaw obserwowany kierunek ruchu chmury i sprawdź, jak wiąże się z kierunkiem wiatru. To ćwiczenie nie mierzy prędkości wiatru."],
  metar: ["Depesze lotnicze", "METAR i TAF", "Przećwicz odczytywanie depesz: METAR opisuje obserwację, a TAF prognozę. Wybieraj odpowiedzi i sprawdzaj objaśnienia."],
  hazards: ["Ograniczenia obserwacji", "Zagrożenia pogodowe", "Sprawdź, czego nie da się ocenić na podstawie samego wyglądu chmury i dlaczego potrzebne są aktualne dane pogodowe."],
  sounding: ["Przekrój atmosfery", "Sondaż i Skew-T", "Przejrzyj szkoleniowe profile temperatury, wilgoci i wiatru. Porównaj przykłady i przećwicz czytanie wykresu."],
};

export const windyReadingSteps = [
  ["01", "Miejsce i czas", "Sprawdź punkt na mapie, termin prognozy i wybrany model."],
  ["02", "Wielkość i jednostka", "Przeczytaj nazwę warstwy oraz legendę, zanim zinterpretujesz kolor."],
  ["03", "Wysokość", "Sprawdź, czy warstwa dotyczy wysokości nad gruntem, nad morzem, poziomu ciśnienia czy całej kolumny atmosfery."],
  ["04", "Sprawdzenie wniosku", "Porównaj wynik z inną warstwą lub obserwacją. Zwróć uwagę na rozbieżności."],
];

export const windCaveats = [
  ["Lenticularis: chmury soczewkowate", "Chmura może pozostawać w miejscu, choć powietrze przepływa przez falę. Jej nieruchomy kształt nie oznacza ciszy."],
  ["Virga: opad niedocierający do ziemi", "Smugi są znoszone przez wiatr, ale jednocześnie opadają i zanikają. Ich nachylenie nie jest prostym wskaźnikiem kierunku wiatru."],
  ["Cumulonimbus: chmura burzowa", "Nowe komórki mogą rozwijać się w innym kierunku niż przepływa powietrze. Ruch całej burzy nie musi odpowiadać wiatrowi na jednym poziomie."],
  ["Radiatus: układ pasm", "Prawie równoległe pasma pozornie zbiegają się ku horyzontowi. Sam ich układ nie mówi, w którą stronę płynie powietrze."],
];

export const hazardCards = [
  { id: "icing", title: "Oblodzenie", text: "Porównaj temperaturę, obecność przechłodzonych kropel wody, grubość warstwy i czas przebywania w niej. Przechłodzone krople pozostają ciekłe poniżej 0°C. Sam wygląd chmury nie pozwala ocenić intensywności oblodzenia." },
  { id: "turbulence", title: "Turbulencja", text: "Może towarzyszyć konwekcji, przepływowi nad terenem i falom atmosferycznym, ale występuje też poza chmurami. Porównaj wiatr na kilku wysokościach; spokojny wiatr przy ziemi nie opisuje całego profilu." },
  { id: "storms", title: "Burze", text: "CAPE opisuje energię dostępną dla konwekcji, lecz samo nie oznacza, że powstanie burza. Sprawdź także wilgoć, mechanizm unoszenia, hamowanie konwekcji (CIN) i zmianę wiatru z wysokością, czyli uskok." },
];

export const soundingReadingSteps = [
  ["1", "Czas i źródło", "Sprawdź miejsce, termin oraz to, czy oglądasz pomiar, prognozę czy przykład szkoleniowy."],
  ["2", "Temperatura i punkt rosy", "Porównaj linie T i Td na kolejnych poziomach. Zwróć uwagę na wilgotne warstwy i inwersje temperatury."],
  ["3", "Unoszona porcja powietrza", "Porównaj jej temperaturę z otoczeniem. Skróty LCL, LFC i EL są wyjaśnione pod ćwiczeniem."],
  ["4", "Wiatr", "Sprawdź, jak kierunek i prędkość zmieniają się z wysokością."],
  ["5", "Ograniczenia", "Oddziel to, co widać w profilu, od informacji, które trzeba sprawdzić w innych danych."],
];
