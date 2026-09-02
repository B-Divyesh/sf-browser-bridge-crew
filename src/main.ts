import '@fontsource/space-grotesk/600.css';
import './style.css';
import {
  accuracy,
  attemptRepair,
  clearCode,
  createGame,
  enterGlyph,
  formatTime,
  routePower,
  scan,
  setHeading,
  startGame,
  stepGame,
  type GameState,
  type Glyph,
  type ModuleName,
} from './game';
import { clearExpiredRooms, createRoom, loadRoom, saveRoom, type RoomRecord } from './room';

const app = document.querySelector<HTMLDivElement>('#app')!;
const routeAnnouncement = document.createElement('div');
routeAnnouncement.className = 'sr-only';
routeAnnouncement.setAttribute('aria-live', 'polite');
document.body.append(routeAnnouncement);

type Station = 'helm' | 'power' | 'signals' | 'engineering';
type Action =
  | { type: 'scan' }
  | { type: 'heading'; value: number }
  | { type: 'power'; value: ModuleName }
  | { type: 'glyph'; value: Glyph }
  | { type: 'clear' }
  | { type: 'repair' };

const stationNames: Record<Station, string> = {
  helm: 'Helm',
  power: 'Power',
  signals: 'Signals',
  engineering: 'Engineering',
};

const glyphNames: Record<Glyph, string> = { ring: 'Ring', wave: 'Wave', kite: 'Kite' };

function navigate(path: string): void {
  history.pushState({}, '', path);
  renderRoute();
  window.scrollTo(0, 0);
}

document.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-route]');
  if (!link || link.origin !== location.origin) return;
  event.preventDefault();
  navigate(`${link.pathname}${link.search}`);
});
window.addEventListener('popstate', renderRoute);

function icon(name: 'mark' | 'arrow' | 'sound' | 'pause'): string {
  const paths = {
    mark: '<path d="M4 20h16M7 16l3-11 4 8 3-6v9M9 13h7"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    sound: '<path d="M5 10v4h3l4 3V7L8 10H5Zm10-1c1 .8 1.5 1.8 1.5 3S16 14.2 15 15"/>',
    pause: '<path d="M8 6v12m8-12v12"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name]}</svg>`;
}

function header(): string {
  return `<a class="skip-link" href="#main">Skip to main content</a>
    <header class="site-header">
      <a class="wordmark" href="/" data-route aria-label="Bridge Crew home">${icon('mark')}<span>Bridge Crew</span></a>
      <nav aria-label="Main navigation">
        <a href="/demo" data-route>Demo</a>
        <a href="/#how">How it works</a>
        <a href="/privacy" data-route>Privacy</a>
      </nav>
    </header>`;
}

function footer(): string {
  return `<footer class="site-footer">
    <p><strong>Bridge Crew</strong> is a free, 12-minute cooperative browser game.</p>
    <nav aria-label="Footer navigation"><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a><span>Built by Param Factory</span></nav>
    <p class="build">Original generated scene · v1.0.0</p>
  </footer>`;
}

function setPage(title: string, description: string, content: string): void {
  document.title = title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = description;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `https://browser-bridge-crew.sociobot.in${location.pathname}`;
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = title;
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content = description;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')!.content = title;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')!.content = description;
  app.innerHTML = `${header()}${content}${footer()}`;
  routeAnnouncement.textContent = document.querySelector('h1')?.textContent ?? '';
}

