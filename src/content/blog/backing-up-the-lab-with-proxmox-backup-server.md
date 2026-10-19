---
title: Backing up the lab with Proxmox Backup Server
description: Daily backups of every VM in the cluster, kept on the Mac mini so a disaster on the main server doesn't take the backups with it.
date: 2026-10-19
tags: [homelab, proxmox, backups]
---

The TrueNAS pool can lose a drive and keep going, but redundancy isn't a backup. RAIDZ1 doesn't help if a VM gets corrupted, an upgrade goes wrong, or I delete something I shouldn't have. So the newest VM in the cluster is **Proxmox Backup Server**, and its only job is making sure I can get every other VM back.

## Where it lives

It runs on the Mac mini, next to the network VM, for the same reason [DNS lives there](/blog/dns-on-a-free-mac-mini): the main server hosts almost everything, so the things I'd need during a failure shouldn't depend on it.

The backups are stored on a 400 GB local disk in the Mac mini, not on the TrueNAS pool. If the main server goes down, taking TrueNAS with it, the backups are still sitting on a separate machine, ready to restore from.

## What gets backed up

Every VM in the cluster is backed up except the backup server itself:

- the **network** VM on the Mac mini,
- **TrueNAS SCALE**, **apps**, and **media** on the main server, and
- **games** on the game server.

Backing up the backup server to itself wouldn't protect anything, since losing that disk would lose the copy too.

For TrueNAS, only the VM's boot disk is backed up, not the 8-drive pool. The pool holds terabytes of data, far more than a 400 GB disk could hold, and RAIDZ1 already covers a single drive failure. What the backup protects is the TrueNAS install and its configuration, so if the VM itself breaks, I can restore it and reattach the pool instead of setting TrueNAS up again from scratch.

## How long backups are kept

The job runs once a day, and old backups are pruned on a schedule:

- **7 daily** backups, covering the last week,
- **4 weekly** backups, covering the last month, and
- **6 monthly** backups, going back half a year.

That's 17 restore points per VM at most. Recent mistakes can be undone almost to the day, and if a problem goes unnoticed for weeks, there's still an older copy from before it started.

## If something catastrophic happens

The point of all this is recovery. If a VM breaks badly, or a whole node has to be rebuilt, I can restore that VM from Proxmox Backup Server and get it running again, instead of rebuilding it from scratch.

You can watch the daily job sweep across the cluster with the **daily backup** trace on the [homelab map](/#homelab).
