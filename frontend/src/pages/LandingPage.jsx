import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Stethoscope,
    Lightbulb,
    ChevronUp,
    ChevronRight,
    ShieldCheck,
    Activity,
    BrainCircuit,
    Menu,
    X
} from 'lucide-react';
import './Landing.css';

const PRICING_PLANS = [
    {
        name: 'Starter',
        price: '9,999',
        bestFor: 'Best for small clinics with limited patient volume.',
        features: [
            'Patient dashboard',
            'Symptom intake & report uploads',
            'Rule-based triage',
            'Basic risk scoring',
            'Reminders & Audit logs'
        ],
        highlight: false,
        color: '#6366f1' // Indigo
    },
    {
        name: 'Professional',
        price: '24,999',
        bestFor: 'Best for mid-size practices and growing teams.',
        features: [
            'Everything in Starter, plus:',
            'ML-based risk scoring',
            'Patient priority queue & alerts',
            'Patient history timeline',
            'Lifestyle suggestions (non-medical)'
        ],
        highlight: true,
        color: '#8b5cf6' // Violet
    },
    {
        name: 'Enterprise',
        price: '59,999',
        bestFor: 'Advanced capabilities for large hospitals.',
        features: [
            'Everything in Professional, plus:',
            'Unlimited users',
            'LLM document summarization',
            'HIS / EMR integration support',
            'Dedicated onboarding & SLA'
        ],
        highlight: false,
        color: '#111' // Dark
    }
];


const STORIES = [
    {
        num: '01',
        title: 'Smart Triage Engine',
        desc: 'Our rule-based triage engine instantly prioritizes patients by severity, flagging critical cases so doctors can act fast — without missing anyone. Clinicians receive AI-powered suggestions backed by evidence-based protocols.',
        leftImg: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&q=80',
        rightImg: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&q=80',
    },
    {
        num: '02',
        title: 'Doctor Decision Support',
        desc: 'Clinicians receive AI-powered suggestions backed by evidence-based protocols — always reviewable and overridable. Full authority stays with the doctor.',
        leftImg: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80',
        rightImg: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&q=80',
    },
    {
        num: '03',
        title: 'Real Success Stories',
        desc: 'Read inspiring stories of individuals who have experienced positive changes in their lives through our services. These real success stories demonstrate the effectiveness of our tailored programs.',
        leftImg: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
        rightImg: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&q=80',
    },
];

