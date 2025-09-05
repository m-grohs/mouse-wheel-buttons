const defaultSettings = {
	theme: 'system',
	visibilityDistance: 100,
	scrollAmount: 90,
	bubbleSize: 50,
	enabled: true
};

let settings = { ...defaultSettings };
let bubbles = [];

function init() {
	chrome.storage.local.get().then((stored) => {
		const updated = { ...defaultSettings, ...stored };
		chrome.storage.local.set(updated);
		settings = updated;

		if (settings.enabled) {
			applyTheme(settings.theme);
			createScrollBubbles();
		}
	});
}

function applyTheme(theme) {
	let resolvedTheme = theme;
	if (theme === 'system') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		resolvedTheme = prefersDark ? 'dark' : 'light';
	}
	document.documentElement.setAttribute('data-extension-theme', resolvedTheme);
}

function createScrollBubbles() {
	removeScrollBubbles();

	const upBtn = createBubble('up');
	const downBtn = createBubble('down');

	bubbles = [upBtn, downBtn];

	document.body.appendChild(upBtn);
	document.body.appendChild(downBtn);

	document.addEventListener('mousemove', onMouseMove);
}

function removeScrollBubbles() {
	bubbles.forEach((b) => b.remove());
	bubbles = [];
	document.removeEventListener('mousemove', onMouseMove);
}

function onMouseMove(e) {
	bubbles.forEach((btn) => {
		const rect = btn.getBoundingClientRect();
		const dx = Math.abs(e.clientX - rect.left);
		const dy = Math.abs(e.clientY - (rect.top + rect.height / 2));
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < settings.visibilityDistance) {
			btn.style.opacity = '1';
			btn.style.pointerEvents = 'auto';
		} else {
			btn.style.opacity = '0';
			btn.style.pointerEvents = 'none';
		}
	});
}

function createBubble(direction) {
	const bubble = document.createElement('div');
	bubble.className = 'scroll-bubble';
	bubble.style.width = bubble.style.height = `${settings.bubbleSize}px`;
	bubble.style.top = direction === 'up' ? '45%' : '55%';
	bubble.style.right = '2%';
	bubble.style.zIndex = '99';
	bubble.style.position = 'fixed';
	bubble.style.opacity = '0';
	bubble.style.pointerEvents = 'none';
	bubble.style.transition = 'opacity 0.3s ease';

	const svg = createArrowSvg(direction);
	bubble.appendChild(svg);

	bubble.addEventListener('click', () => {
		const scrollY = (settings.scrollAmount / 100) * window.innerHeight;
		window.scrollBy({
			top: direction === 'up' ? -scrollY : scrollY,
			behavior: 'smooth'
		});
	});

	return bubble;
}

function createArrowSvg(direction) {
	const svgNS = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNS, 'svg');
	svg.setAttribute('width', '50%');
	svg.setAttribute('height', '50%');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('fill', 'none');
	svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '2');
	svg.setAttribute('stroke-linecap', 'round');
	svg.setAttribute('stroke-linejoin', 'round');

	const path = document.createElementNS(svgNS, 'path');
	path.setAttribute('d', direction === 'up' ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6');
	svg.appendChild(path);
	return svg;
}

// ✅ Listen for changes from popup
chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== 'local') return;

	let recreate = false;

	for (const key in changes) {
		const { newValue } = changes[key];
		settings[key] = newValue;

		switch (key) {
			case 'theme':
				applyTheme(newValue);
				break;
			case 'enabled':
				if (newValue) {
					createScrollBubbles();
				} else {
					removeScrollBubbles();
				}
				break;
			case 'bubbleSize':
			case 'scrollAmount':
			case 'visibilityDistance':
				recreate = true;
				break;
		}
	}

	if (settings.enabled && recreate) {
		createScrollBubbles();
	}
});

init();
