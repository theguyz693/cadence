import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LogOut, Monitor, MoonStar, Play, Plus, Square, SunMedium, Trash2, Music } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { PageHeader, Segmented, Field, IconButton, Kbd } from '../components/ui/primitives.jsx';
import { ACCENT_THEMES, resolveAccent } from '../utils/helpers.js';
import { MOD_KEY } from '../components/Layout.jsx';
import CalendarSettings from '../components/CalendarSettings.jsx';
import { revealTheme, revealAppearance } from '../utils/themeReveal.js';
import { UI_THEMES, resolveUiTheme } from '../utils/uiThemes.js';

const DEFAULT_FOCUS_SOUNDS = [
  { id: 'sound_1', name: 'Deep Focus Ambient', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', type: 'preset', isDefault: true },
  { id: 'sound_2', name: 'Rain & Thunderstorm', src: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b71d9d970.mp3?filename=rain-and-thunder-16705.mp3', type: 'preset', isDefault: false },
  { id: 'sound_3', name: 'Night City Lo-Fi', src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3', type: 'preset', isDefault: false },
  { id: 'sound_4', name: 'Synth Meditation Drone', src: 'synth', type: 'preset', isDefault: false },
];

const MAX_UPLOAD_MB = 4;

function Section({ id, title, description, children }) {
  return (
    <section className="settings-section" aria-labelledby={id}>
      <div className="settings-section-head">
        <h2 id={id} className="t-section">{title}</h2>
        {description && <p className="t-meta">{description}</p>}
      </div>
      <div className="settings-card">{children}</div>
    </section>
  );
}

function Row({ label, description, children, stacked = false, htmlFor }) {
  return (
    <div className={`settings-row ${stacked ? 'is-stacked' : ''}`}>
      <div className="settings-row-text">
        {htmlFor ? <label htmlFor={htmlFor} className="settings-row-label">{label}</label> : <div className="settings-row-label">{label}</div>}
        {description && <div className="settings-row-desc">{description}</div>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="switch-thumb" />
    </button>
  );
}

export default function Settings() {
  const { state, clearAll, updateSettings } = useApp();
  const { user, logout, isDemo } = useAuth();
  const { askConfirm } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();

  const settings = state.settings || {};
  const theme = settings.theme === 'light' || settings.theme === 'dark' ? settings.theme : 'system';
  const accent = resolveAccent(settings.accentColor);
  const uiTheme = resolveUiTheme(settings.uiTheme);
  const singleMode = UI_THEMES[uiTheme].modes.length === 1;
  const ambientOn = settings.showBanner === true;
  const bgBlur = settings.bgBlur ?? 25;
  const bgDim = settings.bgDim ?? 60;
  const activeBackground = settings.activeBackground || 'random';
  const customBackgrounds = settings.customBackgrounds || [];

  const focusSounds = settings.focusSounds || DEFAULT_FOCUS_SOUNDS;
  const defaultSoundId = settings.defaultSoundId || focusSounds[0]?.id;

  // ---- Sounds ----
  const [soundName, setSoundName] = useState('');
  const [soundSource, setSoundSource] = useState('url');
  const [soundUrl, setSoundUrl] = useState('');
  const [soundFile, setSoundFile] = useState(null);
  const [soundError, setSoundError] = useState('');
  const [previewingId, setPreviewingId] = useState(null);
  const previewRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => () => { previewRef.current?.pause(); previewRef.current = null; }, []);

  // Deep links like /settings#s-calendars
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const stopPreview = () => {
    previewRef.current?.pause();
    previewRef.current = null;
    setPreviewingId(null);
  };

  const togglePreview = (sound) => {
    if (previewingId === sound.id) { stopPreview(); return; }
    stopPreview();
    if (sound.src === 'synth') {
      setPreviewingId(sound.id);
      setTimeout(() => setPreviewingId(id => (id === sound.id ? null : id)), 3000);
      return;
    }
    const audio = new Audio(sound.src);
    audio.volume = 0.5;
    previewRef.current = audio;
    setPreviewingId(sound.id);
    audio.onended = () => setPreviewingId(null);
    audio.play().catch(() => {
      setPreviewingId(null);
      toast({ tone: 'error', title: `Couldn't play “${sound.name}”`, description: 'Check that the link points directly to an audio file.' });
    });
  };

  const removeSound = (sound) => {
    if (previewingId === sound.id) stopPreview();
    const updated = focusSounds.filter(s => s.id !== sound.id);
    updateSettings({
      focusSounds: updated,
      defaultSoundId: defaultSoundId === sound.id ? updated[0]?.id || null : defaultSoundId,
    });
    toast({
      title: 'Sound removed',
      description: sound.name,
      action: { label: 'Undo', onClick: () => updateSettings({ focusSounds, defaultSoundId }) },
    });
  };

  const addSound = (e) => {
    e.preventDefault();
    setSoundError('');
    const name = soundName.trim();
    if (!name) { setSoundError('Give the sound a name.'); return; }

    const commit = (src, type) => {
      const entry = { id: `sound_${Date.now()}`, name, src, type, isDefault: focusSounds.length === 0 };
      updateSettings({ focusSounds: [...focusSounds, entry], defaultSoundId: defaultSoundId || entry.id });
      setSoundName(''); setSoundUrl(''); setSoundFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast({ tone: 'success', title: 'Sound added', description: name });
    };

    if (soundSource === 'url') {
      const url = soundUrl.trim();
      if (!/^https?:\/\//i.test(url)) { setSoundError('Enter a link starting with http:// or https://'); return; }
      commit(url, 'url');
    } else {
      if (!soundFile) { setSoundError('Choose an audio file.'); return; }
      if (soundFile.size > MAX_UPLOAD_MB * 1024 * 1024) { setSoundError(`Files must be under ${MAX_UPLOAD_MB} MB.`); return; }
      const reader = new FileReader();
      reader.onload = (ev) => commit(ev.target.result, 'file');
      reader.onerror = () => setSoundError("Couldn't read that file.");
      reader.readAsDataURL(soundFile);
    }
  };

  // ---- Data ----
  const confirmClear = () => askConfirm({
    title: 'Delete all of your data?',
    message: `This permanently deletes ${state.tasks.length} tasks, ${state.goals.length} goals, ${state.routines.length} routines and all completion history from your account. This can't be undone.`,
    confirmLabel: 'Delete everything',
    onConfirm: () => { clearAll(); toast({ title: 'All data deleted' }); },
  });

  // Leave the protected route first so the auth gate lands on the home page, not /login.
  const handleLogout = async () => { navigate('/', { replace: true }); await logout(); };

  return (
    <div className="page page-narrow">
      <PageHeader title="Settings" description="Your account, appearance and focus preferences." />

      <div className="settings">
        <Section id="s-account" title="Account">
          {isDemo ? (
            <Row label="Demo workspace" description="Sample data stored only in this browser. Create an account to keep your own.">
              <button type="button" className="btn btn-primary btn-sm" onClick={async () => { await logout(); window.location.assign('/signup'); }}>
                Create account
              </button>
            </Row>
          ) : (
            <Row
              label={user?.name || user?.username || 'Account'}
              description={user?.provider === 'google'
                ? `Signed in with Google${user.email ? ` as ${user.email}` : ''}. Your data syncs across devices.`
                : 'Signed in. Your data syncs to this account across devices.'}
            >
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={14} strokeWidth={1.75} /> Sign out
              </button>
            </Row>
          )}
        </Section>

        <Section id="s-appearance" title="Appearance">
          <div className="settings-row is-stacked">
            <div>
              <div className="settings-row-label" id="theme-picker-label">Theme</div>
              <div className="settings-row-desc">The whole look of Cadence. Your data and layout stay the same.</div>
            </div>
            <div className="theme-picker" role="radiogroup" aria-labelledby="theme-picker-label">
              {Object.entries(UI_THEMES).map(([key, t]) => {
                const mode = t.modes.length === 1 ? t.modes[0] : (document.documentElement.dataset.theme === 'dark' && t.modes.includes('dark') ? 'dark' : t.modes[0]);
                const [ground, surface, accentColor, ink] = t.preview[mode] || t.preview[t.modes[0]];
                const selected = uiTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`theme-card ${selected ? 'is-selected' : ''}`}
                    onClick={(e) => revealAppearance({ ui: key }, () => updateSettings({ uiTheme: key }), e.currentTarget)}
                  >
                    <span className="theme-card-art" style={{ '--g': ground, '--s': surface, '--a': accentColor, '--i': ink }} aria-hidden="true">
                      <span className="tc-side" />
                      <span className="tc-main">
                        <span className="tc-line" />
                        <span className="tc-card"><span className="tc-dot" /><span className="tc-bar" /></span>
                        <span className="tc-btn" />
                      </span>
                    </span>
                    <span className="theme-card-text">
                      <span className="theme-card-name">{t.name}{key === 'standard' && <span className="theme-card-badge">Default</span>}</span>
                      <span className="theme-card-desc">{t.description}</span>
                    </span>
                    {selected && <span className="theme-card-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
          <Row
            label="Light or dark"
            description={singleMode ? `${UI_THEMES[uiTheme].name} has one look of its own.` : 'Match your device, or choose light or dark.'}
          >
            <Segmented
              label="Light or dark"
              disabled={singleMode}
              value={singleMode ? UI_THEMES[uiTheme].modes[0] : theme}
              onChange={(v) => revealTheme(v, () => updateSettings({ theme: v }), document.activeElement)}
              options={[
                { value: 'light', label: 'Light', icon: SunMedium },
                { value: 'dark', label: 'Dark', icon: MoonStar },
                { value: 'system', label: 'System', icon: Monitor },
              ]}
            />
          </Row>
          {UI_THEMES[uiTheme].accents && (
          <Row label="Accent color" description="Used for buttons, progress and the current day.">
            <div className="swatches" role="radiogroup" aria-label="Accent color">
              {Object.entries(ACCENT_THEMES).map(([key, a]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={accent === key}
                  aria-label={a.name}
                  data-tooltip={a.name}
                  className={`swatch ${accent === key ? 'is-selected' : ''}`}
                  style={{ '--swatch': a.swatch }}
                  onClick={() => updateSettings({ accentColor: key })}
                >
                  {accent === key && <Check size={12} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </Row>
          )}
          <Row label="Ambient background" description="An animated scene behind the app. Off keeps things calm and fast.">
            <Switch checked={ambientOn} onChange={(v) => updateSettings({ showBanner: v })} label="Ambient background" />
          </Row>
          {ambientOn && (
            <>
              <Row label="Scene" htmlFor="ambient-source">
                <select id="ambient-source" className="input select input-sm" value={activeBackground} onChange={e => updateSettings({ activeBackground: e.target.value })}>
                  <option value="random">Random preset</option>
                  {customBackgrounds.map(bg => (
                    <option key={bg.id} value={bg.id} disabled={!bg.url}>{bg.name || bg.id}{bg.url ? '' : ' (empty)'}</option>
                  ))}
                </select>
              </Row>
              <Row label="Saved scenes" description="Paste a link to a looping GIF or image. Changes save automatically." stacked>
                <div className="stack gap-2 w-full">
                  {customBackgrounds.map(bg => (
                    <div key={bg.id} className="scene-row">
                      <input
                        className="input input-sm scene-name"
                        value={bg.name}
                        onChange={e => updateSettings({ customBackgrounds: customBackgrounds.map(b => b.id === bg.id ? { ...b, name: e.target.value } : b) })}
                        aria-label="Scene name"
                        placeholder="Name"
                      />
                      <input
                        className="input input-sm grow"
                        value={bg.url}
                        onChange={e => updateSettings({ customBackgrounds: customBackgrounds.map(b => b.id === bg.id ? { ...b, url: e.target.value } : b) })}
                        aria-label={`Image link for ${bg.name || 'scene'}`}
                        placeholder="https://…"
                        inputMode="url"
                      />
                    </div>
                  ))}
                </div>
              </Row>
              <Row label="Blur" description={`${bgBlur}px`} htmlFor="ambient-blur">
                <input id="ambient-blur" className="range" type="range" min={0} max={80} value={bgBlur} onChange={e => updateSettings({ bgBlur: Number(e.target.value) })} />
              </Row>
              <Row label="Dim" description={`${bgDim}%`} htmlFor="ambient-dim">
                <input id="ambient-dim" className="range" type="range" min={10} max={90} value={bgDim} onChange={e => updateSettings({ bgDim: Number(e.target.value) })} />
              </Row>
            </>
          )}
        </Section>

        <Section id="s-calendars" title="Calendars" description="Bring your calendar into Cadence, and Cadence into your calendar.">
          <CalendarSettings />
        </Section>

        <Section id="s-focus" title="Focus sounds" description="Audio you can play during Lock In sessions. The default plays first.">
          {focusSounds.length === 0 ? (
            <div className="settings-row"><span className="t-meta"><Music size={14} /> No sounds yet — add one below.</span></div>
          ) : focusSounds.map(sound => {
            const isDefault = defaultSoundId === sound.id;
            const isPreviewing = previewingId === sound.id;
            return (
              <div key={sound.id} className="settings-row sound-row">
                <button
                  type="button"
                  role="radio"
                  aria-checked={isDefault}
                  className={`radio ${isDefault ? 'is-checked' : ''}`}
                  onClick={() => updateSettings({ defaultSoundId: sound.id })}
                  aria-label={`Use ${sound.name} as default`}
                />
                <div className="grow">
                  <div className="settings-row-label truncate">{sound.name}</div>
                  <div className="settings-row-desc">
                    {sound.type === 'file' ? 'Uploaded file' : sound.type === 'preset' ? 'Built-in' : 'Web link'}
                    {isDefault && ' · Default'}
                  </div>
                </div>
                <IconButton icon={isPreviewing ? Square : Play} size={14} label={isPreviewing ? `Stop ${sound.name}` : `Preview ${sound.name}`} onClick={() => togglePreview(sound)} />
                <IconButton icon={Trash2} size={14} tone="danger" label={`Remove ${sound.name}`} onClick={() => removeSound(sound)} />
              </div>
            );
          })}
          <form className="settings-row is-stacked sound-form" onSubmit={addSound} noValidate>
            <div className="settings-row-label">Add a sound</div>
            <div className="sound-form-grid">
              <Field label="Name">
                {(p) => <input {...p} className="input input-sm" value={soundName} onChange={e => setSoundName(e.target.value)} placeholder="e.g. Café ambience" />}
              </Field>
              <div className="field">
                <span className="field-label">Source</span>
                <Segmented size="sm" label="Sound source" value={soundSource} onChange={setSoundSource} options={[{ value: 'url', label: 'Link' }, { value: 'file', label: 'Upload' }]} />
              </div>
            </div>
            {soundSource === 'url' ? (
              <Field label="Audio link" hint="A direct link to an .mp3, .ogg or .wav file">
                {(p) => <input {...p} className="input input-sm" value={soundUrl} onChange={e => setSoundUrl(e.target.value)} placeholder="https://example.com/sound.mp3" inputMode="url" />}
              </Field>
            ) : (
              <Field label="Audio file" hint={`Up to ${MAX_UPLOAD_MB} MB`}>
                {(p) => <input {...p} ref={fileRef} type="file" accept="audio/*" className="input input-sm input-file" onChange={e => { const f = e.target.files?.[0]; setSoundFile(f || null); if (f && !soundName) setSoundName(f.name.replace(/\.[^/.]+$/, '')); }} />}
              </Field>
            )}
            {soundError && <div className="field-error" role="alert">{soundError}</div>}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-secondary btn-sm"><Plus size={14} strokeWidth={2} /> Add sound</button>
            </div>
          </form>
        </Section>

        <Section id="s-shortcuts" title="Keyboard shortcuts">
          {[
            [`${MOD_KEY} K`, 'Search and commands'],
            ['Q', 'Quick add (type naturally)'],
            ['N', 'New task'],
            ['Shift R', 'New routine'],
            ['L', 'Start a focus session'],
            ['Space', 'Pause or resume focus'],
            ['Esc', 'Close dialogs'],
          ].map(([keys, label]) => (
            <div key={label} className="settings-row shortcut-row">
              <span className="settings-row-label">{label}</span>
              <span className="row gap-1">{keys.split(' ').map(k => <Kbd key={k}>{k}</Kbd>)}</span>
            </div>
          ))}
        </Section>

        <Section id="s-data" title="Data">
          <Row label="Your data" description={`${state.routines.length} routines · ${state.tasks.length} tasks · ${state.goals.length} goals, synced to your account.`} />
          <Row label="Delete all data" description="Permanently remove every routine, task, goal and completion.">
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmClear}>Delete all data</button>
          </Row>
        </Section>

        <p className="settings-footnote t-meta">Cadence 1.2</p>
      </div>
    </div>
  );
}