function homePage(): void {
  setPage(
    'Bridge Crew — browser spaceship repair game',
    'Run a 12-minute cooperative spaceship repair game with four browser station panels.',
    `<main id="main">
      <section class="hero">
        <div class="hero-scene" role="img" aria-label="A civilian research ship waits for repair beside an orbital window.">
          <picture><source media="(max-width: 700px)" srcset="/assets/orbital-repair-768.webp"><img src="/assets/orbital-repair-1280.webp" width="1280" height="853" alt="" fetchpriority="high"></picture>
          <div class="scene-readout" aria-hidden="true"><span>DOCK 04</span><i></i><span>SHIP STABLE</span></div>
        </div>
        <div class="hero-copy instrument-plate">
          <p class="eyebrow">4–8 players · 12 minutes</p>
          <h1 tabindex="-1">Run a browser-tab spaceship repair game</h1>
          <p class="lede">For teachers and group hosts sharing one display while players control four station panels.</p>
          <div class="hero-actions">
            <a class="button primary" href="/demo" data-route>Try it with sample data ${icon('arrow')}</a>
            <span>Opens a repair already in progress.</span>
          </div>
          <ul class="plain-facts" aria-label="Game facts"><li>Free to play</li><li>No accounts or chat</li><li>Keyboard and touch controls</li></ul>
        </div>
      </section>

      <section class="launch-panel" aria-labelledby="start-heading">
        <div><p class="eyebrow">Start here</p><h2 id="start-heading">Open a room on this browser</h2><p>Project the host tab. Open each station in another tab on the same browser profile.</p></div>
        <div class="launch-actions">
          <button class="button primary" id="create-room">Create a room</button>
          <form id="join-form" novalidate><label for="room-code">Room code</label><div class="join-row"><input id="room-code" name="code" minlength="5" maxlength="5" autocomplete="off" inputmode="text" required><button class="button secondary" type="submit">Join room</button></div><p class="form-error" id="join-error" role="alert"></p></form>
        </div>
      </section>

      <section class="bridge-preview" aria-labelledby="preview-title">
        <div class="section-heading"><p class="eyebrow">Live bridge preview</p><h2 id="preview-title">One fault needs four stations</h2><p>Players say what they see. Every repair needs their answers in order.</p></div>
        ${previewMarkup()}
      </section>

      <section class="how" id="how" aria-labelledby="how-title">
        <div class="section-heading"><p class="eyebrow">How it works</p><h2 id="how-title">Get the crew playing in three steps</h2></div>
        <ol class="steps"><li><span>01</span><div><h3>Create a room</h3><p>Project the bridge and read the five-character room code aloud.</p></div></li><li><span>02</span><div><h3>Open four stations</h3><p>Assign Helm, Power, Signals, and Engineering. Extra players share controls.</p></div></li><li><span>03</span><div><h3>Repair together</h3><p>Call out each clue, align the ship, route power, and enter the repair code.</p></div></li></ol>
      </section>

      <section class="limits" aria-labelledby="limits-title"><div><p class="eyebrow">Privacy and limits</p><h2 id="limits-title">A game, not a student account</h2></div><ul><li>No names, chat, cameras, or recordings.</li><li>Room state stays in this browser and expires after 20 minutes.</li><li>This static v1 connects tabs in one browser profile. It does not yet connect separate devices.</li></ul></section>
    </main>`,
  );

  document.querySelector('#create-room')?.addEventListener('click', () => {
    clearExpiredRooms();
    const room = createRoom(createGame(Math.floor(Math.random() * 90_000) + 10_000));
    navigate(`/room/${room.code}?host=1`);
  });
  document.querySelector<HTMLFormElement>('#join-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>('#room-code')!;
    const code = input.value.trim().toUpperCase();
    const error = document.querySelector<HTMLElement>('#join-error')!;
    if (!/^[A-Z2-9]{5}$/.test(code)) {
      error.textContent = 'Enter the five-character code shown on the host screen.';
      input.focus();
      return;
    }
    if (!loadRoom(code)) {
      error.textContent = 'That room was not found in this browser. Check the code or ask the host to create a new room.';
      input.focus();
      return;
    }
    navigate(`/room/${code}`);
  });
}

