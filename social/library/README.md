# Permanent Social Media Library

Stable bookmark URL: https://jakiesluchawki.github.io/chmurnik/assetySM/

This is the parent page for every published CHMURNIK social campaign. Campaign
galleries remain separate; this catalogue is the single recurring entry point.
Newest packs appear first, with downloads grouped by campaign and format.
Superseded and pre-launch material is clearly archived, not recommended.

## Every Future Campaign

1. Retain the existing `/assetySM/` URL.
2. Add the new campaign to `catalog.mjs`, newest first, with real download paths.
3. Register its separate gallery in the Pages workflow.
4. Run `node social/library/build.mjs` and verify all relative links.
5. Link back to the library from the new campaign page.

The build fails if a dated `social/*/site/` directory has no catalogue entry
or if a cover/download is missing. This prevents future packs from silently
being omitted. The library has no analytics, account access or private assets.
It is copied to Pages separately and is not bundled in the native application.
