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
