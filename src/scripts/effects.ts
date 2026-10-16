// Full-screen easter-egg effects triggered from the terminal.

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const prefersReducedMotion = () =>
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Falling green code until the visitor presses a key or clicks. */
export function matrixRain(): Promise<void> {
	return new Promise((resolve) => {
		const canvas = document.createElement('canvas');
		canvas.className = 'fx-overlay';
		const hint = document.createElement('p');
		hint.className = 'fx-hint';
		hint.textContent = 'press any key or click to exit';
		document.body.append(canvas, hint);

		const ctx = canvas.getContext('2d')!;
		const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789$#{}<>/'.split('');
		const size = 16;
		let drops: number[] = [];

		function resize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => -Math.floor(Math.random() * 40));
		}

		let frame = 0;
		let last = 0;
		function draw(time: number) {
			frame = requestAnimationFrame(draw);
			if (time - last < 50) return;
			last = time;
			// translucent fill leaves fading trails behind each drop
			ctx.fillStyle = 'rgb(13 17 23 / 0.12)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.font = `${size}px 'JetBrains Mono', monospace`;
			drops.forEach((y, i) => {
				ctx.fillStyle = Math.random() > 0.97 ? '#d2ffd8' : '#3fb950';
				ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * size, y * size);
				drops[i] = y * size > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
			});
		}

		function stop(event: Event) {
			event.preventDefault();
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', resize);
			window.removeEventListener('keydown', stop, true);
			window.removeEventListener('pointerdown', stop, true);
			canvas.remove();
			hint.remove();
			resolve();
		}

		resize();
		window.addEventListener('resize', resize);
		frame = requestAnimationFrame(draw);
		// arm the exit a moment later so the Enter that launched it doesn't close it
		setTimeout(() => {
			window.addEventListener('keydown', stop, true);
			window.addEventListener('pointerdown', stop, true);
		}, 400);
	});
}

/** `sudo rm -rf /`: the page falls apart, kernel panics, then reboots. */
export async function nukeSite(): Promise<void> {
	const pieces = [...document.querySelectorAll<HTMLElement>('header, main section, footer')];
	const root = document.documentElement;
	root.style.overflow = 'hidden';

	if (!prefersReducedMotion()) {
		pieces.forEach((el, i) => {
			const delay = i * 0.12 + Math.random() * 0.25;
			const spin = (Math.random() - 0.5) * 50;
			el.style.transition = `transform 1.6s cubic-bezier(0.55, 0, 1, 0.45) ${delay}s, opacity 1.6s ${delay}s`;
			el.style.transform = `translateY(150vh) rotate(${spin}deg)`;
			el.style.opacity = '0.6';
		});
		await sleep(2600);
	}

	const panic = document.createElement('pre');
	panic.className = 'fx-overlay fx-panic';
	document.body.append(panic);

	const lines = [
		'[    4.201337] Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000009',
		'[    4.201338] CPU: 0 PID: 1 Comm: portfolio Not tainted 6.9.0-robby',
		'[    4.201339] Call Trace:',
		'[    4.201340]  rm_rf_root+0x2a/0x40',
		'[    4.201341]  bad_decisions+0x1f/0x1f',
		'[    4.201342] ---[ end Kernel panic - not syncing ]---',
		'',
	];
	for (const line of lines) {
		panic.textContent += line + '\n';
		await sleep(180);
	}
	for (let n = 3; n > 0; n--) {
		panic.textContent += `Rebooting in ${n}...\n`;
		await sleep(700);
	}

	// put everything back while the panic screen covers the page
	pieces.forEach((el) => {
		el.style.transition = 'none';
		el.style.transform = '';
		el.style.opacity = '';
	});
	window.scrollTo({ top: 0 });
	root.style.overflow = '';
	await sleep(50);
	pieces.forEach((el) => (el.style.transition = ''));

	panic.style.opacity = '0';
	await sleep(400);
	panic.remove();
}
