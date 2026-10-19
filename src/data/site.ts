// All of the site's content lives here. Edit this file to update the site.

export const profile = {
	name: 'Robert Warner',
	handle: 'robby',
	tagline: 'Aspiring software engineer with a love for IT engineering.',
	about: [
		"I'm a Computer Science student at De Anza College, after starting out in the Information and Computer Sciences program at the University of Hawaiʻi at Mānoa. I love working on projects involving different aspects of development, even more so when I learn about the different tools available to me.",
		'Outside of class, most of my tinkering happens in my homelab: a Proxmox cluster where I self-host my own projects, like the Discord bots Octave and BigBrother, alongside storage, DNS, and other services. It is where I get hands-on experience with networking, virtualization, and keeping systems running.',
		'While I keep busy with school and work, I am always on the lookout for new project ideas that will really challenge me.',
	],
	// Drop a PDF in public/ and set this to e.g. '/resume.pdf' to show a download link.
	resumeUrl: '',
};

// The neofetch-style info panel in the hero.
export const fetchInfo = [
	{ label: 'School', value: 'De Anza College' },
	{ label: 'Major', value: 'Computer Science' },
	{ label: 'Prev', value: 'UH Mānoa (ICS)' },
	{ label: 'Langs', value: 'C++, Java, Python' },
	{ label: 'OS', value: 'Linux, macOS, Windows' },
];

export const skills = {
	languages: ['C++', 'Java', 'Python', 'SQL', 'HTML/CSS'],
	libraries: ['discord.py', 'asyncpg', 'NLTK', 'yt-dlp', 'ffmpeg'],
	tools: ['Git', 'GitHub', 'PostgreSQL', 'Docker Compose', 'Astro'],
	infra: ['Proxmox', 'Docker', 'TrueNAS SCALE', 'Nginx Proxy Manager', 'AdGuard Home', 'Tailscale'],
	os: ['Linux', 'macOS', 'Windows'],
	other: ['IT Management', 'Network Design', 'Virtualization'],
};

export const education = [
	{
		program: 'Computer Science',
		org: 'De Anza College',
		period: '2023 - Present',
		points: [] as string[],
	},
	{
		program: 'Information and Computer Sciences (ICS)',
		org: 'University of Hawaiʻi at Mānoa',
		period: '2021 - 2023',
		points: [] as string[],
	},
];

// `highlight` is the hardest problem the project solved, shown under the description.
// For a screenshot or GIF, drop it in public/projects/ and set `image: '/projects/octave.gif'`.
export const projects: {
	name: string;
	description: string;
	highlight?: string;
	image?: string;
	tech: string[];
	url?: string;
	anchor?: string;
}[] = [
	{
		name: 'Octave',
		description:
			'A Discord music bot that plays YouTube songs and playlists in voice channels, with a paged queue, looping, and auto-leave, streaming audio through yt-dlp and ffmpeg.',
		highlight:
			"YouTube's stream URLs are signed and expire quickly, so each song is resolved the moment it starts playing rather than when it's queued, preferring direct HTTPS audio over HLS streams ffmpeg can't read reliably.",
		tech: ['Python', 'discord.py', 'yt-dlp', 'ffmpeg', 'Docker'],
		url: 'https://github.com/robbyunderdog/DiscordMusicBotOctave',
	},
	{
		name: 'BigBrother',
		description:
			'A Discord bot that scores every message with VADER sentiment analysis and keeps a per-server karma leaderboard, storing only the scores, never the messages.',
		highlight:
			'Moved from SQLite to Postgres and replaced app-level locking with a single atomic upsert, so messages arriving at the same time never lose a karma update.',
		tech: ['Python', 'discord.py', 'NLTK', 'PostgreSQL', 'Docker'],
		url: 'https://github.com/robbyunderdog/DiscordKarmaBotBigBrother',
	},
	{
		name: 'Urza',
		description:
			'A Discord bot for opening simulated Magic: The Gathering booster packs, building per-server collections, and trading duplicates up to rarer cards.',
		highlight:
			'Every card and set is cached from the Scryfall API into Postgres, so commands never wait on an outside API, and the pack simulator only rolls rarities a set actually printed.',
		tech: ['Python', 'discord.py', 'PostgreSQL', 'Docker'],
		url: 'https://github.com/robbyunderdog/Urza',
	},
	{
		name: 'Homelab',
		description:
			'A three-node Proxmox cluster running my Discord bots, a media server, and game servers, with 16 TB of TrueNAS storage and network services on their own node.',
		tech: ['Proxmox', 'TrueNAS SCALE', 'AdGuard Home', 'Nginx Proxy Manager', 'Docker'],
		anchor: '#homelab',
	},
];