const FEATURES = [
    {
        title: 'Holistic Approach',
        desc: 'A comprehensive view of each patient — vitals, symptoms, history — unified into one intelligent support layer.',
        img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
    },
    {
        title: 'Unlock Your Potential',
        desc: 'Triage assessments powered by clinical rule engines and ML models — reviewed and overridden by your doctor.',
        img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&q=80',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [activeStory, setActiveStory] = useState(2);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Scroll-reveal observer
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        // Only trigger once
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );
        document.querySelectorAll('.scroll-reveal, .reveal-line').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="lp-root">

            {/* ═══════════════════════════════════════════
          HERO — Exact match to reference design
      ═══════════════════════════════════════════ */}
            <section className="lp-hero">

                {/* ── Navbar ── */}
                <nav className="lp-nav">
                    <div className="lp-nav-logo">Vital<span>Path</span></div>
                    <div className="lp-nav-links">
                        <a href="#features">Features</a>
                        <a href="#solutions">Solutions</a>
                        <a href="#why-us">Why Us</a>
                    </div>
                    <div className="lp-nav-actions">
                        <button className="lp-ghost-btn" onClick={() => navigate('/login')}>Sign In</button>
                        <button className="lp-dark-btn" onClick={() => navigate('/register')}>Get Started</button>
                    </div>
                    <button className="lp-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </nav>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lp-mobile-menu">
                        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
                        <a href="#solutions" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
                        <a href="#why-us" onClick={() => setMobileMenuOpen(false)}>Why Us</a>
                        <button className="lp-ghost-btn" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Sign In</button>
                        <button className="lp-dark-btn" onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>Get Started</button>
                    </div>
                )}

                {/* ── Hero body ── */}
                <div className="lp-hero-body">

                    {/* Big title — behind the hand (z-index: 1) */}
                    <h1 className="lp-hero-title">
                        Embark on your<br />
                        healthcare journey<br />
                        with professionals.
                    </h1>

                    {/* Hand video — left side, on top of title (z-index: 2) */}
                    <div className="lp-hand-wrap">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="lp-hand-video"
                        >
                            <source src="/hand.mp4" type="video/mp4" />
                        </video>
                    </div>

                    {/* Right side — floating info panel (z-index: 3) */}
                    <div className="lp-hero-right">

                        {/* "Ready to help" badge */}
                        <div className="lp-ready-badge">
                            <span className="lp-green-pulse" />
                            Ready to help
                        </div>

                        {/* Info card */}
                        <div className="lp-hero-card">
                            {/* Avatar group */}
                            <div className="lp-avatar-group">
                                {[
                                    'https://randomuser.me/api/portraits/women/44.jpg',
                                    'https://randomuser.me/api/portraits/men/32.jpg',
                                    'https://randomuser.me/api/portraits/women/68.jpg',
                                    'https://randomuser.me/api/portraits/men/75.jpg',
                                ].map((src, i) => (
                                    <img
                                        key={i}
                                        src={src}
                                        alt="Professional"
                                        className="lp-avatar-img"
                                        style={{ marginLeft: i > 0 ? '-12px' : 0, zIndex: 4 - i }}
                                    />
                                ))}
                            </div>

                            <p className="lp-card-desc">
                                Welcome to VitalPath, your gateway to better healthcare. We are here to help you navigate triage, reports, and clinical decisions — always with a doctor in the loop.
                            </p>

                            <div className="lp-card-actions">
                                <button className="lp-dark-btn lp-btn-lg" onClick={() => navigate('/register')}>
                                    Start Now <ChevronRight className="lp-arrow" size={20} />
                                </button>
                                <button className="lp-ghost-btn" onClick={() => navigate('/login')}>
                                    Watch demo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
          FEATURES — centered heading + marquee
      ═══════════════════════════════════════════ */}
            <section className="lp-features" id="features">

                {/* Centered intro */}
                <div className="lp-feat-intro">
                    <h2 className="lp-feat-intro-title">Art and science of clinical intelligence. <Stethoscope size={38} style={{ verticalAlign: 'middle', display: 'inline-block', color: 'var(--pd-accent)' }} /></h2>
                    <p className="lp-feat-intro-sub">Explore how VitalPath supports better care decisions for every patient.</p>
                </div>

                {/* ── Marquee ── */}
                <div className="lp-marquee-wrap">
                    <div className="lp-marquee-track">
                        {[...Array(2)].map((_, pass) => [

                            /* ── Card A: Image ── */
                            <div key={`a-${pass}`} className="lp-mq-card lp-mq-img-card">
                                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80" alt="Healthcare" />
                                <div className="lp-mq-img-overlay">
                                    <span>AI-assisted care</span>
                                </div>
                            </div>,

                            /* ── Card B: Stat — dark teal, "Positive Negative Feedback 89%/11%" ── */
                            <div key={`b-${pass}`} className="lp-mq-card lp-mq-stat-card">
                                {/* top label stacked */}
                                <div className="lp-mq-stat-labels">
                                    <span>Positive</span>
                                    <span>Negative</span>
                                    <span>Feedback</span>
                                </div>
                                {/* bottom split bars */}
                                <div className="lp-mq-split-bars">
                                    <div className="lp-mq-split-row top-row">
                                        <span className="lp-mq-split-name">Positive</span>
                                        <span className="lp-mq-split-pct large">89%</span>
                                    </div>
                                    <div className="lp-mq-split-row bot-row">
                                        <span className="lp-mq-split-name">Negative</span>
                                        <span className="lp-mq-split-pct small">11%</span>
                                    </div>
                                </div>
                            </div>,

                            /* ── Card C: Icon — lavender, lightbulb + centered text ── */
                            <div key={`c-${pass}`} className="lp-mq-card lp-mq-icon-card">
                                <Lightbulb className="lp-mq-bulb" size={32} />
                                <p className="lp-mq-icon-text">
                                    Decision Support<br />
                                    for Triage &amp;<br />
                                    Assessment
                                </p>
                            </div>,

                            /* ── Card D: Number — green, big "550 +" style ── */
                            <div key={`d-${pass}`} className="lp-mq-card lp-mq-num-card">
                                <div className="lp-mq-numblock">
                                    <span className="lp-mq-big-num">20</span>
                                    <span className="lp-mq-num-suffix">
                                        <ChevronUp className="lp-mq-arrow-up" size={16} strokeWidth={4} />
                                        <span className="lp-mq-plus">+</span>
                                    </span>
                                </div>
                                <p className="lp-mq-num-label">Professionals<br />recommending.</p>
                            </div>,

                            /* ── Card E: Tags — peach/orange, hatch + pill tags ── */
                            <div key={`e-${pass}`} className="lp-mq-card lp-mq-tags-card">
                                <div className="lp-mq-hatch">≋ ≋ ≋ ≋ ≋</div>
                                <div className="lp-mq-tag-cloud">
                                    {[
                                        'Wellness Essentials', 'Formula',
                                        "Men's Vitals", 'Blood Sugar',
                                        'Cognitive Boost', "Complete Wellness",
                                        'Triage AI', 'Reminders',
                                    ].map(t => <span key={t} className="lp-mq-tag">{t}</span>)}
                                </div>
                            </div>,
                        ])}
                    </div>
                </div>
            </section>



            {/* ═══════════════════════════════════════════
          SOLUTIONS — Interactive tab section
      ═══════════════════════════════════════════ */}
            <section className="lp-solutions" id="solutions">
                <div className="lp-container">

                    {/* ── Top: label + heading + badge row ── */}
                    <div className="lp-label dark">SERVICES &amp; PROGRAMS</div>
                    <div className="lp-sol-top-row">
                        <h2 className="lp-h2-dark lp-sol-heading">
                            Tailored solutions<br />for your well-being.
                        </h2>
                        <div className="lp-ready-badge">
                            <span className="lp-green-pulse" />
                            Ready to help
                        </div>
                    </div>

                    {/* ── Thin divider ── */}
                    <div className="lp-sol-divider" />

                    {/* ── Two-col body ── */}
                    <div className="lp-sol-body">

                        {/* Left — big swapping image */}
                        <div className="lp-sol-left">
                            {STORIES.map((s, i) => (
                                <img
                                    key={s.num}
                                    src={s.leftImg}
                                    alt={s.title}
                                    className={`lp-sol-main-img ${activeStory === i ? 'active' : ''}`}
                                />
                            ))}
                        </div>

                        {/* Right — nav card */}
                        <div className="lp-sol-right">
                            <div className="lp-sol-card">

                                {/* Vertical tab selectors */}
                                <nav className="lp-sol-tabs">
                                    {STORIES.map((s, i) => (
                                        <button
                                            key={s.num}
                                            className={`lp-sol-tab ${activeStory === i ? 'active' : ''}`}
                                            onClick={() => setActiveStory(i)}
                                        >
                                            / {s.num}
                                        </button>
                                    ))}
                                </nav>

                                {/* Animated content area */}
                                <div className="lp-sol-content" key={activeStory}>
                                    <h3 className="lp-sol-content-title">{STORIES[activeStory].title}</h3>
                                    <p className="lp-sol-content-desc">{STORIES[activeStory].desc}</p>
                                    <div className="lp-sol-content-img-wrap">
                                        <img src={STORIES[activeStory].rightImg} alt={STORIES[activeStory].title} />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* ═══════════════════════════════════════════
          PRICING — Squishy cards & Plans
      ═══════════════════════════════════════════ */}
            <section className="lp-pricing" id="pricing text-center">
                <div className="lp-container">
                    <div className="lp-label dark">PRICING & PLANS</div>
                    <div className="lp-pricing-intro">
                        <h2 className="lp-h2-dark">Simple, scalable, clinical-first value.</h2>
                        <p className="lp-feat-intro-sub">Decision support for teams of any size. Scalable from single clinics to hospital networks.</p>
                    </div>

                    {/* ── 3 Main Plans ── */}
                    <div className="lp-pricing-grid">
                        {PRICING_PLANS.map((plan) => (
                            <motion.div
                                key={plan.name}
                                whileHover="hover"
                                transition={{ duration: 1, ease: "backInOut" }}
                                variants={{ hover: { scale: 1.05 } }}
                                className="lp-price-card"
                                style={{ backgroundColor: plan.color }}
                            >
                                <div className="lp-price-card-z">
                                    <span className="lp-price-tag">
                                        {plan.name} {plan.highlight && " • Most Popular"}
                                    </span>
                                    <motion.div
                                        initial={{ scale: 0.85 }}
                                        variants={{ hover: { scale: 1 } }}
                                        transition={{ duration: 1, ease: "backInOut" }}
                                        className="lp-price-amt"
                                    >
                                        ₹{plan.price}<span className="lp-price-freq">/mo</span>
                                    </motion.div>
                                    <p className="lp-price-best">{plan.bestFor}</p>
                                    <ul className="lp-price-features">
                                        {plan.features.map(f => (
                                            <li key={f}>• {f}</li>
                                        ))}
                                    </ul>
                                </div>
                                <button className="lp-price-btn">Get it now</button>

                                {/* Squishy SVG Background */}
                                <motion.svg
                                    width="320"
                                    height="384"
                                    viewBox="0 0 320 384"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="lp-price-sq-svg"
                                    variants={{ hover: { scale: 1.5 } }}
                                    transition={{ duration: 1, ease: "backInOut" }}
                                >
                                    <motion.circle
                                        variants={{ hover: { scaleY: 0.5, y: -25 } }}
                                        transition={{ duration: 1, ease: "backInOut", delay: 0.2 }}
                                        cx="160.5" cy="114.5" r="101.5"
                                        fill={plan.color === '#111' ? "#fff" : "#000"}
                                        fillOpacity={plan.color === '#111' ? "0.08" : "0.15"}
                                    />
                                    <motion.ellipse
                                        variants={{ hover: { scaleY: 2.25, y: -25 } }}
                                        transition={{ duration: 1, ease: "backInOut", delay: 0.2 }}
                                        cx="160.5" cy="265.5" rx="101.5" ry="43.5"
                                        fill={plan.color === '#111' ? "#fff" : "#000"}
                                        fillOpacity={plan.color === '#111' ? "0.08" : "0.15"}
                                    />
                                </motion.svg>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Trial Section ── */}
                    <div className="lp-trial-banner">
                        <div>
                            <h3>Start your clinical journey today.</h3>
                            <p>14-day free trial for clinics • 30-day pilot for hospitals • No card required.</p>
                        </div>
                        <button className="lp-dark-btn lp-btn-lg" onClick={() => navigate('/register')}>Start Free Trial</button>
                    </div>

                </div>
            </section>

            {/* ═══════════════════════════════════════════
          FOOTER — Recreated pill design
      ═══════════════════════════════════════════ */}
            <footer className="lp-footer">
                <div className="lp-footer-pill">
                    <div className="lp-footer-logo-row">
                        <h2 className="lp-footer-logo">VitalPath</h2>
                    </div>

                    <div className="lp-footer-content">
                        {/* Col 1 */}
                        <div className="lp-footer-nav-col">
                            <a href="#">Home</a>
                            <a href="#">About us</a>
                            <a href="#">Treatment</a>
                            <a href="#">Services</a>
                        </div>

                        {/* Col 2 */}
                        <div className="lp-footer-nav-col">
                            <a href="#">Useful materials</a>
                            <a href="#">Procedures</a>
                            <a href="#">Reviews</a>
                            <a href="#">Help</a>
                        </div>

                        {/* Col 3 — Contact */}
                        <div className="lp-footer-nav-col lp-footer-contact">
                            <a href="mailto:vitalpath@hi.com">vitalpath@hi.com</a>
                            <a href="tel:+16469804599">+1 646 980 45 99</a>
                            <div className="lp-footer-social-icons">
                                <div className="lp-social-sq">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.86-2.11 5.84-2.5 2.77-1.13 3.35-1.33 3.73-1.33.08 0 .27.02.39.12.1.08.13.19.14.27-.01.04.01.24 0 .38z" /></svg>
                                </div>
                                <div className="lp-social-sq">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8c0 2 1.6 3.6 3.6 3.6h8.8c2 0 3.6-1.6 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" /></svg>
                                </div>
                                <div className="lp-social-sq">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7h-2.54v-2.9h2.54v-2.21c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lp-footer-legal">
                    © 2026 VitalPath · Decision support for clinical intelligence. Not a medical device.
                </div>
            </footer>
        </div>
    );
}
