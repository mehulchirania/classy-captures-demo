import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { films, galleries, heroVideo, images } from './assets';
import './styles.css';

/* ─── DATA ───────────────────────────────────────────────────────────── */
const services = [
  { title: 'Weddings',     path: '/weddings',     image: images.weddings,    alt: 'A wedding moment photographed by Classy Captures',          desc: 'From quiet rituals to the blur of the dance floor — photographed with care.' },
  { title: 'Pre-weddings', path: '/pre-weddings', image: images.preWeddings, alt: 'A pre-wedding portrait photographed by Classy Captures',     desc: 'Unhurried portraits with enough room for your own rhythm to take over.' },
  { title: 'Films',        path: '/films',        image: images.films,       alt: 'A wedding film still by Classy Captures',                    desc: 'Wedding films that bring you back to the sound and feeling of the day.' },
  { title: 'Portraits',    path: '/portraits',    image: images.portraits,   alt: 'A portrait photographed by Classy Captures',                 desc: 'Honest portraits built around character and the expressions that cannot be rehearsed.' },
];

const categoryCopy = {
  weddings:      ['Weddings',      'The whole celebration, held with care.',          'From quiet rituals to the blur of the dance floor, we photograph the people, gestures and atmosphere that made the day yours.'],
  'pre-weddings':['Pre-weddings',  'A day that feels like the two of you.',           'Unhurried portraits with enough direction to help you settle in, and enough room for your own rhythm to take over.'],
  portraits:     ['Portraits',     'Honest portraits, beautifully observed.',         'Portrait sessions shaped around character, connection and the small expressions that cannot be rehearsed.'],
};

const heroWords = [
  'in a glance.',
  'in an embrace.',
  'all over again.',
  'without words.',
  'in the in-between.',
];

/* ─── SCROLL TOP ─────────────────────────────────────────────────────── */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const titles = {
      '/':             'Classy Captures — Wedding Photography & Films',
      '/weddings':     'Weddings — Classy Captures',
      '/pre-weddings': 'Pre-weddings — Classy Captures',
      '/portraits':    'Portraits — Classy Captures',
      '/films':        'Films — Classy Captures',
      '/about':        'Our Approach — Classy Captures',
      '/inquire':      'Inquire — Classy Captures',
      '/privacy':      'Privacy — Classy Captures',
    };
    document.title = titles[pathname] || 'Page not found — Classy Captures';
    const main = document.querySelector('main');
    if (main) { main.tabIndex = -1; main.focus({ preventScroll: true }); }
  }, [pathname]);
  return null;
}

/* ─── HEADER ─────────────────────────────────────────────────────────── */
function Header({ light = false }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const firstLinkRef = useRef(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }
      if (e.key === 'Tab') {
        const focusable = [...document.querySelectorAll('#mobile-menu a, #mobile-menu button, .menu-button')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('menu-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('menu-open'); };
  }, [open]);

  const nav = (
    <>
      <NavLink ref={firstLinkRef} to="/weddings">Stories</NavLink>
      <NavLink to="/films">Films</NavLink>
      <NavLink to="/about">Our approach</NavLink>
      <NavLink className="nav-inquire" to="/inquire">Inquire</NavLink>
    </>
  );

  return (
    <header className={`site-header ${light ? 'header-light' : ''}`}>
      <Link className="wordmark" to="/" aria-label="Classy Captures home">
        <span>Classy</span><span>Captures</span>
      </Link>
      <nav className="desktop-nav" aria-label="Primary navigation">{nav}</nav>
      <button ref={buttonRef} className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Menu'}
      </button>
      {open && (
        <div id="mobile-menu" className="mobile-menu">
          <nav aria-label="Mobile navigation">{nav}</nav>
          <p>Bengaluru &amp; beyond</p>
        </div>
      )}
    </header>
  );
}

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
function SectionLabel({ number, children, dark = false }) {
  return (
    <p className={`section-label ${dark ? 'on-dark' : ''}`}>
      <span>{number}</span>{children}
    </p>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────── */
function Hero() {
  const [motion, setMotion] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData
  );
  const [wordIdx, setWordIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setWordIdx((v) => (v + 1) % heroWords.length);
        setAnimating(false);
      }, 100);
    }, 3400);
    return () => window.clearInterval(id);
  }, [motion]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [motion]);

  return (
    <section className="hero" id="top">
      {navigator.connection?.saveData
        ? <img className="hero-image" src={images.hero} alt="A wedding celebration by Classy Captures" fetchPriority="high" />
        : (
          <video ref={videoRef} className="hero-image" autoPlay={motion} muted loop playsInline poster={images.hero} aria-label="Wedding celebrations filmed by Classy Captures">
            <source src={heroVideo} type="video/mp4" />
          </video>
        )
      }
      <div className="hero-shade" />
      <Header light />

      <div className="hero-center">
        <h1>Felt.</h1>
        <div className="phrase-wrapper">
          <p key={wordIdx} className={`phrase ${animating ? '' : motion ? 'phrase-animate' : ''}`}>
            {heroWords[wordIdx]}
          </p>
        </div>
        <p className="hero-kicker">Wedding photography &amp; films &nbsp;·&nbsp; Bengaluru &amp; beyond</p>
      </div>

      <p className="hero-note">For everything you felt.<br />And everything you missed.</p>
      <div className="hero-actions">
        <a href="#manifesto">Scroll to discover <span aria-hidden="true">↓</span></a>
        <button type="button" onClick={() => setMotion(!motion)} aria-pressed={!motion}>
          {motion ? 'Pause motion' : 'Play motion'}
        </button>
      </div>
    </section>
  );
}

