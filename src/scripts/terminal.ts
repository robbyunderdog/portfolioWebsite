// The interactive terminal in the hero. Its "filesystem" is built from
// src/data/site.ts, so it always matches the rest of the page.

import { contact, experience, fetchInfo, profile, projects, skills } from '../data/site';
import { matrixRain, nukeSite, prefersReducedMotion } from './effects';

type Part = string | { text: string; cls?: string; href?: string; run?: string };
type Line = Part[];
type FileNode = { kind: 'file'; lines: () => Line[] };
type DirNode = { kind: 'dir'; children: Record<string, FsNode> };
type FsNode = FileNode | DirNode;
type Command = { desc?: string; run: (args: string[]) => void | Promise<void> };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const file = (lines: () => Line[]): FileNode => ({ kind: 'file', lines });
const joinParts = (parts: Part[], sep: Part): Part[] => parts.flatMap((p, i) => (i ? [sep, p] : [p]));

// Deterministic fake commit hash so `git log` looks the part.
function fakeHash(s: string) {
	let h = 0x811c9dc5;
	for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
	return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

const sections = ['about', 'projects', 'homelab', 'experience', 'contact'];

const fs: DirNode = {
	kind: 'dir',
	children: {
		'about.md': file(() => profile.about.flatMap((p, i) => (i ? [[], [p]] : [[p]]))),
		'skills.json': file(() => {
			const groups = Object.entries(skills);
			return [
				['{'],
				...groups.map(([group, items], i): Line => [
					'  ',
					{ text: `"${group}"`, cls: 'key' },
					': [',
					...joinParts(items.map((item) => ({ text: `"${item}"`, cls: 'str' })), ', '),
					i < groups.length - 1 ? '],' : ']',
				]),
				['}'],
			];
		}),
		'experience.log': file(() =>
			experience.flatMap((item, i): Line[] => [
				[{ text: `commit ${fakeHash(item.org + item.role)}`, cls: 'warn' }, i === 0 ? ' (HEAD -> main)' : ''],
				[{ text: 'Date:   ', cls: 'muted' }, item.period],
				[],
				[`    ${item.role} @ ${item.org}`],
				...item.points.map((point): Line => [`    - ${point}`]),
				...(i < experience.length - 1 ? [[]] : []),
			]),
		),
		'contact.txt': file(() =>
			contact.map((c): Line => [{ text: c.label.padEnd(10), cls: 'accent' }, { text: c.value, href: c.url }]),
		),
		projects: {
			kind: 'dir',
			children: Object.fromEntries(
				projects.map((p) => [
					`${slug(p.name)}.md`,
					file(() => [
						[{ text: `# ${p.name}`, cls: 'accent' }],
						[],
						[p.description],
						[],
						[{ text: 'stack:  ', cls: 'muted' }, p.tech.join(', ')],
						...(p.url ? [[{ text: 'source: ', cls: 'muted' }, { text: p.url, href: p.url }]] : []),
					]),
				]),
			),
		},
	},
};

const openTargets: Record<string, string> = {
	...Object.fromEntries(contact.map((c) => [c.label, c.url])),
	...Object.fromEntries(projects.filter((p) => p.url).map((p) => [slug(p.name), p.url!])),
	...(profile.resumeUrl ? { resume: profile.resumeUrl } : {}),
};

export function initTerminal(root: HTMLElement) {
	const out = root.querySelector<HTMLElement>('.out')!;
	const input = root.querySelector<HTMLInputElement>('input')!;
	const before = root.querySelector<HTMLElement>('.before')!;
	const at = root.querySelector<HTMLElement>('.at')!;
	const after = root.querySelector<HTMLElement>('.after')!;
	const pathEl = root.querySelector<HTMLElement>('.path')!;
	const win = root.closest<HTMLElement>('[data-window]')!;
	const reopen = document.querySelector<HTMLButtonElement>('[data-reopen]')!;

	let cwd: string[] = [];
	const history: string[] = [];
	let historyIndex = 0;
	let draft = '';
	let busy = false;

	const cwdText = () => ['~', ...cwd].join('/');

	// ---- rendering -------------------------------------------------------

	function renderInput() {
		const value = input.value;
		const i = input.selectionStart ?? value.length;
		before.textContent = value.slice(0, i);
		at.textContent = value[i] ?? ' ';
		after.textContent = value.slice(i + 1);
	}

	function setValue(value: string) {
		input.value = value;
		input.setSelectionRange(value.length, value.length);
		renderInput();
	}

	function renderPart(part: Part): Node {
		if (typeof part === 'string') return document.createTextNode(part);
		if (part.href) {
			const a = document.createElement('a');
			a.href = part.href;
			a.textContent = part.text;
			if (part.href.startsWith('http')) {
				a.target = '_blank';
				a.rel = 'noopener';
			}
			return a;
		}
		if (part.run) {
			const cmd = part.run;
			const button = document.createElement('button');
			button.type = 'button';
			button.className = `run ${part.cls ?? ''}`;
			button.textContent = part.text;
			button.addEventListener('click', (event) => {
				event.stopPropagation();
				submit(cmd);
				input.focus({ preventScroll: true });
			});
			return button;
		}
		const span = document.createElement('span');
		span.className = part.cls ?? '';
		span.textContent = part.text;
		return span;
	}

	function print(...lines: Line[]) {
		for (const line of lines) {
			const div = document.createElement('div');
			div.className = 'line';
			if (line.length) line.forEach((part) => div.append(renderPart(part)));
			else div.textContent = ' ';
			out.append(div);
		}
		out.scrollTop = out.scrollHeight;
	}

	const echo = (text: string) =>
		print([{ text: `${profile.handle}@portfolio`, cls: 'user' }, ':', { text: cwdText(), cls: 'path' }, '$ ', text]);

	// ---- filesystem ------------------------------------------------------

	function resolve(path: string): { node: FsNode | null; segs: string[] } {
		const absolute = path.startsWith('~') || path.startsWith('/');
		const segs = absolute ? [] : [...cwd];
		const rest = path.replace(/^\/home\/[^/]+\/?/, '').replace(/^~\/?/, '');
		for (const part of rest.split('/')) {
			if (!part || part === '.') continue;
			if (part === '..') segs.pop();
			else segs.push(part);
		}
		let node: FsNode = fs;
		for (const seg of segs) {
			if (node.kind !== 'dir' || !(seg in node.children)) return { node: null, segs };
			node = node.children[seg];
		}
		return { node, segs };
	}

	const catFile = (path: string) => commands.cat.run([path]);

	// ---- window controls -------------------------------------------------

	function closeWindow() {
		win.classList.remove('maximized');
		document.documentElement.classList.remove('terminal-maximized');
		win.classList.add('closing');
		setTimeout(() => {
			win.hidden = true;
			win.classList.remove('closing');
			reopen.hidden = false;
			reopen.focus({ preventScroll: true });
		}, 250);
	}

	function toggleMaximize(force?: boolean) {
		const on = win.classList.toggle('maximized', force);
		win.classList.remove('minimized');
		document.documentElement.classList.toggle('terminal-maximized', on);
		out.scrollTop = out.scrollHeight;
		input.focus({ preventScroll: true });
	}

	reopen.addEventListener('click', () => {
		reopen.hidden = true;
		win.hidden = false;
		print([{ text: 'Session restored.', cls: 'muted' }]);
		input.focus({ preventScroll: true });
	});

	win.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) =>
		button.addEventListener('click', () => {
			const action = button.dataset.action;
			if (action === 'close') closeWindow();
			else if (action === 'minimize') win.classList.toggle('minimized');
			else if (action === 'maximize') toggleMaximize();
		}),
	);

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && win.classList.contains('maximized')) toggleMaximize(false);
	});

	// ---- commands --------------------------------------------------------

	const commands: Record<string, Command> = {
		help: {
			desc: 'list available commands',
			run: () => {
				const visible = Object.entries(commands).filter(([name, c]) => c.desc && !aliases.has(name));
				print(
					['Available commands:'],
					...visible.map(([name, c]): Line => [
						'  ',
						{ text: name, cls: 'cmd', run: name },
						' '.repeat(12 - name.length),
						{ text: c.desc!, cls: 'muted' },
					]),
					[],
					[{ text: 'Tab completes, ↑/↓ browse history. There are also a few hidden commands...', cls: 'muted' }],
				);
			},
		},
		about: { desc: 'who I am', run: () => catFile('~/about.md') },
		projects: { desc: 'things I have built', run: () => commands.ls.run(['~/projects']) },
		skills: { desc: 'what I work with', run: () => catFile('~/skills.json') },
		experience: { desc: 'education & history', run: () => catFile('~/experience.log') },
		contact: { desc: 'how to reach me', run: () => catFile('~/contact.txt') },
		neofetch: {
			desc: 'system info',
			run: () => {
				const title = `${profile.handle}@portfolio`;
				print(
					[{ text: profile.handle, cls: 'accent' }, '@', { text: 'portfolio', cls: 'accent' }],
					[{ text: '-'.repeat(title.length), cls: 'muted' }],
					...fetchInfo.map((row): Line => [
						{ text: row.label, cls: 'key' },
						': ',
						' '.repeat(8 - row.label.length),
						row.value,
					]),
					[],
					Array.from({ length: 7 }, (_, i) => ({ text: '   ', cls: `sw sw${i}` })),
				);
			},
		},
		ls: {
			desc: 'list files',
			run: (args) => {
				const target = args.find((a) => !a.startsWith('-')) ?? '.';
				const { node, segs } = resolve(target);
				if (!node) return print([`ls: cannot access '${target}': No such file or directory`]);
				if (node.kind === 'file') return print([target]);
				const base = ['~', ...segs].join('/');
				const entries = Object.entries(node.children).map(([name, child]): Part =>
					child.kind === 'dir'
						? { text: `${name}/`, cls: 'dir', run: `ls ${base}/${name}` }
						: { text: name, cls: 'file', run: `cat ${base}/${name}` },
				);
				print(joinParts(entries, '  '));
			},
		},
		cd: {
			desc: 'change directory',
			run: (args) => {
				const target = args[0] ?? '~';
				const { node, segs } = resolve(target);
				if (!node) return print([`cd: ${target}: No such file or directory`]);
				if (node.kind === 'file') return print([`cd: ${target}: Not a directory`]);
				cwd = segs;
				pathEl.textContent = cwdText();
			},
		},
		cat: {
			desc: 'print a file',
			run: (args) => {
				if (!args.length) return print(['usage: cat <file>']);
				for (const target of args) {
					const { node } = resolve(target);
					if (!node) print([`cat: ${target}: No such file or directory`]);
					else if (node.kind === 'dir') print([`cat: ${target}: Is a directory`]);
					else print(...node.lines());
				}
			},
		},
		open: {
			desc: 'open a link (e.g. open github)',
			run: (args) => {
				const target = args[0]?.toLowerCase();
				const names = Object.keys(openTargets);
				if (!target) return print(['usage: open <target>'], [{ text: `targets: ${names.join(', ')}`, cls: 'muted' }]);
				const key = names.find((n) => n === target) ?? names.find((n) => n.startsWith(target));
				if (!key) {
					const known = projects.some((p) => slug(p.name).startsWith(target));
					return print([known ? `open: ${target}: no public link for this one` : `open: ${target}: unknown target`]);
				}
				const url = openTargets[key];
				print([`Opening ${url} ...`]);
				if (url.startsWith('mailto:')) window.location.href = url;
				else window.open(url, '_blank', 'noopener');
			},
		},
		goto: {
			desc: 'scroll to a section',
			run: (args) => {
				const id = args[0]?.toLowerCase();
				if (!id || !sections.includes(id)) return print([`usage: goto <${sections.join('|')}>`]);
				if (win.classList.contains('maximized')) toggleMaximize(false);
				document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
			},
		},
		map: { desc: 'explore my homelab', run: () => commands.goto.run(['homelab']) },
		clear: { desc: 'clear the screen', run: () => out.replaceChildren() },
		exit: { desc: 'close the terminal', run: closeWindow },

		// hidden extras
		whoami: { run: () => print([{ text: profile.name, cls: 'accent' }], [profile.tagline]) },
		pwd: { run: () => print([['/home', profile.handle, ...cwd].join('/')]) },
		echo: { run: (args) => print([args.join(' ')]) },
		date: { run: () => print([new Date().toString()]) },
		history: {
			run: () => print(...history.map((h, i): Line => [{ text: String(i + 1).padStart(4), cls: 'muted' }, `  ${h}`])),
		},
		git: {
			run: (args) =>
				args[0] === 'log' ? catFile('~/experience.log') : print([`git: '${args[0] ?? ''}' is not available here. Try 'git log'.`]),
		},
		sudo: {
			run: async (args) => {
				const rest = args.join(' ');
				if (/^rm\s+(-\w*r\w*f\w*|-\w*f\w*r\w*)\s+(--no-preserve-root\s+)?\/\*?$/.test(rest)) {
					print([{ text: 'Removing / ...', cls: 'err' }]);
					await sleep(600);
					await nukeSite();
					out.replaceChildren();
					print([{ text: 'System restored from backup. Please never do that again.', cls: 'accent' }]);
				} else if (!rest) {
					print(['usage: sudo <command>']);
				} else {
					print([`[sudo] password for visitor: `]);
					await sleep(900);
					print([`visitor is not in the sudoers file. This incident will be reported.`]);
				}
			},
		},
		rm: {
			run: (args) => {
				const target = args.filter((a) => !a.startsWith('-')).at(-1);
				if (!target) return print(['rm: missing operand']);
				if (target === '/' || target === '/*') {
					return print(["rm: it is dangerous to operate recursively on '/'"], ['rm: use sudo if you really mean it']);
				}
				print([`rm: cannot remove '${target}': Permission denied`]);
			},
		},
		matrix: {
			run: async () => {
				if (prefersReducedMotion()) return print(['matrix: disabled because your system prefers reduced motion']);
				await matrixRain();
				print([{ text: 'Wake up, Neo...', cls: 'accent' }]);
			},
		},
		ssh: {
			run: async (args) => {
				const host = args.find((a) => !a.startsWith('-'));
				if (!host) return print(['usage: ssh <host>']);
				if (!/homelab|proxmox|pve/i.test(host)) {
					await sleep(1200);
					return print([`ssh: connect to host ${host} port 22: Connection timed out`]);
				}
				const steps: [number, Line][] = [
					[300, [`Connecting to ${host}...`]],
					[700, ['Offering public key: visitor@portfolio']],
					[900, [{ text: 'Permission denied (publickey).', cls: 'err' }]],
					[500, []],
					[300, [{ text: 'Nice try. The homelab stays private, but you can explore a map of it: ', cls: 'muted' }, { text: 'map', run: 'map' }]],
				];
				for (const [ms, line] of steps) {
					await sleep(ms);
					print(line);
				}
			},
		},
		vim: { run: () => print(["You'd never make it out alive. Editors are disabled for your safety."]) },
		hello: { run: () => print(['Hey there! Thanks for stopping by.']) },
	};

	const aliasMap: Record<string, string> = {
		ll: 'ls',
		dir: 'ls',
		cls: 'clear',
		man: 'help',
		vi: 'vim',
		nano: 'vim',
		emacs: 'vim',
		hi: 'hello',
		logout: 'exit',
	};
	const aliases = new Set(Object.keys(aliasMap));
	for (const [alias, target] of Object.entries(aliasMap)) commands[alias] = commands[target];

	async function submit(raw: string) {
		if (busy) return;
		echo(raw);
		setValue('');
		const line = raw.trim();
		if (!line) return;
		if (history.at(-1) !== line) history.push(line);
		historyIndex = history.length;
		draft = '';

		const [name, ...args] = line.split(/\s+/);
		const command = commands[name.toLowerCase()];
		busy = true;
		root.classList.add('busy');
		try {
			if (command) await command.run(args);
			else print([`${name}: command not found. Type `, { text: 'help', run: 'help' }, ' to see what works.']);
		} finally {
			busy = false;
			root.classList.remove('busy');
			out.scrollTop = out.scrollHeight;
			if (document.activeElement === input) {
				input.parentElement!.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}

	// ---- tab completion --------------------------------------------------

	function complete() {
		const value = input.value;
		const tokens = value.split(/\s+/);
		const last = tokens.at(-1) ?? '';
		let options: string[];

		if (tokens.length === 1) {
			options = Object.keys(commands).filter((n) => commands[n].desc && !aliases.has(n));
		} else if (tokens[0] === 'open') {
			options = Object.keys(openTargets);
		} else if (tokens[0] === 'goto') {
			options = sections;
		} else {
			const slash = last.lastIndexOf('/');
			const dir = slash >= 0 ? last.slice(0, slash + 1) : '';
			const { node } = resolve(dir || '.');
			options =
				node?.kind === 'dir'
					? Object.entries(node.children).map(([n, c]) => dir + n + (c.kind === 'dir' ? '/' : ''))
					: [];
		}

		const matches = options.filter((o) => o.startsWith(last));
		if (!matches.length) return;
		if (matches.length === 1) {
			tokens[tokens.length - 1] = matches[0] + (matches[0].endsWith('/') ? '' : ' ');
			return setValue(tokens.join(' '));
		}
		let prefix = matches[0];
		for (const m of matches) while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
		if (prefix.length > last.length) {
			tokens[tokens.length - 1] = prefix;
			return setValue(tokens.join(' '));
		}
		echo(value);
		print([matches.join('  ')]);
	}

	// ---- input handling --------------------------------------------------

	input.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			submit(input.value);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (historyIndex === history.length) draft = input.value;
			if (historyIndex > 0) setValue(history[--historyIndex]);
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (historyIndex < history.length) {
				historyIndex++;
				setValue(historyIndex === history.length ? draft : history[historyIndex]);
			}
		} else if (event.key === 'Tab' && input.value) {
			// only trap Tab mid-command, so keyboard users can still tab past the terminal
			event.preventDefault();
			complete();
		} else if (event.ctrlKey && event.key === 'l') {
			event.preventDefault();
			out.replaceChildren();
		} else if (event.ctrlKey && event.key === 'c' && input.selectionStart === input.selectionEnd) {
			event.preventDefault();
			echo(input.value + '^C');
			setValue('');
		}
		requestAnimationFrame(renderInput);
	});

	input.addEventListener('input', renderInput);
	input.addEventListener('focus', () => root.classList.add('focused'));
	input.addEventListener('blur', () => root.classList.remove('focused'));
	// the real input is invisible, so keep its caret at the end where ours is drawn
	input.addEventListener('click', () => setValue(input.value));

	root.addEventListener('click', () => {
		if (!window.getSelection()?.toString()) input.focus({ preventScroll: true });
	});

	print([
		'Type a command, or click one: ',
		...joinParts(
			['help', 'about', 'projects', 'neofetch'].map((c) => ({ text: c, run: c })),
			'  ',
		),
	]);
	renderInput();
}