function previewMarkup(): string {
  return `<div class="preview-grid" aria-label="Example bridge status">
    <div class="ship-status"><div class="status-top"><span>INTEGRITY</span><strong>76%</strong></div><progress class="integrity-progress" max="100" value="76" aria-label="Example ship integrity: 76 percent"></progress><div class="ship-outline" aria-hidden="true"><svg viewBox="0 0 460 180"><path d="M38 96 92 58l202-21 118 56-118 53-201-20Z"/><path d="m131 62 48-35h84l34 11m-166 86 48 32h84l34-12"/><circle cx="324" cy="92" r="25"/><path d="M88 75h89m-89 38h89"/></svg><span class="module engines">ENG</span><span class="module life">LIFE</span><span class="module nav">NAV</span></div></div>
    <div class="fault-card"><p class="fault-number">FAULT 03</p><h3>Navigation relay</h3><p>Signals must scan the fault before the repair starts.</p><div class="fault-timer"><span>Response window</span><strong>00:34</strong></div></div>
    <div class="station-strip"><span><b>HELM</b> 0°</span><span><b>POWER</b> Waiting</span><span class="ready"><b>SIGNALS</b> Ready</span><span><b>ENGINEERING</b> Locked</span></div>
  </div>`;
}

function legalPage(kind: 'privacy' | 'terms'): void {
  const privacy = kind === 'privacy';
  const heading = privacy ? 'Your game stays in your browser' : 'Use Bridge Crew fairly';
  const title = privacy ? 'Privacy — Bridge Crew' : 'Terms — Bridge Crew';
  setPage(title, privacy ? 'Bridge Crew stores settings and short-lived rooms in your browser.' : 'The terms for using the free Bridge Crew browser game.', `<main id="main" class="text-page"><p class="eyebrow">${privacy ? 'Privacy' : 'Terms'}</p><h1 tabindex="-1">${heading}</h1>${privacy ? `
    <p>Bridge Crew does not ask for names, email addresses, accounts, chat, camera access, or microphone access.</p>
    <h2>What this browser stores</h2><p>The game stores sound, assist, and best-score settings. A room stores its code and current run state for up to 20 minutes. Demo data uses keys that start with <code>demo:</code>.</p>
    <h2>What leaves this browser</h2><p>The static site loads its own pages, art, font, and scripts. It includes no advertising or analytics. Bridge Crew sends no game actions to a server.</p>
    <h2>Clear stored data</h2><p>Use Reset demo inside the demo. You can also clear this site’s storage in your browser settings.</p>` : `
    <p>Bridge Crew is free classroom-safe software. You may use it at school, at home, or in a youth group.</p>
    <h2>Keep play safe</h2><p>Do not use room codes to send personal information. Stop the game if a participant needs a break.</p>
    <h2>No warranty</h2><p>The game is provided as-is under the MIT License. The host is responsible for supervising each session.</p>
    <h2>Changes</h2><p>These terms may change with a future release. This version took effect on 2 September 2026.</p>`}</main>`);
}

function notFoundPage(): void {
  setPage('Page not found — Bridge Crew', 'This Bridge Crew page was not found.', `<main id="main" class="not-found"><div class="lost-signal" aria-hidden="true"><i></i><i></i><i></i></div><p class="eyebrow">Error 404</p><h1 tabindex="-1">This station is not on the bridge</h1><p>The address may be old or incomplete.</p><a class="button primary" href="/" data-route>Return to the bridge</a></main>`);
}

function stationPicker(room: RoomRecord): void {
  setPage('Choose a station — Bridge Crew', 'Choose a Bridge Crew station in this room.', `<main id="main" class="station-pick"><p class="eyebrow">Room ${room.code}</p><h1 tabindex="-1">Choose your station</h1><p>Extra players can open the same station and share its controls.</p><div class="station-choices">${(Object.keys(stationNames) as Station[]).map((key) => `<button class="station-choice" data-station="${key}"><span>${stationNames[key]}</span><small>${stationHelp(key)}</small></button>`).join('')}</div><a href="/" data-route>Leave this room</a></main>`);
  document.querySelectorAll<HTMLButtonElement>('[data-station]').forEach((button) => button.addEventListener('click', () => navigate(`/room/${room.code}?station=${button.dataset.station}`)));
}

function stationHelp(station: Station): string {
  return { helm: 'Align the ship bearing.', power: 'Route power to the damaged module.', signals: 'Reveal the repair clues.', engineering: 'Enter the code and repair.' }[station];
}