/* ─── HOME ───────────────────────────────────────────────────────────── */
function Home() {
  return (
    <main>
      <Hero />

      {/* ── MANIFESTO ── */}
      <section className="manifesto" id="manifesto">
        <SectionLabel number="01 /">The way we see it</SectionLabel>
        <div className="manifesto-grid">
          <div>
            <div className="manifesto-rule" />
            <h2>
              Some things are too<br />
              <em>important to pose.</em>
            </h2>
          </div>
          <p>
            The hands that find each other. The laugh that interrupts a vow. The people who make it yours.
            We stay close to the feeling, so you can stay in the moment.
          </p>
        </div>
      </section>

      {/* ── STORY INDEX — multi-divert editorial grid ── */}
      <section className="story-index">
        <div className="story-index-header">
          <SectionLabel number="02 /">Find your story</SectionLabel>
          <h2>Every celebration<br /><em>has its own language.</em></h2>
        </div>
        <div className="story-grid">
          {services.map((service, index) => (
            <Link
              className={`story story-${index + 1}`}
              key={service.path}
              to={service.path}
            >
              <div className="story-image">
                <img src={service.image} alt={service.alt} loading={index < 2 ? 'eager' : 'lazy'} />
                <div className="story-image-overlay">
                  <span className="story-image-label">View {service.title} →</span>
                </div>
              </div>
              <div className="story-title">
                <h3>{service.title}</h3>
                <span className="story-arrow" aria-hidden="true">↗</span>
              </div>
              <p className="story-desc">{service.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="stats-bar" aria-hidden="true">
        <div className="stat-item">
          <span className="stat-number">30+</span>
          <span className="stat-label">Years of storytelling</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">1200+</span>
          <span className="stat-label">Celebrations captured</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">∞</span>
          <span className="stat-label">Moments that last forever</span>
        </div>
      </div>

      {/* ── APPROACH BAND ── */}
      <section className="approach-band">
        <div className="approach-copy">
          <div className="approach-gold-rule" />
          <SectionLabel number="03 /" dark>Our approach</SectionLabel>
          <h2>A little direction.<br /><em>A lot of being yourself.</em></h2>
          <Link className="text-link light-link" to="/about">
            Our approach <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="approach-image-wrap">
          <img src={images.approach} alt="A candid moment photographed by Classy Captures" loading="lazy" />
        </div>
      </section>

      {/* ── QUOTE BAND ── */}
      <section className="quote-band">
        <blockquote>
          "We don't create moments — we recognize them, and hold them still long enough for you to feel them again."
        </blockquote>
        <cite>— The Classy Captures team</cite>
      </section>
    </main>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="site-footer">
      <p className="footer-kicker">Have something in mind?</p>
      <div className="footer-main">
        <h2>Tell us what<br /><em>you're dreaming of.</em></h2>
        <Link className="circle-link" to="/inquire" aria-label="Start an inquiry">↗</Link>
      </div>
      <div className="footer-details">
        <div>
          <a href="mailto:classycapturesofficial@gmail.com">classycapturesofficial@gmail.com</a>
          <a href="tel:+917022444400">+91 70224 44400</a>
        </div>
        <div>
          <a href="https://www.instagram.com/classycaptures_official/" target="_blank" rel="noreferrer">Instagram ↗</a>
          <Link to="/privacy">Privacy</Link>
        </div>
        <p>Wedding photography &amp; films<br />Bengaluru &amp; beyond</p>
      </div>
      <p className="copyright">© {new Date().getFullYear()} Classy Captures</p>
    </footer>
  );
}

/* ─── STANDARD PAGE WRAPPER ──────────────────────────────────────────── */
function StandardPage({ children, className = '' }) {
  return (
    <>
      <Header />
      <main className={`standard-page ${className}`}>{children}</main>
      <Footer />
    </>
  );
}

/* ─── LIGHTBOX ───────────────────────────────────────────────────────── */
function Lightbox({ items, active, setActive }) {
  const closeRef = useRef(null), openerRef = useRef(null);
  useEffect(() => {
    if (active === null) return;
    openerRef.current = document.activeElement;
    closeRef.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight') setActive((active + 1) % items.length);
      if (e.key === 'ArrowLeft') setActive((active - 1 + items.length) % items.length);
      if (e.key === 'Tab') {
        const controls = [...document.querySelectorAll('.lightbox button')];
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    document.body.classList.add('lightbox-open');
    return () => {
      document.removeEventListener('keydown', key);
      document.body.classList.remove('lightbox-open');
      openerRef.current?.focus();
    };
  }, [active, items.length, setActive]);
  if (active === null) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
      <button ref={closeRef} className="lightbox-close" onClick={() => setActive(null)} aria-label="Close image viewer">Close</button>
      <button className="lightbox-prev" onClick={() => setActive((active - 1 + items.length) % items.length)} aria-label="Previous image">←</button>
      <img src={items[active]} alt={`Gallery image ${active + 1} of ${items.length}`} />
      <button className="lightbox-next" onClick={() => setActive((active + 1) % items.length)} aria-label="Next image">→</button>
      <p>{String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</p>
    </div>
  );
}

/* ─── CATEGORY PAGE ──────────────────────────────────────────────────── */
function CategoryPage({ category }) {
  const [title, heading, body] = categoryCopy[category];
  const items = galleries[category];
  const [active, setActive] = useState(null);
  return (
    <StandardPage className="category-page">
      <div className="page-intro">
        <SectionLabel number="Stories /">{title}</SectionLabel>
        <h1>{heading}</h1>
        <p>{body}</p>
      </div>
      <div className="masonry">
        {items.map((src, index) => (
          <button
            type="button"
            onClick={() => setActive(index)}
            key={src}
            aria-label={`Open ${title} photograph ${index + 1}`}
          >
            <img src={src} alt={`${title} photograph by Classy Captures`} loading={index < 2 ? 'eager' : 'lazy'} />
          </button>
        ))}
      </div>
      <Lightbox items={items} active={active} setActive={setActive} />
    </StandardPage>
  );
}

/* ─── FILMS ──────────────────────────────────────────────────────────── */
function Films() {
  return (
    <StandardPage className="films-page">
      <div className="page-intro">
        <SectionLabel number="Stories /">Films</SectionLabel>
        <h1>Movement, voices,<br /><em>the feeling in between.</em></h1>
        <p>We create wedding teasers, highlights and full-length films that bring you back to the sound and energy of the day.</p>
      </div>
      <div className="film-reel">
        {films.map((film) => (
          <figure key={film.src}>
            <video controls playsInline preload="metadata" poster={film.poster}>
              <source src={film.src} type="video/mp4" />
            </video>
            <figcaption>{film.title}</figcaption>
          </figure>
        ))}
      </div>
      <div className="film-cta">
        <p>Planning a celebration?</p>
        <Link className="text-link" to="/inquire">Ask about wedding films <span aria-hidden="true">→</span></Link>
      </div>
    </StandardPage>
  );
}

/* ─── ABOUT ──────────────────────────────────────────────────────────── */
function About() {
  return (
    <StandardPage className="about-page">
      <div className="page-intro">
        <SectionLabel number="About /">Our approach</SectionLabel>
        <h1>A little direction.<br /><em>A lot of being yourself.</em></h1>
        <p>We notice first and arrange second. When a little guidance helps, we give it simply. When the moment is already happening, we let it breathe.</p>
      </div>
      <div className="about-feature">
        <img src={images.approach} alt="Classy Captures photographing an unfolding celebration" />
        <div>
          <SectionLabel number="Since /">1990s</SectionLabel>
          <h2>Three decades of<br />holding on to feeling.</h2>
          <p>Classy Captures brings a 30-year legacy to weddings and portraits. That experience shows up as calm attention: knowing when to step closer, when to give space, and how to keep a celebration moving naturally.</p>
        </div>
      </div>
    </StandardPage>
  );
}

/* ─── INQUIRE ────────────────────────────────────────────────────────── */
const emptyForm = { name: '', email: '', phone: '', date: '', location: '', service: '', message: '', consent: false, website: '' };

function Inquire() {
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setState('loading');
    setError('');
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('We could not send your inquiry. Please try again or email us directly.');
      setState('success');
      setForm(emptyForm);
    } catch (err) {
      setState('error');
      setError(err.message);
    }
  };

  if (state === 'success') {
    return (
      <StandardPage className="inquire-page">
        <div className="form-success" role="status">
          <SectionLabel number="Thank you /">Inquiry received</SectionLabel>
          <h1>We'll be in touch.</h1>
          <p>Your note is with us. We'll reply at the email address you shared.</p>
          <Link className="text-link" to="/">Return home <span aria-hidden="true">→</span></Link>
        </div>
      </StandardPage>
    );
  }

  return (
    <StandardPage className="inquire-page">
      <div className="inquiry-intro">
        <SectionLabel number="Inquire /">Begin here</SectionLabel>
        <h1>Tell us what<br /><em>you're dreaming of.</em></h1>
        <p>Share what you know so far. We'll reply with availability and the right collection for your celebration.</p>
      </div>
      <form className="inquiry-form" onSubmit={submit}>
        <label>Name<input name="name" value={form.name} onChange={update} required autoComplete="name" /></label>
        <label>Email<input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" /></label>
        <label>Phone<input type="tel" name="phone" value={form.phone} onChange={update} required autoComplete="tel" /></label>
        <label>Date<input type="date" name="date" value={form.date} onChange={update} required /></label>
        <label>Location<input name="location" value={form.location} onChange={update} required /></label>
        <label>
          Service
          <select name="service" value={form.service} onChange={update} required>
            <option value="">Choose a service</option>
            <option value="weddings">Weddings</option>
            <option value="pre-weddings">Pre-weddings</option>
            <option value="films">Films</option>
            <option value="portraits">Portraits</option>
          </select>
        </label>
        <label className="full-field">Tell us more<textarea name="message" value={form.message} onChange={update} required rows="5" /></label>
        <label className="honeypot" aria-hidden="true">Website<input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" /></label>
        <label className="consent full-field">
          <input type="checkbox" name="consent" checked={form.consent} onChange={update} required />
          <span>I agree that Classy Captures may use these details to respond to my inquiry.</span>
        </label>
        {error && (
          <p className="form-error full-field" role="alert">
            {error} You can also email <a href="mailto:classycapturesofficial@gmail.com">classycapturesofficial@gmail.com</a>.
          </p>
        )}
        <button className="submit-button full-field" type="submit" disabled={state === 'loading'}>
          {state === 'loading' ? 'Sending…' : 'Send inquiry'} <span aria-hidden="true">→</span>
        </button>
      </form>
    </StandardPage>
  );
}

/* ─── PRIVACY ────────────────────────────────────────────────────────── */
function Privacy() {
  return (
    <StandardPage className="privacy-page">
      <div className="page-intro">
        <SectionLabel number="Privacy /">Your information</SectionLabel>
        <h1>A plain note<br /><em>about your data.</em></h1>
        <p>When you send an inquiry, we collect the details you enter so Classy Captures can respond and discuss your photography or film requirements. Inquiry data is stored in Firebase. Please do not include sensitive personal information in your message.</p>
        <p>If you would like to ask about or request changes to information you submitted, email <a href="mailto:classycapturesofficial@gmail.com">classycapturesofficial@gmail.com</a>.</p>
      </div>
    </StandardPage>
  );
}

/* ─── 404 ────────────────────────────────────────────────────────────── */
function NotFound() {
  return (
    <StandardPage>
      <div className="page-intro">
        <SectionLabel number="404 /">Page not found</SectionLabel>
        <h1>This moment<br /><em>has moved on.</em></h1>
        <Link className="text-link" to="/">Return home →</Link>
      </div>
    </StandardPage>
  );
}

/* ─── APP ────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/"            element={<><Home /><Footer /></>} />
        <Route path="/weddings"    element={<CategoryPage category="weddings" />} />
        <Route path="/pre-weddings" element={<CategoryPage category="pre-weddings" />} />
        <Route path="/portraits"   element={<CategoryPage category="portraits" />} />
        <Route path="/films"       element={<Films />} />
        <Route path="/about"       element={<About />} />
        <Route path="/inquire"     element={<Inquire />} />
        <Route path="/privacy"     element={<Privacy />} />
        <Route path="*"            element={<NotFound />} />
      </Routes>
    </>
  );
}
