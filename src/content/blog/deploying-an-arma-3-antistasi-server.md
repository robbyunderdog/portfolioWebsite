---
title: Deploying an Arma 3 Antistasi server
description: Getting a modded Antistasi Ultimate server running on the game node, with its own address friends can join directly.
date: 2026-10-17
tags: [homelab, gaming, networking, debian]
---

The newest service in the lab is a dedicated Arma 3 server running Antistasi Ultimate, a co-op campaign where a small group of players builds a guerrilla resistance across a whole map. It lives on the games VM, a Debian 13 (trixie) Docker VM on the i7-7700K node, next to the two Minecraft servers. That node was picked for its single-core speed, and Arma is exactly the kind of game that needs it: the server's simulation runs mostly on one thread, so clock speed matters more than core count.

## SteamCMD and the Workshop

Everything comes down through **SteamCMD**, Valve's command-line Steam client. It downloads the dedicated server itself and every Workshop mod the server loads, and it's also how I keep them updated: when a mod author pushes an update, SteamCMD pulls it so the server stays in sync with what players download.

The mod list is Antistasi Ultimate plus a dozen or so content and enhancement mods, mostly audio and visual effects that make firefights sound and look a lot better than vanilla Arma.

## The build that didn't work the first time

The first build failed. The `package-lock.json` had the wrong information in it and didn't match the Debian 13 trixie environment the VM actually runs. I regenerated it against the right trixie version, and the build went through cleanly after that. It's a small thing, but a good reminder that a lockfile is only as good as the environment it was generated in.

## A real address instead of an IP

My home IP can change, so a **dynamic DNS** container on the games VM keeps `arma.robbywarner.com` pointed at the house. Friends type in that name and never need to know or update an IP. The same container handles the records for the Minecraft servers too.

## Why this one has open ports

My [Jellyfin server](/blog/sharing-jellyfin-with-tailscale) is deliberately reachable only over Tailscale, so it's fair to ask why Arma is different. The ports for the game server are forwarded on the router, so friends can join straight from the Arma launcher without installing a VPN or joining my tailnet. For a game where people just want to hop in for a session, that's a much lower bar. The forwarded ports only lead to the game server on the games VM, not to the rest of the lab.

## What's next: headless clients

The server is up and running. The next step is adding **headless clients**: extra Arma instances with no player attached that take over running the AI. Arma can hand enemy groups off to them, which takes that load off the main server thread. That leaves room for more enemies, and smarter ones, without the server slowing down.

You can find the server on the [homelab map](/#homelab) under the game server node.