function roomPage(code: string, query: URLSearchParams): void {
  const room = loadRoom(code);
  if (!room) {
    setPage('Room not found — Bridge Crew', 'This Bridge Crew room is missing or expired.', `<main id="main" class="text-page"><p class="eyebrow">Room error</p><h1 tabindex="-1">This room is missing or expired</h1><p>Room state expires after 20 minutes. Ask the host to create a new room.</p><a class="button primary" href="/" data-route>Create or join a room</a></main>`);
    return;
  }
  const host = query.get('host') === '1';
  const station = query.get('station') as Station | null;
  if (!host && !station) {
    stationPicker(room);
    return;
  }
  mountGame({ demo: false, room, host, station: host ? null : station });
}

function mountGame(options: { demo: boolean; room?: RoomRecord; host: boolean; station: Station | null }): void {
  const isDemo = options.demo;
  const namespace = isDemo ? 'demo:bridge:' : 'bridge:';
  const savedSettings = JSON.parse(localStorage.getItem(`${namespace}settings`) ?? '{}') as { assist?: boolean; muted?: boolean };
  let state = options.room?.state ?? createGame(57231, savedSettings.assist ?? true);
  if (isDemo) {
    state = startGame(state);
    state = scan(state);
    state.remainingMs = 7 * 60_000 + 48_000;
    state.integrity = 76;
    state.repairs = 3;
    state.score = 342;
  }
  state.assist = savedSettings.assist ?? state.assist;
  state.muted = savedSettings.muted ?? false;
  let selected: Station = options.station ?? 'signals';
  let paused = false;
  let message = isDemo ? 'Sample fault loaded. Signals has the first clue.' : options.host ? 'Room ready. Open station tabs, then start the run.' : `Connected to ${stationNames[selected]}. Wait for the host.`;
  let channel: BroadcastChannel | null = null;
  const isController = isDemo || options.host;
  const roomCode = options.room?.code;

  setPage(isDemo ? 'Demo — Bridge Crew' : `Room ${roomCode} — Bridge Crew`, 'Play a cooperative Bridge Crew spaceship repair run.', `<main id="main" class="game-page">
    ${isDemo ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><div><button class="text-button" id="reset-demo">Reset demo</button><a href="/" class="text-button" id="start-real" data-route>Start for real</a></div></aside>` : ''}
    <section class="game-heading"><div><p class="eyebrow">${isDemo ? 'Sample room Q7K4P' : `Room ${roomCode}`}</p><h1 tabindex="-1">${options.host || isDemo ? 'Keep the research ship running' : `Control the ${stationNames[selected]} station`}</h1></div><div class="game-tools"><button id="sound-toggle" class="icon-button" aria-pressed="${state.muted}">${icon('sound')}<span>${state.muted ? 'Turn sound on' : 'Mute sound'}</span></button><button id="pause-toggle" class="icon-button">${icon('pause')}<span>Pause run</span></button></div></section>
    <div class="connection-state" id="connection-state" role="status"><span class="connection-dot"></span>${navigator.onLine ? message : 'This tab is offline. Reconnect before opening another station.'}</div>
    <section class="game-board" aria-label="Bridge status">
      <div class="overview-panel">
        <div class="run-stats"><div><span>Time</span><strong id="time-value">${formatTime(state.remainingMs)}</strong></div><div><span>Integrity</span><strong id="integrity-value">${state.integrity}%</strong></div><div><span>Repairs</span><strong id="repair-value">${state.repairs}</strong></div><div><span>Score</span><strong id="score-value">${state.score}</strong></div></div>
        <progress class="integrity-progress" id="integrity-bar" max="100" value="${state.integrity}" aria-label="Ship integrity"></progress>
        <div class="window-view"><picture><source media="(max-width:700px)" srcset="/assets/orbital-repair-768.webp"><img src="/assets/orbital-repair-1280.webp" width="1280" height="853" alt="The civilian research ship sits in an orbital repair dock." decoding="async"></picture><div class="fault-overlay"><span>ACTIVE FAULT <b id="fault-id">${String(state.fault.id).padStart(2, '0')}</b></span><strong id="fault-module">${state.fault.revealed ? state.fault.module : 'Scanning required'}</strong><small id="fault-window">${Math.ceil((state.fault.limitMs - state.fault.ageMs) / 1000)} seconds left</small></div></div>
      </div>
      <div class="control-panel">
        ${options.station ? `<p class="station-label">Your station</p>` : `<div class="station-tabs" role="tablist" aria-label="Station panels">${(Object.keys(stationNames) as Station[]).map((key) => `<button role="tab" aria-selected="${selected === key}" data-tab="${key}">${stationNames[key]}</button>`).join('')}</div>`}
        <div id="station-panel"></div>
        <div class="assist-row"><label><input type="checkbox" id="assist-toggle" ${state.assist ? 'checked' : ''}> Assist mode</label><span>No integrity penalty and more response time.</span></div>
      </div>
    </section>
    <div class="game-action-row"><button class="button primary" id="start-run" ${state.phase === 'ready' && isController ? '' : 'hidden'}>Start 12-minute run</button><p id="game-message" role="status">${message}</p></div>
    <dialog id="end-dialog" aria-labelledby="end-title"><div class="dialog-top"><p class="eyebrow">Run complete</p><h2 id="end-title">${state.phase === 'lost' ? 'The ship needs another crew' : 'The ship made it through'}</h2></div><div class="summary-grid"><div><span>Score</span><strong id="end-score">${state.score}</strong></div><div><span>Repairs</span><strong id="end-repairs">${state.repairs}</strong></div><div><span>Accuracy</span><strong id="end-accuracy">${accuracy(state)}%</strong></div><div><span>Seed</span><strong>${state.seed}</strong></div></div><button class="button primary" id="replay-run">Play this seed again</button><a href="/" data-route>Return home</a></dialog>
  </main>`);

  const panel = document.querySelector<HTMLElement>('#station-panel')!;
  let lastPanelSignature = '';
  const renderStation = () => {
    const signature = JSON.stringify([selected, state.phase, state.fault.id, state.fault.revealed, state.heading, state.routed, state.entered]);
    if (signature === lastPanelSignature) return;
    lastPanelSignature = signature;
    panel.innerHTML = stationMarkup(selected, state);
    bindStationControls();
  };

  const dispatch = (action: Action) => {
    if (!isController && channel) {
      channel.postMessage({ kind: 'action', action });
      message = `${stationNames[selected]} sent an update to the host.`;
      updateUi();
      return;
    }
    applyAction(action);
  };

  const applyAction = (action: Action) => {
    const before = state;
    if (action.type === 'scan') state = scan(state);
    if (action.type === 'heading') state = setHeading(state, action.value);
    if (action.type === 'power') state = routePower(state, action.value);
    if (action.type === 'glyph') state = enterGlyph(state, action.value);
    if (action.type === 'clear') state = clearCode(state);
    if (action.type === 'repair') {
      state = attemptRepair(state);
      playTone(state.repairs > before.repairs, state.muted);
      message = state.repairs > before.repairs ? 'Repair complete. A new fault is active.' : state.assist ? 'That repair is not ready. Check every station clue.' : 'Repair failed. Integrity fell by 12 percent. Check every clue.';
    }
    persistAndBroadcast();
    updateUi();
  };

  function bindStationControls(): void {
    panel.querySelector<HTMLButtonElement>('#scan-button')?.addEventListener('click', () => dispatch({ type: 'scan' }));
    panel.querySelectorAll<HTMLButtonElement>('[data-heading]').forEach((button) => button.addEventListener('click', () => dispatch({ type: 'heading', value: Number(button.dataset.heading) })));
    panel.querySelectorAll<HTMLButtonElement>('[data-power]').forEach((button) => button.addEventListener('click', () => dispatch({ type: 'power', value: button.dataset.power as ModuleName })));
    panel.querySelectorAll<HTMLButtonElement>('[data-glyph]').forEach((button) => button.addEventListener('click', () => dispatch({ type: 'glyph', value: button.dataset.glyph as Glyph })));
    panel.querySelector<HTMLButtonElement>('#clear-code')?.addEventListener('click', () => dispatch({ type: 'clear' }));
    panel.querySelector<HTMLButtonElement>('#repair-button')?.addEventListener('click', () => dispatch({ type: 'repair' }));
  }

  function persistAndBroadcast(): void {
    if (!isController || !options.room) return;
    options.room.state = state;
    options.room.expiresAt = Date.now() + 20 * 60_000;
    saveRoom(options.room);
    channel?.postMessage({ kind: 'state', state });
  }

  function updateUi(): void {
    document.querySelector('#time-value')!.textContent = formatTime(state.remainingMs);
    document.querySelector('#integrity-value')!.textContent = `${Math.round(state.integrity)}%`;
    document.querySelector('#repair-value')!.textContent = String(state.repairs);
    document.querySelector('#score-value')!.textContent = String(state.score);
    (document.querySelector('#integrity-bar') as HTMLProgressElement).value = state.integrity;
    document.querySelector('#fault-id')!.textContent = String(state.fault.id).padStart(2, '0');
    document.querySelector('#fault-module')!.textContent = state.fault.revealed ? state.fault.module : 'Scanning required';
    document.querySelector('#fault-window')!.textContent = `${Math.max(0, Math.ceil((state.fault.limitMs - state.fault.ageMs) / 1000))} seconds left`;
    document.querySelector('#game-message')!.textContent = message;
    renderStation();
    if (state.phase === 'won' || state.phase === 'lost') showEnd();
  }

  function showEnd(): void {
    const dialog = document.querySelector<HTMLDialogElement>('#end-dialog')!;
    document.querySelector('#end-title')!.textContent = state.phase === 'lost' ? 'The ship needs another crew' : 'The ship made it through';
    document.querySelector('#end-score')!.textContent = String(state.score);
    document.querySelector('#end-repairs')!.textContent = String(state.repairs);
    document.querySelector('#end-accuracy')!.textContent = `${accuracy(state)}%`;
    const bestKey = `${namespace}best`;
    if (!isDemo) localStorage.setItem(bestKey, String(Math.max(Number(localStorage.getItem(bestKey) ?? 0), state.score)));
    if (!dialog.open) dialog.showModal();
  }

  if (roomCode) {
    channel = new BroadcastChannel(`bridge-room-${roomCode}`);
    routeAbort.signal.addEventListener('abort', () => channel?.close(), { once: true });
    channel.addEventListener('message', (event: MessageEvent) => {
      if (event.data.kind === 'action' && isController) applyAction(event.data.action as Action);
      if (event.data.kind === 'state' && !isController) {
        state = event.data.state as GameState;
        message = 'The host sent the latest bridge state.';
        updateUi();
      }
      if (event.data.kind === 'join' && isController) {
        message = `${event.data.station} station joined the room.`;
        channel?.postMessage({ kind: 'state', state });
        updateUi();
      }
    });
    if (!isController) channel.postMessage({ kind: 'join', station: stationNames[selected] });
  }

  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => button.addEventListener('click', () => {
    selected = button.dataset.tab as Station;
    lastPanelSignature = '';
    document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === button)));
    renderStation();
    panel.focus();
  }));
  document.querySelector('#start-run')?.addEventListener('click', (event) => {
    state = startGame(state);
    (event.currentTarget as HTMLElement).hidden = true;
    message = 'Run started. Signals should scan the active fault.';
    persistAndBroadcast();
    updateUi();
  });
  document.querySelector('#pause-toggle')?.addEventListener('click', (event) => {
    paused = !paused;
    (event.currentTarget as HTMLButtonElement).querySelector('span')!.textContent = paused ? 'Resume run' : 'Pause run';
    message = paused ? 'Run paused.' : 'Run resumed.';
    updateUi();
  });
  document.querySelector('#sound-toggle')?.addEventListener('click', (event) => {
    state.muted = !state.muted;
    const button = event.currentTarget as HTMLButtonElement;
    button.setAttribute('aria-pressed', String(state.muted));
    button.querySelector('span')!.textContent = state.muted ? 'Turn sound on' : 'Mute sound';
    localStorage.setItem(`${namespace}settings`, JSON.stringify({ muted: state.muted, assist: state.assist }));
  });
  document.querySelector<HTMLInputElement>('#assist-toggle')?.addEventListener('change', (event) => {
    state.assist = (event.currentTarget as HTMLInputElement).checked;
    state.fault.limitMs = state.assist ? Math.max(state.fault.limitMs, 60_000) : state.fault.limitMs;
    localStorage.setItem(`${namespace}settings`, JSON.stringify({ muted: state.muted, assist: state.assist }));
    persistAndBroadcast();
  });
  document.querySelector('#reset-demo')?.addEventListener('click', () => {
    Object.keys(localStorage).filter((key) => key.startsWith('demo:')).forEach((key) => localStorage.removeItem(key));
    navigate('/demo');
  });
  document.querySelector('#start-real')?.addEventListener('click', () => {
    Object.keys(localStorage).filter((key) => key.startsWith('demo:')).forEach((key) => localStorage.removeItem(key));
  });
  document.querySelector('#replay-run')?.addEventListener('click', () => {
    state = startGame(createGame(state.seed, state.assist, state.durationMs));
    document.querySelector<HTMLDialogElement>('#end-dialog')!.close();
    message = 'New run started with the same seed.';
    persistAndBroadcast();
    updateUi();
  });

  document.addEventListener('keydown', gameKeys, { signal: routeAbort.signal });
  function gameKeys(event: KeyboardEvent): void {
    if ((event.target as HTMLElement).matches('input, button, a')) return;
    if (event.key === 'ArrowLeft') dispatch({ type: 'heading', value: state.heading - 15 });
    if (event.key === 'ArrowRight') dispatch({ type: 'heading', value: state.heading + 15 });
    if (event.key.toLowerCase() === 's') dispatch({ type: 'scan' });
    if (event.key === '1') dispatch(selected === 'engineering' ? { type: 'glyph', value: 'ring' } : { type: 'power', value: 'engines' });
    if (event.key === '2') dispatch(selected === 'engineering' ? { type: 'glyph', value: 'wave' } : { type: 'power', value: 'life support' });
    if (event.key === '3') dispatch(selected === 'engineering' ? { type: 'glyph', value: 'kite' } : { type: 'power', value: 'navigation' });
    if (event.key.toLowerCase() === 'r') dispatch({ type: 'repair' });
  }

  let previous = performance.now();
  let accumulator = 0;
  const fixedStep = 1000 / 60;
  function frame(now: number): void {
    if (!document.hidden && !paused && isController) {
      const elapsed = Math.min(250, now - previous);
      accumulator += elapsed;
      let changed = false;
      while (accumulator >= fixedStep) {
        state = stepGame(state, fixedStep);
        accumulator -= fixedStep;
        changed = true;
      }
      if (changed && Math.floor(now / 250) !== Math.floor(previous / 250)) {
        persistAndBroadcast();
        updateUi();
      }
    }
    previous = now;
    if (!routeAbort.signal.aborted) requestAnimationFrame(frame);
  }
  renderStation();
  requestAnimationFrame(frame);

  (window as typeof window & { __bridge?: { finish: () => void; state: () => GameState } }).__bridge = {
    finish: () => { state = { ...state, phase: 'won', remainingMs: 0 }; updateUi(); },
    state: () => state,
  };
}

function playTone(success: boolean, muted: boolean): void {
  if (muted) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = success ? 620 : 180;
    gain.gain.setValueAtTime(.04, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .12);
    oscillator.addEventListener('ended', () => context.close());
  } catch { /* Audio feedback is optional when Web Audio is unavailable. */ }
}

function stationMarkup(station: Station, state: GameState): string {
  if (station === 'signals') return `<section class="station-content" aria-labelledby="station-title"><p class="station-number">STATION 03</p><h2 id="station-title">Signals</h2><p>Scan the fault. Read the bearing, module, and code aloud.</p><button class="panel-button scan-button" id="scan-button" ${state.fault.revealed ? 'disabled' : ''}>${state.fault.revealed ? 'Scan complete' : 'Scan active fault'} <kbd>S</kbd></button>${state.fault.revealed ? `<div class="clue-sheet"><div><span>Bearing</span><strong>${state.fault.bearing > 0 ? '+' : ''}${state.fault.bearing}°</strong></div><div><span>Module</span><strong>${state.fault.module}</strong></div><div><span>Code</span><strong>${state.fault.code.map((item) => glyphNames[item]).join(' · ')}</strong></div></div>` : `<div class="clue-empty"><span aria-hidden="true">⌁</span><p>The repair clues will appear here after scanning.</p></div>`}</section>`;
  if (station === 'helm') return `<section class="station-content" aria-labelledby="station-title"><p class="station-number">STATION 01</p><h2 id="station-title">Helm</h2><p>Set the bearing that Signals calls out.</p><div class="heading-readout"><span>Current bearing</span><strong>${state.heading > 0 ? '+' : ''}${state.heading}°</strong></div><div class="bearing-buttons">${[-30, -15, 0, 15, 30].map((value) => `<button data-heading="${value}" aria-pressed="${state.heading === value}">${value > 0 ? '+' : ''}${value}°</button>`).join('')}</div><p class="key-hint">Use Left and Right Arrow keys to adjust.</p></section>`;
  if (station === 'power') return `<section class="station-content" aria-labelledby="station-title"><p class="station-number">STATION 02</p><h2 id="station-title">Power</h2><p>Route power to the module that Signals calls out.</p><div class="power-buttons">${(['engines', 'life support', 'navigation'] as ModuleName[]).map((module, index) => `<button data-power="${module}" aria-pressed="${state.routed === module}"><span>0${index + 1}</span>${module}<kbd>${index + 1}</kbd></button>`).join('')}</div></section>`;
  return `<section class="station-content" aria-labelledby="station-title"><p class="station-number">STATION 04</p><h2 id="station-title">Engineering</h2><p>Enter the three symbols that Signals calls out. Repair after Helm and Power are ready.</p><div class="code-display" aria-label="Entered repair code">${[0, 1, 2].map((index) => `<span>${state.entered[index] ? glyphSymbol(state.entered[index]) : '—'}</span>`).join('')}</div><div class="glyph-buttons">${(['ring', 'wave', 'kite'] as Glyph[]).map((glyph, index) => `<button data-glyph="${glyph}"><span aria-hidden="true">${glyphSymbol(glyph)}</span>${glyphNames[glyph]}<kbd>${index + 1}</kbd></button>`).join('')}</div><div class="repair-actions"><button class="button secondary" id="clear-code">Clear code</button><button class="button primary" id="repair-button">Repair module <kbd>R</kbd></button></div></section>`;
}

function glyphSymbol(glyph: Glyph): string {
  return { ring: '○', wave: '≈', kite: '◇' }[glyph];
}

let routeAbort = new AbortController();
function renderRoute(): void {
  routeAbort.abort();
  routeAbort = new AbortController();
  const path = location.pathname.replace(/\/$/, '') || '/';
  if (path === '/') homePage();
  else if (path === '/demo') mountGame({ demo: true, host: true, station: null });
  else if (path === '/privacy') legalPage('privacy');
  else if (path === '/terms') legalPage('terms');
  else if (path.startsWith('/room/')) roomPage(path.split('/')[2].toUpperCase(), new URLSearchParams(location.search));
  else notFoundPage();
  requestAnimationFrame(() => document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }));
}

window.addEventListener('online', renderRoute);
window.addEventListener('offline', () => {
  const status = document.querySelector('#connection-state');
  if (status) status.textContent = 'This tab is offline. Reconnect before opening another station.';
});
renderRoute();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
