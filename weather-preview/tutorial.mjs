export const guides = {
  breeze: {
    start: { hour: 14, heating: 0 },
    steps: [
      {
        title: "Najpierw ogrzej ląd i wodę w różnym tempie",
        key: "heating",
        target: 70,
        action: "Ustaw kontrast na 70%",
        instruction:
          "Ustaw „Kontrast nagrzewania” na 70% suwakiem albo przyciskiem pod rysunkiem. Godzina pozostaje 14:00.",
        expect:
          "Porównaj dwa termometry na rysunku. Ląd powinien stać się cieplejszy od wody, a dolna strzałka pokazać ruch znad wody.",
        explanation:
          "Ląd ma teraz około 27°C, a woda około 21°C. W tym uproszczeniu nad cieplejszym lądem powietrze się unosi; przy powierzchni napływa tam powietrze znad wody. To bryza morska.",
      },
      {
        title: "Zobacz tę samą zatokę nocą",
        key: "hour",
        target: 2,
        action: "Przejdź do 02:00",
        instruction:
          "Ustaw „Porę dnia” na 02:00. Nie zmieniamy pozostałych warunków.",
        expect:
          "Sprawdź, który termometr pokaże teraz więcej, i porównaj kierunek dolnej strzałki z poprzednim krokiem.",
        explanation:
          "Nocą w naszym cyklu ląd jest chłodniejszy od wody. Obieg się odwrócił: przy powierzchni powietrze płynie z lądu nad wodę. Wyższa strzałka pokazuje gałąź powrotną, nie drugi wiatr przy ziemi.",
      },
      {
        title: "Usuń przyczynę tego obiegu",
        key: "heating",
        target: 0,
        action: "Wyrównaj temperatury: 0%",
        instruction:
          "Przesuń „Kontrast nagrzewania” do 0%. W tym modelu oba termometry pokażą wtedy 20°C.",
        expect:
          "Strzałki powinny zniknąć. Zwróć uwagę, że sama noc nie wystarcza, żeby wywołać bryzę.",
        explanation:
          "Bez różnicy temperatur ten lokalny obieg nie powstaje. To nie znaczy, że w rzeczywistości musi być bezwietrznie: wiatr związany z większym układem pogody nie jest częścią tej sceny.",
      },
    ],
  },
  cloud: {
    start: { temperature: 24, humidity: 55, height: 0 },
    steps: [
      {
        title: "Unieś powietrze trochę ponad ziemię",
        key: "height",
        target: 500,
        action: "Unieś na 500 m",
        instruction:
          "Unieś porcję powietrza na 500 m: przeciągnij kółko w górę albo naciśnij „Unieś na 500 m” pod rysunkiem. Liczba przy kółku pokazuje temperaturę.",
        expect:
          "Kółko przesunie się w górę, a temperatura spadnie z 24°C do około 19°C. Chmura jeszcze się nie pojawi.",
        explanation:
          "Unoszone powietrze rozpręża się i ochładza. Na tej wysokości nadal nie osiągnęło nasycenia, czyli warunku rozpoczęcia kondensacji. Niewidoczna para wodna nie jest jeszcze chmurą.",
      },
      {
        title: "Unieś tę samą porcję wyżej",
        key: "height",
        target: 1500,
        action: "Unieś na 1500 m",
        instruction:
          "Przeciągnij powietrze wyżej lub naciśnij „Unieś na 1500 m”. Obserwuj przejście przez przerywaną linię na rysunku.",
        expect:
          "Po przekroczeniu linii kółko zamieni się w chmurę: w tym modelu zaczyna się kondensacja.",
        explanation:
          "Powietrze ochłodziło się wystarczająco, aby osiągnąć nasycenie. Część pary zaczyna tworzyć kropelki. Linia pokazuje szacowany początek kondensacji, nie szczyt chmury.",
      },
      {
        title: "Powtórz próbę z suchszym powietrzem",
        key: "humidity",
        target: 20,
        action: "Zmień wilgotność na 20%",
        instruction:
          "Zostawiamy wysokość 1500 m i początkowe 24°C. Zmień tylko „Wilgotność przy ziemi” na 20%.",
        expect:
          "Chmura zniknie, choć porcja pozostaje na tej samej wysokości. Do kondensacji potrzeba teraz większego uniesienia.",
        explanation:
          "Porównujesz dwie porcje o różnej wilgotności początkowej, a nie osuszasz istniejącą chmurę. Suchsza porcja musi ochłodzić się bardziej. Jej poziom kondensacji wypada ponad zakresem rysunku.",
      },
      {
        title: "Sprawdź powietrze wilgotniejsze",
        key: "humidity",
        target: 80,
        action: "Zmień wilgotność na 80%",
        instruction:
          "Ustaw wilgotność początkową na 80%. Wysokości i temperatury początkowej nadal nie zmieniamy.",
        expect:
          "Linia kondensacji wróci na rysunek, niżej niż na początku, a na 1500 m pojawi się chmura.",
        explanation:
          "Przy tej samej temperaturze wilgotniejsze powietrze potrzebuje mniejszego ochłodzenia, aby osiągnąć nasycenie. Samo pojawienie się chmury nie mówi jeszcze nic pewnego o deszczu ani burzy.",
      },
    ],
  },
  fog: {
    start: { temperature: 18, humidity: 70, cooling: 0 },
    steps: [
      {
        title: "Ochłodź powietrze przy ziemi",
        key: "cooling",
        target: 3,
        action: "Ochłodź o 3°C",
        instruction:
          "Ustaw „Nocne ochłodzenie” na 3°C. To spadek od początkowych 18°C, więc termometr pokaże 15°C.",
        expect:
          "Wilgotność względna wzrośnie, mimo że nie dodajemy pary wodnej. Mgły jeszcze nie powinno być.",
        explanation:
          "Wilgotność względna opisuje, jak blisko nasycenia jest powietrze w danej temperaturze. Przy ochładzaniu zbliża się do 100%. Na razie temperatura jest wyższa od początkowego punktu rosy, około 12,4°C.",
      },
      {
        title: "Sprawdź, kiedy zacznie się kondensacja",
        key: "cooling",
        target: 6,
        action: "Ochłodź o 6°C",
        instruction:
          "Zwiększ ochłodzenie do 6°C. Powietrze ma teraz osiągnąć 12°C, bez zmiany wilgotności początkowej.",
        expect:
          "Wilgotność względna osiągnie 100%, a przy gruncie pojawi się symboliczna warstwa mgły.",
        explanation:
          "Osiągnęliśmy warunki do kondensacji przy ziemi. Pokazujemy mechanizm sprzyjający mgle radiacyjnej, nie prognozę jej wystąpienia. W rzeczywistości liczą się także wiatr, mieszanie powietrza i to, jak gruba warstwa się ochłodzi.",
      },
      {
        title: "Czy takie ochłodzenie zawsze wystarczy?",
        key: "humidity",
        target: 40,
        action: "Zmień wilgotność początkową na 40%",
        instruction:
          "Pozostaw ochłodzenie o 6°C, ale porównaj je z powietrzem o wilgotności początkowej 40%.",
        expect:
          "Ilustracja mgły zniknie. Końcowe 12°C to w tej próbie za dużo, aby osiągnąć nasycenie.",
        explanation:
          "Takie samo ochłodzenie daje inny wynik, gdy na początku jest mniej pary wodnej. Początkowy punkt rosy jest teraz znacznie niższy. Sam chłodny wieczór nie wystarcza do przewidzenia mgły.",
      },
      {
        title: "Porównaj z wilgotnym wieczorem",
        key: "humidity",
        target: 90,
        action: "Zmień wilgotność początkową na 90%",
        instruction:
          "Ustaw wilgotność początkową na 90%. Pozostałe warunki nadal są takie same.",
        expect:
          "Kondensacja znów będzie możliwa. Tym razem wystarczyłoby nawet mniejsze ochłodzenie niż 6°C.",
        explanation:
          "Gdy powietrze jest już blisko nasycenia, niewielki spadek temperatury może wystarczyć. Suwak zmienia warunki początkowe kolejnej próby; nie dolewa wody do powietrza w czasie nocy.",
      },
    ],
  },
};

