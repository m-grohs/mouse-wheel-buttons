const defaultSettings = {
	theme: 'dark',
	visibilityDistance: 100,
	scrollAmount: 90,
	bubbleSize: 50,
	enabled: true
};

const elements = {
	themeToggle: null,
	themeIcon: null,
	enabledCheckbox: null,
	visibilityDistance: null,
	scrollAmount: null,
	bubbleSize: null,
	saveBtn: null
};

function updateThemeUI(theme) {
	elements.themeIcon.src = theme === 'dark' ? '../img/sun.svg' : '../img/moon.svg';
	document.body.className = theme;
}

function getCurrentSettings() {
	return {
		enabled: elements.enabledCheckbox.checked,
		visibilityDistance: Number(elements.visibilityDistance.value),
		scrollAmount: Number(elements.scrollAmount.value),
		bubbleSize: Number(elements.bubbleSize.value),
		theme: document.body.className === 'dark' ? 'dark' : 'light'
	};
}

function settingsChanged(oldSettings, newSettings) {
	return Object.keys(oldSettings).some((key) => oldSettings[key] !== newSettings[key]);
}

function loadSettings() {
	chrome.storage.local.get(defaultSettings).then((stored) => {
		const theme = stored.theme === 'dark' ? 'dark' : 'light';

		elements.enabledCheckbox.checked = stored.enabled;
		elements.visibilityDistance.value = stored.visibilityDistance;
		elements.scrollAmount.value = stored.scrollAmount;
		elements.bubbleSize.value = stored.bubbleSize;

		updateThemeUI(theme);
		elements.saveBtn.disabled = true;
	});
}

function setupElements() {
	elements.themeToggle = document.getElementById('themeToggle');
	elements.themeIcon = document.getElementById('themeIcon');
	elements.enabledCheckbox = document.getElementById('enabled');
	elements.visibilityDistance = document.getElementById('visibilityDistance');
	elements.scrollAmount = document.getElementById('scrollAmount');
	elements.bubbleSize = document.getElementById('bubbleSize');
	elements.saveBtn = document.getElementById('saveBtn');

	let savedSettings = { ...defaultSettings };

	// Load and apply initial settings
	chrome.storage.local.get(defaultSettings).then((stored) => {
		savedSettings = { ...stored };

		const theme = savedSettings.theme === 'dark' ? 'dark' : 'light';
		updateThemeUI(theme);

		elements.enabledCheckbox.checked = savedSettings.enabled;
		elements.visibilityDistance.value = savedSettings.visibilityDistance;
		elements.scrollAmount.value = savedSettings.scrollAmount;
		elements.bubbleSize.value = savedSettings.bubbleSize;

		elements.saveBtn.disabled = true;
	});

	// Handle theme toggle
	elements.themeToggle.addEventListener('click', () => {
		const newTheme = document.body.className === 'dark' ? 'light' : 'dark';
		updateThemeUI(newTheme);
		checkChanges();
	});

	// Watch for input changes
	[elements.enabledCheckbox, elements.visibilityDistance, elements.scrollAmount, elements.bubbleSize].forEach((el) =>
		el.addEventListener('input', checkChanges)
	);

	function checkChanges() {
		const current = getCurrentSettings();
		elements.saveBtn.disabled = !settingsChanged(savedSettings, current);
	}

	// Save settings
	elements.saveBtn.addEventListener('click', () => {
		const newSettings = getCurrentSettings();
		chrome.storage.local.set(newSettings).then(() => {
			Object.assign(savedSettings, newSettings);
			elements.saveBtn.disabled = true;

			// Animate save
			elements.saveBtn.classList.add('saving');
			setTimeout(() => {
				elements.saveBtn.classList.remove('saving');
			}, 800);

			// Notify content script (if needed)
			chrome.runtime.sendMessage({ type: 'settings-updated', settings: newSettings });
		});
	});
}

document.addEventListener('DOMContentLoaded', () => {
	setupElements();
	loadSettings();
});
