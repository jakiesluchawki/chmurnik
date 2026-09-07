# Code-Only Reviewer Portal Update

Publish the owner-requested context update ZIP at
`/chmurnik/aktualizacje/CHMURNIK-PANEL-AKTUALIZACJA-20260907.zip`.
The archive contains five application files and an overlay instruction, with
no private configuration, photographs, credentials or response storage.
It updates an existing CyberFolks portal; it is not a standalone installer.

Source and QA are in the chmurnik-v4 worktree's review-portal directory.
48 API checks, separate legacy-snapshot preservation check, browser tests at
320/390/768/1440px, 288 application tests, Pages build and nine lesson checks pass.
Current 33 photographs are unchanged; a new wide-frame/detail series remains
separate work requiring matching real source photographs.

The workflow copies these downloads after the main app build, so PHP update
files are not included in native application assets. No live portal installation
is claimed; the owner uses the established manual CyberFolks upload flow.
