import { artworks, storeUrl } from './artwork.mjs';

export const captions = [
  {
    id: 'kolejnosc-i-linki', title: 'Kolejność publikacji i naklejki Link',
    text: `CHMURNIK / 3 września 2026\n\nPięć Stories tworzy jedną historię. Polecana kolejność: 01 JPG, 02 JPG, 03 MP4, 04 MP4, 05 JPG. Dla 03 i 04 możesz zamiast filmu użyć JPG. Nie publikuj obu wersji tej samej storki pod rząd.\n\n${artworks.map(item => `${item.title}\nTekst naklejki: ${item.stickerLabel}\nLink: ${storeUrl}`).join('\n\n')}\n\nDodaj prawdziwą naklejkę Link w Instagramie. Środek pustego pola: x=540, y=1570 w pliku 1080 × 1920. Naklejka powinna zmieścić się w 600 × 120 px. Nie zasłaniaj podpisów i zastrzeżeń poniżej. JPG i MP4 nie mają własnego klikalnego linku.\n\nDemo jest nieme i pokazuje działające narzędzia CHMURNIKA, nie pomiar wiatru ani aktualną pogodę. Dźwięk nie jest potrzebny do zrozumienia serii.`,
  },
  {
    id: 'historia', title: 'Geneza / tekst do wykorzystania',
    text: `CHMURNIK zaczął się od pilota w rodzinie. Jest szybownikiem, a teraz robi kurs PPL. Chciałem mu pomóc z rozpoznawaniem chmur.\n\nPotem dobudowałem trening METAR. A kiedy okazało się, że apka wyszła fajnie, doszła pracownia czytania Windy.\n\nNa żaglach z chłopakami przydał się z kolei moduł wiatru. I tak z jednej potrzeby zrobiła się aplikacja, którą chciałem udostępnić szerzej.\n\nDziś CHMURNIK ma atlas chmur, własne zdjęcia i obserwacje, czytnik i ćwiczenia METAR/TAF oraz pracownie Windy i wiatru.\n\nBezpłatnie na iPhone’a. Bez reklam i zakładania konta.\n${storeUrl}\n\nTo narzędzia edukacyjne. Pracownia Windy jest niezależnym ćwiczeniem, nie integracją z Windy. Telefon nie mierzy wiatru; aplikacja nie zastępuje oficjalnego briefingu.`,
  },
];