// The interactive homelab map. Hosts are drawn left to right (top to bottom on phones),
// and every service gets its own box. Flows are the animated traffic traces: lists of
// box ids (a service or VM name in lowercase-with-dashes, or 'internet', 'lan', 'remote').
// `storage: true` on a VM or service draws a dashed link to the TrueNAS pool.
// `stack: true` on a host stacks its VMs in one column on desktop, for small VMs.
// `datastore` on a VM draws a single local disk of that size.
export const homelab = {
	hosts: [
		{
			id: 'mini',
			name: 'Mac mini',
			meta: 'Intel · network + backup node',
			stack: true,
			desc: 'An Intel Mac mini I got for free. DNS, the reverse proxy, and backups live here so they keep working when the main server is down.',
			vms: [
				{
					name: 'network',
					os: 'Debian · Docker',
					desc: 'Deliberately kept on local disk with no dependency on the NAS, so it survives the main server going down.',
					services: [
						{ name: 'AdGuard Home', desc: 'DNS with ad and tracker blocking, plus friendly .home names for every service. Only my machines use it, so a lab outage never takes down the rest of the house.' },
						{ name: 'Nginx Proxy Manager', desc: 'Reverse proxy that gives every web UI a friendly .home address instead of an IP and port.' },
					],
				},
				{
					name: 'backup',
					os: 'Proxmox Backup Server',
					desc: "Backs up every other VM in the cluster daily to a 400 GB local disk on the Mac mini, keeping 7 daily, 4 weekly, and 6 monthly backups. TrueNAS is backed up by its boot disk only, not the 8-drive pool. If something catastrophic happens, any VM can be restored from here.",
					datastore: '400 GB',
				},
			],
		},
		{
			id: 'main',
			name: 'Main server',
			meta: 'AMD EPYC 7551P · 32C/64T · 64 GB',
			desc: 'The heavy lifter: a 32-core EPYC with 64 GB of RAM, built to grow into newer EPYC CPUs, 256–512 GB of RAM, SSD caching, and faster networking.',
			vms: [
				{
					name: 'TrueNAS SCALE',
					os: 'storage',
					desc: 'TrueNAS SCALE managing 8 × 2 TB hard drives in a RAIDZ1 pool, shared to the Docker VMs over SMB.',
					pool: { disks: 8, size: '2 TB', layout: 'RAIDZ1' },
				},
				{
					name: 'apps',
					os: 'Debian · Docker',
					desc: 'My own projects and everyday self-hosted tools. All their Docker files live on the TrueNAS share; the bots keep their data in hosted databases, and Paperless keeps its document archive on the pool.',
					storage: true,
					services: [
						{ name: 'Octave', desc: 'My Discord music bot: plays YouTube songs and playlists in voice channels.' },
						{ name: 'BigBrother', desc: 'My Discord karma bot: scores messages with VADER sentiment analysis and keeps the scores in a hosted Postgres database.' },
						{ name: 'Urza', desc: 'My Discord bot for opening simulated Magic: The Gathering packs and building collections. Card data lives in a hosted Postgres database.' },
						{ name: 'Paperless', desc: 'Paperless-ngx: scans, OCRs, and organizes documents into a searchable archive stored on the TrueNAS pool.' },
						{ name: 'Homepage', desc: 'One dashboard for every service in the lab, with live stats from Proxmox and TrueNAS.' },
						{ name: 'Portainer', desc: 'Web UI for managing all the Docker containers: start, stop, and update them, and read their logs without opening an SSH session.' },
					],
				},
				{
					name: 'media',
					os: 'Debian · Docker',
					desc: 'An automated media library I can watch anywhere. The library itself lives on the TrueNAS pool.',
					storage: true,
					services: [
						{ name: 'Jellyfin', desc: 'Self-hosted media server for streaming movies and shows, at home or through Tailscale.' },
						{ name: 'Seerr', desc: 'A clean request page, so family and friends can ask for a movie or show and the rest happens automatically.' },
						{ name: 'Radarr', desc: 'Runs the movie library: picks up requests from Seerr, searches for releases through Prowlarr, hands them to SABnzbd, then renames and files the finished movie on the TrueNAS pool.' },
						{ name: 'Sonarr', desc: "Radarr's counterpart for TV: follows each show, grabs new episodes as they air through Prowlarr and SABnzbd, and files them on the TrueNAS pool for Jellyfin." },
						{ name: 'Prowlarr', desc: "Manages indexers for Radarr and Sonarr in one place: an indexer added here is synced to both, so every search runs against the same sources." },
						{ name: 'Bazarr', desc: 'Watches everything Radarr and Sonarr add and fetches matching subtitles automatically, saving them next to each movie and episode so Jellyfin picks them up.' },
						{ name: 'SABnzbd', desc: 'Downloads from Usenet, which I chose over torrents. Radarr and Sonarr hand it releases, and it downloads, verifies, and unpacks them straight onto the TrueNAS pool.' },
						{ name: 'Tailscale', desc: 'Shares Jellyfin and Seerr with friends. Only this VM is on the tailnet, so remote users can reach nothing else on the network, and no ports are opened.' },
					],
				},
			],
		},
		{
			id: 'game',
			name: 'Game server',
			meta: 'Intel i7-7700K',
			desc: "Picked for its single-core speed, which game servers depend on. Keeping games on their own node means a busy session never competes with the main server's workloads.",
			vms: [
				{
					name: 'games',
					os: 'Debian · Docker',
					desc: 'Dedicated game servers for friends, with their game data stored on the TrueNAS pool.',
					storage: true,
					services: [
						{ name: 'Minecraft (vanilla)', desc: 'A vanilla Minecraft server for friends, running in its own Docker container with the world saved on the TrueNAS pool.' },
						{ name: 'Minecraft (modded)', desc: 'A modded Minecraft server for friends. Mods lean hard on a single CPU core, which is why it runs on the node picked for single-core speed.' },
						{ name: 'Arma 3 Antistasi', desc: "Dedicated server for Arma 3's Antistasi co-op campaign." },
						{ name: 'DDNS', desc: 'Keeps the DNS records for the Minecraft and Arma servers pointed at my home IP whenever it changes, so friends always connect with the same address, like arma.robbywarner.com.' },
					],
				},
			],
		},
	],
	flows: [
		{
			id: 'dns',
			title: 'DNS lookup',
			desc: 'One of my machines asks AdGuard Home for an address: ads and trackers are blocked, .home names point into the lab, and everything else is resolved upstream. The rest of the house stays on the router on purpose.',
			path: ['lan', 'adguard-home', 'internet'],
		},
		{
			id: 'proxy',
			title: 'Web request',
			desc: 'Opening Paperless by its .home name: AdGuard Home points the name at Nginx Proxy Manager, which routes the request across the cluster, and Paperless pulls the file from the TrueNAS pool.',
			path: ['lan', 'adguard-home', 'nginx-proxy-manager', 'paperless', 'truenas-scale'],
		},
		{
			id: 'remote',
			title: 'Streaming on the go',
			desc: 'A friend outside the house connects through Tailscale, which only reaches the media VM, and Jellyfin streams the movie off the TrueNAS pool.',
			path: ['remote', 'internet', 'tailscale', 'jellyfin', 'truenas-scale'],
		},
		{
			id: 'media',
			title: 'Media request',
			desc: 'Someone requests a movie in Seerr. Radarr searches through Prowlarr, SABnzbd downloads it to the TrueNAS pool, Bazarr adds subtitles, and it appears in Jellyfin.',
			path: ['seerr', 'radarr', 'prowlarr', 'sabnzbd', 'truenas-scale', 'bazarr', 'jellyfin'],
		},
		{
			id: 'game',
			title: 'Game session',
			desc: 'Friends connect to the modded Minecraft server, which runs on the node chosen for single-core speed and keeps its data on the TrueNAS pool.',
			path: ['internet', 'lan', 'minecraft-modded', 'truenas-scale'],
		},
		{
			id: 'backup',
			title: 'Daily backup',
			desc: "Once a day, every VM in the cluster except the backup VM itself is backed up to Proxmox Backup Server's 400 GB local disk on the Mac mini. It keeps 7 daily, 4 weekly, and 6 monthly backups.",
			path: ['network', 'truenas-scale', 'apps', 'media', 'games', 'backup'],
		},
	],
};

export const contact = [
	{ label: 'email', value: 'rw51380@gmail.com', url: 'mailto:rw51380@gmail.com' },
	{ label: 'github', value: '@robbyunderdog', url: 'https://github.com/robbyunderdog' },
	{ label: 'linkedin', value: '@robertwarner02', url: 'https://www.linkedin.com/in/robertwarner02/' },
];
