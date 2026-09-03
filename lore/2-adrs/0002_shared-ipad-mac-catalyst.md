---
id: "0002"
title: "Share the native application across iPhone, iPad and Mac Catalyst"
status: accepted
date: "2026-09-03"
related_tasks: ["0034", "0035"]
---

# Shared Apple Application

## Context

The owner requested real iPad and macOS applications while retaining the
existing iPhone app. UIKit, Capacitor, Core ML and the private observation
vault already provide the required behavior. A second standalone desktop
implementation would duplicate storage, recognition and learning logic.

## Decision

Use one universal iPhone/iPad target and Mac Catalyst from the same sources.
Keep compact phone navigation, enable iPad orientations, and adapt wide
native windows with a sidebar and keyboard shortcuts. Do not add automatic
cloud synchronization or treat the web build as a native photo recognizer.

Capacitor 8.4.1's distributed binaries lack Catalyst slices. Build its
official source at commit 7217b5215a175eededf607a216e0cab2a8450a34 into local
arm64/x86_64 frameworks. Generate a separate ignored Mac project with a local
SwiftPM root override. Do not modify installed npm packages or the iPhone
package graph. The source pin must be reviewed when dependencies change.

On Mac, import a user-selected image instead of requesting a camera or broad
Photos access. Use native file panels for backup import/export, retaining the
existing bounded parser, local vault and non-overwriting merge. Preserve the
system sharing panel for postcards. The sandbox permits only user-selected
files and the app's own storage, plus existing network functionality.

## Consequences

Real Mac runtime and iPad/iPhone simulator tests confirm the shared approach.
An ad-hoc local Mac build and an unsigned device archive are engineering
artifacts, not public releases. Physical-device acceptance, Intel runtime,
signing, notarization or Apple upload remain separate release gates in 0035.
Collections remain local to each installation; deliberate JSON export/import
is the portable transfer path.
