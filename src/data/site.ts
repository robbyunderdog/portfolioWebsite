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
	tools: ['Astro', 'Git', 'Slack', 'Google Apps', 'Word'],
	infra: ['Proxmox', 'Docker', 'TrueNAS SCALE', 'Nginx Proxy Manager', 'AdGuard Home'],
	os: ['Linux', 'macOS', 'Windows'],
	other: ['IT Management', 'Network Design', 'Virtualization'],
};

export const experience = [
	{
		role: 'Computer Science',
		org: 'De Anza College',
		period: '2023 - Present',
		points: [] as string[],
	},
	{
		role: 'Information and Computer Sciences (ICS)',
		org: 'University of Hawaiʻi at Mānoa',
		period: '2021 - 2023',
		points: [] as string[],
	},
];

export const projects = [
	{
		name: 'Octave',
		description:
			'A Discord application that searches, loads, and plays any song in Discord servers. Uses ffmpeg, yt-dlp, and PyNaCl to do it quickly and efficiently.',
		tech: ['Python', 'discord.py', 'ffmpeg'],
		url: 'https://github.com/robbyunderdog/DiscordMusicBotOctave',
	},
	{
		name: 'BigBrother',
		description:
			"A Discord application that scans messages and assigns them a karma value using sentiment analysis, with a SQL database keeping values pinned to each user's ID.",
		tech: ['Python', 'SQL', 'NLP'],
		url: 'https://github.com/robbyunderdog/DiscordKarmaBotBigBrother',
	},
	{
		name: 'Homelab',
		description:
			'A clustered Proxmox setup running VMs and Docker containers for Octave, BigBrother, and other self-hosted apps, backed by TrueNAS storage and AdGuard DNS.',
		tech: ['Proxmox', 'TrueNAS SCALE', 'AdGuard Home', 'Nginx Proxy Manager', 'Docker'],
	},
];

export const contact = [
	{ label: 'email', value: 'rw51380@gmail.com', url: 'mailto:rw51380@gmail.com' },
	{ label: 'github', value: '@robbyunderdog', url: 'https://github.com/robbyunderdog' },
	{ label: 'linkedin', value: '@robertwarner02', url: 'https://www.linkedin.com/in/robertwarner02/' },
];
