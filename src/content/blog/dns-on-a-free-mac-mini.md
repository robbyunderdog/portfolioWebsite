---
title: Why my DNS runs on a free Mac mini
description: The main server does almost everything, so the services everything else depends on live somewhere else.
date: 2026-10-14
tags: [homelab, networking, dns]
---

Most of my homelab runs on one machine: an AMD EPYC 7551P with 32 cores and 64 GB of RAM. It hosts the TrueNAS SCALE VM with the storage pool, the media stack, my Discord bots, and the rest of my everyday tools. That's a lot of eggs in one basket, and it raised an obvious question: what happens to everything else when that basket goes down?

## The problem with putting DNS on the big server

The lab runs two services that everything else leans on:

- **AdGuard Home**, which blocks ads and trackers and gives every service a friendly `.home` name.
- **Nginx Proxy Manager**, the reverse proxy that turns those names into the right IP and port.

If those lived on the main server, every reboot, upgrade, or hardware problem there would also break name resolution and every `.home` address at the same time. A single maintenance window would turn into "nothing works."

## Moving them to their own node

I had an Intel Mac mini that I got for free, so it became the third node in the Proxmox cluster with one job: run the network VM. That VM is a small Debian install with Docker, running just AdGuard Home and Nginx Proxy Manager.

The important detail is where its disk lives. Every other Docker VM in the lab keeps its files on the TrueNAS share, but the network VM is deliberately kept on the Mac mini's local disk, with no dependency on the NAS. If the main server goes down, taking TrueNAS with it, DNS and the reverse proxy keep working.

## Only my machines use it

The other half of keeping failures small is choosing who depends on the lab at all. Only my own machines point at AdGuard Home. Everyone else in the house stays on the ASUS router's DNS, on purpose. If I break something while experimenting, the worst case is that my own devices lose ad blocking until I fix it, not that the whole house loses the internet.

## What a request looks like now

Opening Paperless by its `.home` name goes:

1. My machine asks AdGuard Home on the Mac mini for the address.
2. AdGuard points the name at Nginx Proxy Manager, on the same node.
3. Nginx Proxy Manager routes the request across the cluster to Paperless on the main server.
4. Paperless pulls the document from the TrueNAS pool.

You can watch this exact path with the **web request** trace on the [homelab map](/#homelab).
