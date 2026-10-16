// Hover info and traffic animation for the homelab map. The diagram itself, including
// every trace path, is rendered at build time by HomelabMap.astro.

type Info = { title: string; meta?: string; desc: string };
type Flow = { title: string; desc: string; steps: string[] };
type MapData = { nodes: Record<string, Info>; flows: Record<string, Flow> };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function initHomelabMap(root: HTMLElement) {
	const data: MapData = JSON.parse(root.querySelector('[data-map-data]')!.textContent!);
	const svgs = [...root.querySelectorAll<SVGSVGElement>('svg.map')];
	const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-play]')];
	const title = root.querySelector<HTMLElement>('.info-live .info-title')!;
	const meta = root.querySelector<HTMLElement>('.info-live .info-meta')!;
	const desc = root.querySelector<HTMLElement>('.info-live .info-desc')!;
	const steps = root.querySelector<HTMLElement>('.info-live .info-steps')!;
	const defaults = { title: title.textContent!, meta: meta.textContent!, desc: desc.textContent! };
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let run = 0; // bumped to cancel whatever animation is playing
	let pinned: string | null = null;
	let focused: string | null = null;

	// only one of the two layouts (wide/tall) is displayed at a time
	const visibleSvg = () => svgs.find((svg) => svg.getBoundingClientRect().width > 0) ?? svgs[0];
	const boxes = (id: string) => svgs.flatMap((svg) => [...svg.querySelectorAll<SVGGElement>(`.node[data-id="${id}"]`)]);

	// ---- info panel ------------------------------------------------------

	function showInfo(info: Info, stepIds: string[] = []) {
		title.textContent = info.title;
		meta.textContent = info.meta ?? '';
		desc.textContent = info.desc;
		steps.replaceChildren();
		stepIds.forEach((id, i) => {
			if (i) steps.append(' → ');
			const span = document.createElement('span');
			span.className = 'step';
			span.textContent = data.nodes[id]?.title ?? id;
			steps.append(span);
		});
	}

	const showDefault = () => showInfo(defaults);

	// ---- highlighting ----------------------------------------------------

	function clearHighlight() {
		for (const svg of svgs) {
			svg.classList.remove('dim');
			svg.querySelectorAll('.lit').forEach((el) => el.classList.remove('lit'));
			svg.querySelectorAll('.trace.on, .packet.on').forEach((el) => el.classList.remove('on'));
		}
		buttons.forEach((b) => b.classList.remove('active'));
	}

	function light(ids: string[]) {
		svgs.forEach((svg) => svg.classList.add('dim'));
		ids.forEach((id) => boxes(id).forEach((el) => el.classList.add('lit')));
	}

	// a box plus what it belongs to and what it contains
	function related(id: string): string[] {
		const el = boxes(id)[0];
		if (!el) return [id];
		const { kind, vm, host } = el.dataset;
		const children = (attr: string) =>
			[...svgs[0].querySelectorAll<SVGGElement>(`.node[data-${attr}="${id}"]`)].map((c) => c.dataset.id!);
		if (kind === 'chip') return [id, vm!, host!];
		if (kind === 'vm') return [id, host!, ...children('vm')];
		if (kind === 'host') return [id, ...children('host')];
		return [id];
	}

	function focusBox(id: string) {
		run++;
		focused = id;
		clearHighlight();
		light(related(id));
		showInfo(data.nodes[id] ?? { title: id, desc: '' });
	}

	// only undo a box highlight, never a trace that is playing
	function unfocus() {
		if (pinned || !focused) return;
		focused = null;
		run++;
		clearHighlight();
		showDefault();
	}

	// ---- traffic traces --------------------------------------------------

	async function play(flowId: string) {
		const me = ++run;
		focused = null;
		const flow = data.flows[flowId];
		clearHighlight();
		buttons.forEach((b) => b.classList.toggle('active', b.dataset.play === flowId));
		showInfo({ title: flow.title, desc: flow.desc }, flow.steps);
		svgs.forEach((svg) => svg.classList.add('dim'));

		const svg = visibleSvg();
		const trace = svg.querySelector<SVGPathElement>(`.trace[data-flow="${flowId}"]`)!;
		const packet = svg.querySelector<SVGCircleElement>('.packet')!;
		const stops: { id: string; at: number }[] = JSON.parse(trace.dataset.stops!);
		const length = trace.getTotalLength();
		const stepEls = [...steps.querySelectorAll('.step')];

		let reached = 0;
		const reach = (distance: number) => {
			while (reached < stops.length && stops[reached].at <= distance + 1) {
				boxes(stops[reached].id).forEach((el) => el.classList.add('lit'));
				stepEls[reached]?.classList.add('on');
				reached++;
			}
		};

		trace.style.strokeDasharray = `${length}`;
		trace.classList.add('on');

		if (reducedMotion) {
			trace.style.strokeDashoffset = '0';
			reach(length);
		} else {
			packet.classList.add('on');
			const duration = Math.max(1600, length / 0.32);
			const start = performance.now();
			await new Promise<void>((resolve) => {
				const frame = (now: number) => {
					if (me !== run) return resolve();
					const t = Math.min(1, (now - start) / duration);
					const distance = easeInOut(t) * length;
					const p = trace.getPointAtLength(distance);
					packet.setAttribute('cx', `${p.x}`);
					packet.setAttribute('cy', `${p.y}`);
					trace.style.strokeDashoffset = `${length - distance}`;
					reach(distance);
					if (t < 1) requestAnimationFrame(frame);
					else resolve();
				};
				requestAnimationFrame(frame);
			});
			if (me !== run) return;
			packet.classList.remove('on');
		}

		// hold the finished trace briefly, then clear it and release the button together
		await sleep(1500);
		if (me !== run) return;
		clearHighlight();
		showDefault();
	}

	// ---- wiring ----------------------------------------------------------

	buttons.forEach((button) =>
		button.addEventListener('click', () => {
			pinned = null;
			play(button.dataset.play!);
		}),
	);

	for (const svg of svgs) {
		svg.querySelectorAll<SVGGElement>('.node').forEach((node) => {
			const id = node.dataset.id!;
			node.addEventListener('pointerenter', () => {
				if (!pinned) focusBox(id);
			});
			node.addEventListener('pointerleave', unfocus);
			node.addEventListener('focus', () => focusBox(id));
			node.addEventListener('blur', unfocus);
			node.addEventListener('click', (event) => {
				// taps pin the info open, since touch screens have no hover
				event.stopPropagation();
				pinned = pinned === id ? null : id;
				if (pinned) focusBox(id);
				else unfocus();
			});
			node.addEventListener('keydown', (event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					node.dispatchEvent(new MouseEvent('click'));
				}
			});
		});
		svg.addEventListener('click', () => {
			if (!pinned) return;
			pinned = null;
			unfocus();
		});
	}
}
