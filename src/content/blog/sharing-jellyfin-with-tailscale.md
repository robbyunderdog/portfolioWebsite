---
title: Sharing Jellyfin with friends without opening a port
description: How friends outside the house stream from my media server while reaching nothing else on my network.
date: 2026-10-12
tags: [homelab, networking, security, media]
---

I wanted friends outside the house to be able to watch things from my Jellyfin server and request new movies and shows. The usual way to do that is to forward a port on the router and expose Jellyfin to the internet. I didn't want to do that: anything listening on a public port gets scanned constantly, and one vulnerable service would be a door into the whole network.

## Tailscale on one VM only

Instead, the media VM runs Tailscale. Friends install Tailscale on their own devices and join my tailnet, which gives them a private, encrypted connection that doesn't need any open ports on my router.

The key decision is that **only the media VM is on the tailnet**. The main server, the TrueNAS VM, the apps VM with my bots and documents, and the rest of the house aren't on it at all. A friend connecting through Tailscale can reach Jellyfin and Seerr, and nothing else, because nothing else is there to reach.

## What friends can do

- **Jellyfin** streams movies and shows straight off the TrueNAS pool.
- **Seerr** is a clean request page. Someone asks for a movie or show, and the rest happens automatically.

## What happens after a request

The media VM runs an automated pipeline behind Seerr:

1. **Radarr** (movies) or **Sonarr** (TV) picks up the request.
2. **Prowlarr** searches every indexer, which it keeps in sync for both.
3. **SABnzbd** downloads the release from Usenet, which I chose over torrents, and unpacks it onto the TrueNAS pool.
4. **Bazarr** fetches subtitles to match.
5. It shows up in **Jellyfin**, ready to watch.

You can watch both paths on the [homelab map](/#homelab): the **streaming on the go** trace follows a friend's stream through Tailscale, and the **media request** trace follows a request from Seerr to Jellyfin.
