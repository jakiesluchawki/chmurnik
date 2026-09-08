export const experiments = {
  fog: {
    number: "03",
    short: "Noc i mgła",
    title: "Dlaczego nocą może powstać mgła?",
    intro:
      "Porównaj ochładzanie wilgotnego i suchszego powietrza przy ziemi. Sprawdź, kiedy możliwa staje się kondensacja.",
    question:
      "Zaczynamy z temperaturą 18°C i wilgotnością względną 70%. Co stanie się przy ochłodzeniu do 12°C, bez dopływu pary wodnej?",
    choices: [
      "Wilgotność względna spadnie, bo noc jest chłodniejsza.",
      "Wilgotność względna pozostanie na 70%.",
      "Na pewno zacznie padać deszcz.",
      "Powietrze osiągnie nasycenie; kondensacja stanie się możliwa.",
    ],
    correct: 3,
    instruction:
      "Ustaw nocne ochłodzenie na 6°C. Temperaturę i wilgotność początkową pozostawiamy bez zmian.",
    explanation:
      "Początkowy punkt rosy wynosi około 12,4°C. Po ochłodzeniu do 12°C powietrze osiąga nasycenie. Kondensacja przy gruncie może sprzyjać mgle, ale ten model nie rozstrzyga, czy powstanie mgła, czy głównie rosa.",
    lesson: "procesy",
    lessonLabel: "Pełna lekcja o kondensacji",
    source: "https://www.weather.gov/safety/fog-radiation",
    sourceLabel: "NWS: nocne ochładzanie i mgła radiacyjna",
    limits:
      "Uproszczenie: ochładzamy powietrze przy gruncie, przy stałym ciśnieniu, bez dopływu pary i bez unoszenia. Przed nasyceniem ilość pary nie zmienia się; po jego osiągnięciu nadmiar ulega kondensacji, a wilgotność względna nie przekracza 100%. Używamy zależności Magnusa. Nie obliczamy bilansu energii gruntu, widzialności, grubości mgły ani podziału kondensatu między mgłę i rosę. Ilustracja pokazuje warunki do kondensacji, nie pewne wystąpienie mgły.",
    recap: [
      "W pogodną noc grunt może tracić ciepło i ochładzać powietrze tuż nad nim.",
      "Ochładzanie może zwiększyć wilgotność względną bez dodawania pary wodnej.",
      "Bliżej punktu rosy potrzeba mniejszego ochłodzenia do rozpoczęcia kondensacji.",
      "O wystąpieniu mgły decydują też wiatr, mieszanie i grubość chłodnej warstwy.",
    ],
  },
  breeze: {
    number: "01",
    short: "Dzień nad zatoką",
    title: "Skąd bierze się bryza?",
    intro:
      "Przesuń porę dnia i porównaj temperaturę lądu z temperaturą wody. Sprawdź, jak zmienia się obieg powietrza przy brzegu.",
    question:
      "W tej zatoce po południu ląd jest cieplejszy od wody. Co stanie się z lokalną bryzą, gdy nocą ląd będzie chłodniejszy?",
    choices: [
      "Nadal będzie wiała z wody na ląd.",
      "Zmieni kierunek i powieje z lądu nad wodę.",
      "Obieg przy powierzchni i u góry będzie w tę samą stronę.",
      "Temperatura nie ma wpływu na ten obieg.",
    ],
    correct: 1,
    instruction:
      "Ustaw godzinę 02:00. Pozostałe warunki zostawiliśmy takie same, żeby porównać wyłącznie porę dnia.",
    explanation:
      "Przy tych ustawieniach nocą ląd jest chłodniejszy od wody. W przyjętym uproszczeniu obieg odwraca się: przy powierzchni powietrze płynie z lądu nad wodę, a wyżej wraca. W rzeczywistości silny wiatr związany z większym układem pogody może osłabić lub przesłonić bryzę.",
    lesson: "wiatr",
    lessonLabel: "Pełna lekcja o wietrze",
    source: "https://www.weather.gov/bgm/WeatherInActionLakeShadowBreeze",
    sourceLabel: "NWS: bryza i różnice nagrzewania",
    limits:
      "Przekrój jest schematyczny. Temperatury pochodzą z umownego cyklu dobowego; nie są pomiarem ani prognozą. Pokazujemy lokalny obieg bez wiatru napływającego, rzeźby terenu i obrotu Ziemi. Tempo animacji nie oznacza prędkości w m/s.",
    recap: [
      "Ląd i woda mogą nagrzewać się i stygnąć w różnym tempie.",
      "W tej scenie różnica temperatur organizuje zamknięty obieg powietrza.",
      "Kierunek przy powierzchni jest inny niż w gałęzi powrotnej wyżej.",
      "To jeden z mechanizmów wiatru, nie wyjaśnienie każdej sytuacji pogodowej.",
    ],
  },
  cloud: {
    number: "02",
    short: "Powstaje chmura",
    title: "Kiedy pojawi się chmura?",
    intro:
      "Wybierz warunki przy ziemi, a potem unieś porcję powietrza. Zobacz, jak się ochładza i kiedy zaczyna się kondensacja.",
    question:
      "Unosimy powietrze o temperaturze początkowej 24°C na 1500 m. Co zmieni zwiększenie wilgotności początkowej z 40% do 70%?",
    choices: [
      "Kondensacja zacznie się dopiero wyżej.",
      "Temperatura unoszonego powietrza przestanie się zmieniać.",
      "Kondensacja zacznie się niżej.",
      "Samo zwiększenie wilgotności zawsze wywoła burzę.",
    ],
    correct: 2,
    instruction:
      "Zmień wilgotność początkową na 70%. Temperatura początkowa i wysokość pozostają takie same.",
    explanation:
      "Przy tej samej temperaturze większa wilgotność oznacza mniejszą różnicę między temperaturą a punktem rosy. Unoszone powietrze wcześniej osiąga nasycenie. W tym doświadczeniu na 1500 m pojawia się chmura, choć przy 40% wilgotności powietrze było jeszcze nienasycone. To nie przesądza o opadzie ani burzy.",
    lesson: "procesy",
    lessonLabel: "Pełna lekcja o powstawaniu chmur",
    source:
      "https://weather.metoffice.gov.uk/learn-about/weather/how-weather-works/what-is-convection",
    sourceLabel: "Met Office: unoszenie i powstawanie chmur",
    limits:
      "To wymuszone unoszenie pojedynczej porcji powietrza, bez mieszania z otoczeniem. Szacujemy poziom kondensacji jako 125 m na 1°C początkowej różnicy temperatury i punktu rosy. Ochładzanie: 9,8°C/km przed nasyceniem, umowne 6°C/km powyżej. Nie obliczamy naturalnej wyporności, grubości chmury, opadu ani burz. Wielkość ilustracji chmury jest symboliczna.",
    recap: [
      "Para wodna jest niewidoczna; widoczna chmura składa się z kropelek lub kryształków.",
      "W unoszonej porcji powietrza spada temperatura.",
      "Wilgotniejsze powietrze przy tej samej temperaturze osiąga nasycenie po mniejszym uniesieniu.",
      "Poziom kondensacji nie mówi jeszcze, jak wysoka będzie chmura i czy przyniesie deszcz.",
    ],
  },
};
