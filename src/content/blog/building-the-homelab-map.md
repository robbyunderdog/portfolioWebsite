---
title: Building the interactive homelab map
description: How the diagram on this site lays itself out from one data file and animates traffic through the lab.
date: 2026-10-16
tags: [astro, typescript, svg, this-site]
---

A list of tools doesn't explain a homelab very well. What's interesting is how the pieces connect: which VM depends on the storage pool, why DNS lives on its own node, how a friend's stream gets in from outside. So instead of a list, this site has an [interactive map](/#homelab).

## One data file, two layouts

Everything on the map comes from a single object in `site.ts`: the hosts, the VMs on each host, the services in each VM, and a list of traffic flows. Nothing is positioned by hand.

At build time, Astro turns that data into two SVG diagrams:

- a **wide** layout for desktop, with the nodes side by side under a shared network bus, and
- a **tall** layout for phones, with the nodes stacked and a trunk line down the right edge.

CSS shows whichever one fits the screen. Because both are generated from the same data, adding a service is a one-line change and both diagrams update.

## Routing the traffic traces

Each flow is just a list of box ids, like `['seerr', 'radarr', 'prowlarr', 'sabnzbd', 'truenas-scale', 'bazarr', 'jellyfin']`. The build turns each hop into an orthogonal path:

- every VM has a narrow **gutter** down its right side that traffic travels along, so lines never cross a service's label;
- hops between VMs on the same host use a lane above the VMs;
- everything else rides the bus (desktop) or the trunk (phones).

The finished path and the distance to each stop are written into the page, so the browser only has to animate a dot along a path it already has, lighting up each box as the dot reaches it.

## Small details that took the most time

- **The info panel never changes size.** Every description is rendered invisibly in the same spot, so the panel is always as tall as the longest one, at any screen width. Hovering from box to box doesn't make the page jump.
- **No flicker between services.** Each service has an invisible hit area that covers half of the gap to its neighbours, so sweeping the mouse down a column never falls through to the VM behind.
- **Taps pin the info open**, since phones have no hover, and the traces respect reduced-motion settings.