export function guideInputsAt(scene, index) {
  const guide = guides[scene];
  const input = { ...guide.start };
  for (const step of guide.steps.slice(0, Math.max(0, index)))
    input[step.key] = step.target;
  return input;
}

export function guideStepComplete(scene, index, input) {
  const step = guides[scene]?.steps[index];
  if (!step) return false;
  const expected = { ...guideInputsAt(scene, index), [step.key]: step.target };
  return Object.entries(expected).every(([key, value]) => input[key] === value);
}

export const quizCases = {
  breeze: { start: { hour: 14, heating: 70 }, key: "hour", target: 2 },
  cloud: {
    start: { temperature: 24, humidity: 40, height: 1500 },
    key: "humidity",
    target: 70,
  },
  fog: {
    start: { temperature: 18, humidity: 70, cooling: 0 },
    key: "cooling",
    target: 6,
  },
};

export const sceneHashes = { breeze: "bryza", cloud: "chmura", fog: "mgla" };
export function sceneFromHash(hash) {
  return (
    Object.keys(sceneHashes).find((key) => `#${sceneHashes[key]}` === hash) ||
    "breeze"
  );
}
export function returnLesson(search, fallback) {
  const from = new URLSearchParams(search).get("from");
  return ["wiatr", "procesy"].includes(from) ? from : fallback;
}
