const links = {
  wiatr: [{ id: "bryza", title: "Skąd bierze się bryza?" }],
  procesy: [
    { id: "chmura", title: "Kiedy pojawi się chmura?" },
    { id: "mgla", title: "Dlaczego nocą może powstać mgła?" },
  ],
};

export function weatherLessonLinks(lesson, base) {
  if (base !== "/chmurnik/" || !Object.hasOwn(links, lesson)) return [];
  return links[lesson].map(({ id, title }) => ({
    title,
    href: `${base}pogoda-preview/?from=${lesson}#${id}`,
  }));
}
