export const applicationInformation = {
  updated: "26 sierpnia 2026",
  publisher: "Mieszko Mahboob",
  supportUrl: "https://github.com/jakiesluchawki/chmurnik/issues",
  supportLabel: "Zgłoś problem na GitHubie",
  pages: {
    support: {
      title: "Pomoc",
      intro:
        "Spokojnie. Najważniejsze odpowiedzi masz tutaj, także bez internetu.",
      sections: [
        {
          title: "Aparat i biblioteka",
          paragraphs: [
            "Na iPhonie wybierz Dziś → Obserwuj niebo. Możesz zrobić zdjęcie albo wybrać je z biblioteki. Dostęp do aparatu jest potrzebny tylko do fotografowania; atlas, nauka i pracownie działają bez niego.",
            "Jeżeli odmówisz dostępu, możesz zmienić decyzję w Ustawieniach iPhone’a → Aplikacje → CHMURNIK → Aparat. Gdy zdjęcie się nie wczyta, zanotuj kod komunikatu i spróbuj ponownie. Nie usuwaj aplikacji, zanim nie wyeksportujesz swojej kolekcji.",
          ],
        },
        {
          title: "Podpowiedź, nie pewnik",
          paragraphs: [
            "Model analizuje zdjęcie na iPhonie, bez wysyłania go do serwera. Może się mylić, szczególnie przy mieszanych chmurach, słabym świetle i szerokim horyzoncie. Wynik jest hipotezą, a nie potwierdzonym rozpoznaniem ani pomiarem pogody.",
            "Porównaj kadr z prawdziwymi fotografiami atlasu. Zapisz własne rozpoznanie osobno od sugestii modelu. Możesz także zachować obserwację bez ustalania rodzaju chmury.",
          ],
        },
        {
          title: "Kolekcja i kopie",
          paragraphs: [
            "Moje niebo przechowuje zdjęcia, notatki i rozpoznania na tym urządzeniu. W sekcji Prywatność i kopia użyj Eksportuj kopię. Zachowaj wszystkie części eksportu; Importuj kopię pozwala je odtworzyć.",
            "Pełna kopia zawiera również wpisane miejsca i prywatne notatki. Pocztówka ich nie zawiera. Nie ma konta ani automatycznej synchronizacji między aplikacją a przeglądarką. Usunięcie aplikacji lub danych witryny może usunąć kolekcję.",
          ],
        },
        {
          title: "METAR, TAF, wiatr i Windy",
          paragraphs: [
            "METAR i SPECI opisują obserwację, a TAF jest prognozą. Czytnik rozróżnia te typy, pokazuje grupy raportu i okresy zmian prognozy. Wklejony tekst nie jest raportem pobranym na żywo; zawsze sprawdź oryginał, źródło i aktualność.",
            "Pracownie wiatru i map mają tryb Narzędzie oraz Trening. Odsyłacze do Windy otwierają zewnętrzny serwis. CHMURNIK nie zastępuje oficjalnego briefingu, ostrzeżeń ani ograniczeń statku powietrznego, jachtu i załogi.",
          ],
        },
        {
          title: "Bez internetu",
          paragraphs: [
            "Aplikacja iOS zawiera atlas, lekcje, model i pracownie na urządzeniu. Linki do źródeł i zewnętrznych map wymagają internetu. Zdjęcie przechowywane wyłącznie w iCloud może najpierw wymagać pobrania przez system. Na WWW dostęp offline zależy od wcześniejszego załadowania zasobów i pamięci przeglądarki.",
          ],
        },
        {
          title: "Zgłoś problem",
          paragraphs: [
            "CHMURNIK rozwija Mieszko Mahboob. W zgłoszeniu podaj wersję aplikacji, model iPhone’a, wersję iOS i kroki prowadzące do problemu. Na WWW dodaj nazwę przeglądarki i adres strony.",
            "Zgłoszenia na GitHubie są publiczne. Nie dołączaj prywatnych zdjęć, kopii kolekcji, haseł ani danych innych osób. Do samego korzystania z aplikacji nie potrzebujesz konta.",
          ],
        },
      ],
    },
    privacy: {
      title: "Prywatność",
      intro: "Twoje niebo jest Twoje. Bez kont, reklam i śledzenia.",
      sections: [
        {
          title: "Kto i czego dotyczy ta informacja",
          paragraphs: [
            "CHMURNIK jest aplikacją i witryną edukacyjną rozwijaną przez Mieszka Mahbooba. Ta informacja opisuje aplikację iOS oraz strony chmurnik.cloud i jakiesluchawki.github.io/chmurnik.",
            "Aplikacja nie wysyła zdjęć, notatek, wyników modelu ani postępów do twórcy. Nie zawiera kont, reklam, analityki zachowania ani mechanizmów śledzenia reklamowego.",
          ],
        },
        {
          title: "Co zostaje na urządzeniu",
          paragraphs: [
            "Zapisane obserwacje mogą zawierać zdjęcie, datę, miejsce wpisane ręcznie, notatkę, ulubione, własne rozpoznanie i oddzielną hipotezę modelu. Postępy nauki i preferencje również są lokalne. CHMURNIK nie pobiera lokalizacji GPS i nie używa mikrofonu.",
            "Na iOS kolekcja jest zapisywana w plikach aplikacji, a postępy w jej lokalnej pamięci. Na WWW używamy IndexedDB i localStorage w danej przeglądarce. Dane nie synchronizują się automatycznie między urządzeniami.",
          ],
        },
        {
          title: "Zdjęcia i zgody",
          paragraphs: [
            "Aparat uruchamiasz samodzielnie. Przy korzystaniu z biblioteki iOS pyta o dostęp do Zdjęć. Możesz udzielić go tylko wybranym zdjęciom albo całej bibliotece; w jej podglądzie wybierasz pojedynczy kadr do analizy. Odmowa dostępu nie blokuje atlasu, lekcji ani pracowni. Zgody można zmienić w ustawieniach systemowych.",
            "Rozpoznawanie wykorzystuje model na iPhonie. Zdjęcie nie trafia do zewnętrznej usługi AI ani do treningu modelu. W kopiach zdjęć zapisanych w kolekcji i na pocztówkach usuwamy źródłowe metadane EXIF i GPS. Plik może zachować techniczne informacje o rozmiarze i kolorze obrazu. Nie modyfikujemy oryginału w Twojej bibliotece.",
          ],
        },
        {
          title: "Eksport, udostępnianie i kopie systemowe",
          paragraphs: [
            "Dane opuszczają aplikację, gdy samodzielnie wyeksportujesz kopię lub udostępnisz pocztówkę do wybranej aplikacji bądź usługi. Pełny eksport obejmuje zdjęcia, miejsca i notatki. Pocztówka zawiera wybrany kadr, datę i opis rozpoznania, ale nie prywatną notatkę ani miejsce.",
            "Systemowe kopie iPhone’a mogą obejmować dane aplikacji, zależnie od ustawień urządzenia i iCloud. Pliki wyeksportowane do innych usług podlegają ich zasadom. CHMURNIK nie kontroluje tych kopii i nie usuwa ich zdalnie.",
          ],
        },
        {
          title: "Przechowywanie i usuwanie",
          paragraphs: [
            "Wpis można usunąć w Moje niebo → szczegóły obserwacji → Usuń obserwację. Usunięcie usuwa bieżący wpis i jego zdjęcie z kolekcji. Lokalna poprzednia wersja indeksu lub zachowana kopia dawnego dziennika może nadal zawierać dane odzyskiwania.",
            "Aby usunąć również lokalne kopie odzyskiwania i pliki tymczasowe, usuń aplikację wraz z jej danymi w ustawieniach iOS (nie wybieraj samego odinstalowania z zachowaniem dokumentów). Na WWW usuń dane tej witryny w przeglądarce. Najpierw wyeksportuj wszystko, co chcesz zachować.",
            "Oryginały w bibliotece Zdjęcia, wcześniej wyeksportowane pliki i kopie systemowe usuwa się osobno w odpowiedniej aplikacji lub ustawieniach. Nie mamy dostępu do Twojej lokalnej kolekcji ani możliwości jej odzyskania z serwera.",
          ],
        },
        {
          title: "Witryna i linki zewnętrzne",
          paragraphs: [
            "Odwiedzając WWW, łączysz się z hostingiem GitHub Pages lub cyber_Folks. Hosting może przetwarzać techniczne dane połączenia, takie jak adres IP i żądany zasób, w celu udostępnienia oraz zabezpieczenia strony. CHMURNIK nie dodaje reklamowych ciasteczek ani zewnętrznej analityki.",
            "Linki do źródeł, Windy i GitHuba otwierasz świadomie. Te serwisy stosują własne zasady prywatności. Dane przetwarzane przez Apple w App Store, TestFlight i funkcjach systemowych podlegają zasadom Apple.",
          ],
        },
        {
          title: "Kontakt i zmiany",
          paragraphs: [
            "Pytania o prywatność i problemy techniczne możesz zgłosić przez stronę Pomoc. Nie wysyłaj całej kolekcji ani prywatnych danych w publicznym zgłoszeniu. Treść, którą samodzielnie opublikujesz na GitHubie, jest przetwarzana zgodnie z zasadami tego serwisu.",
            "Jeśli sposób działania aplikacji się zmieni, zaktualizujemy tę informację. Data u góry pozwala sprawdzić jej wersję.",
          ],
        },
      ],
    },
  },
};
