import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Columns3,
  Download,
  Flag,
  Flame,
  Keyboard,
  Menu,
  Moon,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { APP_URL } from '../config';
import { dueKey, formatDueKey } from '../lib/dates';
import { parseQuickAdd } from '../lib/quickAdd';

/* Fade/slide children in once as they scroll into view. */
function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal${shown ? ' is-visible' : ''} ${className}`} style={{ '--delay': `${delay}ms` }}>
      {children}
    </Tag>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    ['#features', 'Features'],
    ['#quick-add', 'Quick add'],
    ['#how', 'How it works'],
    ['#faq', 'FAQ'],
  ];

  return (
    <header className="lp-header">
      <div className="lp-container lp-header__inner">
        <Logo />
        <nav className={`lp-nav${open ? ' is-open' : ''}`} aria-label="Main">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <div className="lp-nav__cta-mobile">
            <a href={`${APP_URL}/login`} className="btn btn--outline btn--block">Log in</a>
            <a href={`${APP_URL}/signup`} className="btn btn--primary btn--block">Get started</a>
          </div>
        </nav>
        <div className="lp-header__actions">
          <ThemeToggle />
          <a href={`${APP_URL}/login`} className="btn btn--ghost btn--sm lp-hide-sm">Log in</a>
          <a href={`${APP_URL}/signup`} className="btn btn--primary btn--sm lp-hide-sm">Get started</a>
          <button
            type="button"
            className="icon-btn lp-menu-btn"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

/* Decorative product preview — pure markup, no screenshots to go stale. */
function HeroMock() {
  const cards = {
    todo: [
      { t: 'Draft Q4 roadmap', p: 'high', d: 'Tomorrow', tag: 'work' },
      { t: 'Book dentist', p: 'low', d: 'Fri', tag: 'home' },
    ],
    doing: [{ t: 'Design landing page', p: 'medium', d: 'Today', tag: 'design', sub: '3/5' }],
    done: [
      { t: 'Reply to investors', p: 'high', d: 'Done', tag: 'work' },
      { t: 'Weekly review', p: 'medium', d: 'Done', tag: 'habit' },
    ],
  };
  const Col = ({ title, color, items }) => (
    <div className="mock__col">
      <div className="mock__col-head"><i style={{ background: color }} />{title}<b>{items.length}</b></div>
      {items.map((c) => (
        <div key={c.t} className="mock__card">
          <span className="mock__title">{c.t}</span>
          <span className="mock__chips">
            <em className={`mk-chip mk-chip--${c.p}`}>{c.p}</em>
            <em className="mk-chip">{c.d}</em>
            {c.sub && <em className="mk-chip">{c.sub}</em>}
            <em className="mk-chip mk-chip--tag">#{c.tag}</em>
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mock" aria-hidden="true">
      <div className="mock__bar"><i /><i /><i /><span>ytasker.app / tasks</span></div>
      <div className="mock__body">
        <div className="mock__side">
          <span className="mock__logo" />
          <span className="mock__nav is-on" /><span className="mock__nav" /><span className="mock__nav" /><span className="mock__nav" />
        </div>
        <div className="mock__main">
          <div className="mock__quick"><Sparkles /> Send invoice tomorrow !high #work</div>
          <div className="mock__cols">
            <Col title="To do" color="#64748b" items={cards.todo} />
            <Col title="In progress" color="#2563eb" items={cards.doing} />
            <Col title="Done" color="#16a34a" items={cards.done} />
          </div>
        </div>
      </div>
      <div className="mock__float mock__float--a"><Flame /> <b>7</b> day streak</div>
      <div className="mock__float mock__float--b"><Timer /> <b>25:00</b> focus</div>
    </div>
  );
}

const FEATURES = [
  { icon: Columns3, title: 'List & Kanban board', text: 'Switch between a tidy list and a drag-and-drop board. Same tasks, whichever way you think.' },
  { icon: Sparkles, title: 'Natural quick-add', text: 'Type “Call mom tomorrow !high #family” and Ytasker fills in the date, priority and tags for you.' },
  { icon: Timer, title: 'Built-in focus timer', text: 'Start a Pomodoro on any task. Sessions are logged, so you can see where your deep work actually goes.' },
  { icon: BarChart3, title: 'Insights & streaks', text: 'A dashboard with what’s due, what’s overdue, a 7-day chart and a streak that rewards consistency.' },
  { icon: Keyboard, title: 'Keyboard-first', text: 'Press N for a new task, / to search, G then D to jump around. Your hands never leave the keys.' },
  { icon: Moon, title: 'Light, dark & system', text: 'A carefully tuned dark mode that’s easy on the eyes — or let it follow your device automatically.' },
];

const STEPS = [
  { n: '1', title: 'Capture it', text: 'Drop a thought into quick-add the moment it appears. Dates, priority and tags are parsed as you type.' },
  { n: '2', title: 'Shape your day', text: 'See what’s due today, what’s overdue, and what’s up next. Drag cards across the board as work moves.' },
  { n: '3', title: 'Do the work', text: 'Start the focus timer on one task, finish it, and watch your streak and weekly chart grow.' },
];

const FAQS = [
  ['Is my data private?', 'Your tasks are tied to your account and are only ever readable by you. Passwords are hashed, and you can export or permanently delete everything from Settings at any time.'],
  ['Can I use it on my phone?', 'Yes. Ytasker is fully responsive, with a bottom tab bar and a quick “+” button on small screens, so it works well in any mobile browser.'],
  ['What does quick-add understand?', 'Words like today, tomorrow or a weekday for due dates; !high, !med or !low for priority; and #hashtags for tags. Anything else becomes the task title.'],
  ['Can I get my tasks out?', 'Always. Export everything as CSV or JSON from Settings — it’s your data.'],
  ['Does it work with a keyboard only?', 'Yes. Every action has a keyboard path, focus is always visible, and the board has move buttons as an alternative to dragging. Press ? in the app to see all shortcuts.'],
];

function QuickAddDemo() {
  const [text, setText] = useState('Send invoice tomorrow !high #work');
  const parsed = useMemo(() => parseQuickAdd(text), [text]);

  return (
    <div className="demo card">
      <label className="field__label" htmlFor="demo-input">Try typing a task</label>
      <div className="input-group">
        <Sparkles aria-hidden="true" />
        <input
          id="demo-input"
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          autoComplete="off"
        />
      </div>
      <div className="demo__result" aria-live="polite">
        <div className="demo__row">
          <span className="demo__k">Title</span>
          <strong>{parsed.title || '—'}</strong>
        </div>
        <div className="demo__row">
          <span className="demo__k">Due</span>
          {parsed.dueDate ? (
            <span className="chip chip--soon"><CalendarDays aria-hidden="true" />{formatDueKey(dueKey(parsed.dueDate))}</span>
          ) : <span className="muted">none</span>}
        </div>
        <div className="demo__row">
          <span className="demo__k">Priority</span>
          {parsed.priority ? (
            <span className={`chip chip--${parsed.priority}`}><Flag aria-hidden="true" />{parsed.priority}</span>
          ) : <span className="muted">medium (default)</span>}
        </div>
        <div className="demo__row">
          <span className="demo__k">Tags</span>
          {parsed.tags.length ? parsed.tags.map((t) => <span key={t} className="chip chip--tag">#{t}</span>) : <span className="muted">none</span>}
        </div>
      </div>
      <div className="demo__examples">
        {['Plan sprint monday !med #team', 'Buy groceries today #home', 'Renew passport 2027-01-15 !high'].map((ex) => (
          <button key={ex} type="button" className="chip" onClick={() => setText(ex)}>{ex}</button>
        ))}
      </div>
    </div>
  );
}

function InsightsMock() {
  const bars = [2, 4, 3, 6, 5, 8, 4];
  return (
    <div className="insight card" aria-hidden="true">
      <div className="insight__top">
        <div><span className="insight__big">12</span><span className="muted"> tasks done this week</span></div>
        <span className="chip chip--done">+4 vs last week</span>
      </div>
      <div className="insight__bars">
        {bars.map((b, i) => (
          <div key={i}><span style={{ height: `${(b / 8) * 100}%` }} className={i === 5 ? 'is-today' : ''} /></div>
        ))}
      </div>
      <div className="insight__days">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="insight__stats">
        <div><Flame /> <b>7</b><span>day streak</span></div>
        <div><Timer /> <b>3h 25m</b><span>focused</span></div>
        <div><Check /> <b>86%</b><span>complete</span></div>
      </div>
    </div>
  );
}

function Faq() {
  return (
    <div className="faq">
      {FAQS.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <ChevronDown aria-hidden="true" />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

export default function Landing() {
  const primaryTo = `${APP_URL}/signup`;
  const primaryLabel = 'Start for free';

  return (
    <div className="lp">
      <a href="#top" className="skip-link">Skip to content</a>
      <Header />

      <main id="top">
        <section className="lp-hero">
          <div className="lp-container lp-hero__grid">
            <div className="lp-hero__copy">
              <span className="lp-pill"><Sparkles aria-hidden="true" /> Calm task management</span>
              <h1>
                Get the right things done, <span className="lp-gradient">every single day.</span>
              </h1>
              <p className="lp-lead">
                Ytasker brings a fast board, natural quick-add and a built-in focus timer into one quiet workspace — so
                planning never gets in the way of doing.
              </p>
              <div className="lp-hero__cta">
                <a href={primaryTo} className="btn btn--primary btn--lg">
                  {primaryLabel} <ArrowRight aria-hidden="true" />
                </a>
                <a href="#features" className="btn btn--outline btn--lg">See what’s inside</a>
              </div>
              <ul className="lp-hero__facts">
                <li><Check aria-hidden="true" /> Set up in under a minute</li>
                <li><Check aria-hidden="true" /> Export your data anytime</li>
              </ul>
            </div>
            <div className="lp-hero__visual">
              <HeroMock />
            </div>
          </div>
        </section>

        <section className="lp-section" id="features" aria-labelledby="features-h">
          <div className="lp-container">
            <Reveal className="lp-section__head">
              <p className="lp-eyebrow">Features</p>
              <h2 id="features-h">Everything you need. Nothing you don’t.</h2>
              <p className="lp-lead">A focused toolkit that stays out of your way — powerful when you reach for it, invisible when you don’t.</p>
            </Reveal>
            <div className="lp-features">
              {FEATURES.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 60} as="article" className="lp-feature card">
                  <span className="lp-feature__icon"><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--alt" id="quick-add" aria-labelledby="qa-h">
          <div className="lp-container lp-split">
            <Reveal>
              <p className="lp-eyebrow">Quick add</p>
              <h2 id="qa-h">Write it like you’d say it.</h2>
              <p className="lp-lead">
                No dropdowns, no date pickers. Just type — Ytasker understands dates, priorities and tags right inside
                the sentence.
              </p>
              <ul className="lp-checks">
                <li><Check aria-hidden="true" /><span><code>today</code>, <code>tomorrow</code>, <code>friday</code> or <code>2027-01-15</code> for due dates</span></li>
                <li><Check aria-hidden="true" /><span><code>!high</code> <code>!med</code> <code>!low</code> for priority</span></li>
                <li><Check aria-hidden="true" /><span><code>#work</code> <code>#home</code> for tags</span></li>
              </ul>
            </Reveal>
            <Reveal delay={100}>
              <QuickAddDemo />
            </Reveal>
          </div>
        </section>

        <section className="lp-section" id="how" aria-labelledby="how-h">
          <div className="lp-container">
            <Reveal className="lp-section__head">
              <p className="lp-eyebrow">How it works</p>
              <h2 id="how-h">From scattered to shipped, in three steps.</h2>
            </Reveal>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} as="li" delay={i * 80} className="lp-step">
                  <span className="lp-step__n" aria-hidden="true">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section lp-section--alt" aria-labelledby="insights-h">
          <div className="lp-container lp-split lp-split--rev">
            <Reveal delay={100}>
              <InsightsMock />
            </Reveal>
            <Reveal>
              <p className="lp-eyebrow">Insights</p>
              <h2 id="insights-h">See your progress, not just your pile.</h2>
              <p className="lp-lead">
                Your dashboard turns activity into momentum: tasks completed each day, a completion ring, focus time and a
                streak that makes showing up feel good.
              </p>
              <ul className="lp-checks">
                <li><Check aria-hidden="true" /><span>Due today and overdue at a glance</span></li>
                <li><Check aria-hidden="true" /><span>Focus sessions logged against your tasks</span></li>
                <li><Check aria-hidden="true" /><span>Export everything to CSV or JSON <Download aria-hidden="true" className="lp-inline-icon" /></span></li>
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="lp-section" id="faq" aria-labelledby="faq-h">
          <div className="lp-container lp-container--narrow">
            <Reveal className="lp-section__head">
              <p className="lp-eyebrow">FAQ</p>
              <h2 id="faq-h">Questions, answered.</h2>
            </Reveal>
            <Reveal><Faq /></Reveal>
          </div>
        </section>

        <section className="lp-cta" aria-labelledby="cta-h">
          <div className="lp-container">
            <Reveal className="lp-cta__box">
              <h2 id="cta-h">Ready for a calmer to-do list?</h2>
              <p>Create your account and add your first task in under a minute.</p>
              <a href={primaryTo} className="btn btn--lg lp-cta__btn">
                {primaryLabel} <ArrowRight aria-hidden="true" />
              </a>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div>
            <Logo />
            <p className="muted">Plan the day. Do the work.</p>
          </div>
          <nav aria-label="Footer">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            <a href={`${APP_URL}/login`}>Log in</a>
          </nav>
        </div>
        <div className="lp-container lp-footer__legal">© {new Date().getFullYear()} Ytasker. All rights reserved.</div>
      </footer>
    </div>
  );
}
