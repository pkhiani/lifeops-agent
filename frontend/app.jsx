const { useState, useEffect, useRef, useLayoutEffect } = React;

// --- Components ---

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[90%] max-w-4xl px-8 py-4 rounded-full flex items-center justify-between border ${scrolled ? 'bg-offwhite/60 backdrop-blur-xl border-black/10' : 'bg-transparent border-transparent text-white'
            }`}>
            <div className="text-xl font-bold tracking-tighter">LIFEOPS</div>
            <div className="hidden md:flex gap-8 text-sm font-medium">
                <a href="#features" className="hover:opacity-60 transition-opacity">Features</a>
                <a href="#philosophy" className="hover:opacity-60 transition-opacity">Philosophy</a>
                <a href="#protocol" className="hover:opacity-60 transition-opacity">Protocol</a>
            </div>
            <button className="btn-magnetic bg-signal text-white px-6 py-2 rounded-full text-sm font-bold flex items-center group">
                <span className="btn-layer"></span>
                <span className="btn-text">Get Started</span>
            </button>
        </nav>
    );
};

const Hero = () => {
    const heroRef = useRef();

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from(".hero-content > *", {
                y: 60,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: "power3.out"
            });
        }, heroRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={heroRef} className="relative h-[100dvh] w-full bg-black overflow-hidden flex flex-col justify-end p-8 md:p-20">
            <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070"
                className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale"
                alt="Brutalist Architecture"
            />
            <div className="absolute inset-0 hero-gradient"></div>

            <div className="hero-content relative z-10 max-w-5xl">
                <h1 className="text-white">
                    <span className="block text-4xl md:text-6xl font-bold leading-tight tracking-tighter mb-2">Navigate the</span>
                    <span className="block text-7xl md:text-[10rem] font-drama leading-none text-signal">Migration Chaos.</span>
                </h1>
                <p className="text-white/60 text-lg md:text-2xl mt-8 max-w-2xl font-light">
                    LifeOps is an AI-powered navigator that turns complex immigration transitions into clear, actionable steps. Speak your mind, we'll handle the logistics.
                </p>
                <div className="mt-12">
                    <button className="btn-magnetic bg-signal text-white px-10 py-5 rounded-full text-lg font-bold">
                        <span className="btn-layer"></span>
                        <span className="btn-text">Initialize Protocol</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

const Features = () => {
    return (
        <section id="features" className="py-32 px-8 bg-offwhite">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1: Context Awareness */}
                    <div className="bg-paper p-10 rounded-brutalist h-[500px] flex flex-col justify-between border border-black/5 hover:shadow-2xl transition-all duration-500">
                        <div>
                            <div className="w-12 h-12 bg-signal/10 rounded-full flex items-center justify-center mb-6">
                                <i data-lucide="brain-circuit" className="text-signal w-6 h-6"></i>
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Intent Engine</h3>
                            <p className="text-black/60">Understands context, emotions, and the nuances of your unique situation without rigid forms.</p>
                        </div>
                        <div className="diagnostic-shuffler h-40 relative flex items-center justify-center overflow-hidden bg-black/5 rounded-2xl">
                            <div className="shuffler-track flex flex-col gap-4 animate-shuffle">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white px-6 py-4 rounded-xl shadow-sm border border-black/5 font-data text-xs">
                                        {i === 1 && "ANALYZE_EMOTIONAL_CONTEXT: ACTIVE"}
                                        {i === 2 && "DETECT_VISA_SUBTEXT: MATCH_FOUND"}
                                        {i === 3 && "INTENT_MAPPING: PRIORITY_HIGH"}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Automation */}
                    <div className="bg-paper p-10 rounded-brutalist h-[500px] flex flex-col justify-between border border-black/5">
                        <div>
                            <div className="w-12 h-12 bg-signal/10 rounded-full flex items-center justify-center mb-6">
                                <i data-lucide="zap" className="text-signal w-6 h-6"></i>
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Auto-Action</h3>
                            <p className="text-black/60">LifeOps automatically identifies required actions, deadlines, and missing documents.</p>
                        </div>
                        <div className="telemetry-view bg-black p-6 rounded-2xl font-data text-signal text-xs overflow-hidden h-40 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-signal rounded-full animate-pulse"></div>
                                <span>LIVE TELEMETRY</span>
                            </div>
                            <div className="typing-effect h-20 text-[10px] leading-relaxed">
                                > scanning document store...<br />
                                > missing item detected: I-94<br />
                                > generating timeline...<br />
                                > deadline: OCT 24, 2026
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Monitoring */}
                    <div className="bg-paper p-10 rounded-brutalist h-[500px] flex flex-col justify-between border border-black/5">
                        <div>
                            <div className="w-12 h-12 bg-signal/10 rounded-full flex items-center justify-center mb-6">
                                <i data-lucide="eye" className="text-signal w-6 h-6"></i>
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Zero-Hesitation</h3>
                            <p className="text-black/60">Monitor tasks and complete them without hesitation and on time, backed by real-time guidance.</p>
                        </div>
                        <div className="protocol-scheduler bg-offwhite/50 p-4 rounded-2xl h-40 relative overflow-hidden">
                            <div className="grid grid-cols-7 gap-2 h-full">
                                {[...Array(28)].map((_, i) => (
                                    <div key={i} className={`rounded-sm ${i === 14 ? 'bg-signal shadow-[0_0_10px_#E63B2E]' : 'bg-black/5'}`}></div>
                                ))}
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                <i data-lucide="cursor" className="w-6 h-6 text-black/40"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Philosophy = () => {
    return (
        <section id="philosophy" className="bg-black py-40 px-8 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1541829070764-84a7d30dee3f?auto=format" className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale" />
            <div className="max-w-5xl mx-auto relative z-10 text-center">
                <p className="text-paper/40 text-xl md:text-2xl mb-12">
                    Most immigration tools focus on: <span className="text-paper/80 italic">filling out rigid forms.</span>
                </p>
                <h2 className="text-white text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9]">
                    We focus on: <br />
                    <span className="font-drama text-signal italic">Human intent.</span>
                </h2>
            </div>
        </section>
    );
};

const Protocol = () => {
    return (
        <section id="protocol" className="bg-offwhite py-32 px-8">
            <div className="max-w-4xl mx-auto">
                <div className="space-y-[30vh]">
                    {[
                        { step: "01", title: "Ingest intent", desc: "Speak naturally. We extract the raw data from your narrative." },
                        { step: "02", title: "Extract constraints", desc: "Our engine maps your situation against current policy benchmarks." },
                        { step: "03", title: "Execute flow", desc: "Automated logistics and verified document preparation." }
                    ].map((item, idx) => (
                        <div key={idx} className="card-item flex-col items-start p-20 shadow-xl">
                            <span className="font-data text-signal text-xl mb-6">{item.step}</span>
                            <h4 className="text-6xl font-bold mb-6 tracking-tighter">{item.title}</h4>
                            <p className="text-2xl text-black/60 max-w-xl">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="bg-black rounded-t-[4rem] py-20 px-8 text-white mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div>
                <h2 className="text-3xl font-bold tracking-tighter mb-4">LIFEOPS</h2>
                <div className="flex items-center gap-2 font-data text-xs text-signal">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    SYSTEM OPERATIONAL
                </div>
            </div>
            <div className="flex gap-20">
                <div className="flex flex-col gap-4 text-sm text-white/60">
                    <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                </div>
                <div className="flex flex-col gap-4 text-sm text-white/60">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                </div>
            </div>
        </div>
    </footer>
);

const App = () => {
    useEffect(() => {
        // Initialize Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // GSAP ScrollAnimations
        gsap.registerPlugin(ScrollTrigger);

        // Protocol Card Stacking
        const cards = document.querySelectorAll(".card-item");
        cards.forEach((card, i) => {
            if (i > 0) {
                gsap.to(cards[i - 1], {
                    scrollTrigger: {
                        trigger: card,
                        start: "top bottom",
                        end: "top top",
                        scrub: true
                    },
                    scale: 0.9,
                    filter: "blur(10px)",
                    opacity: 0.5
                });
            }
        });
    }, []);

    return (
        <div className="relative">
            <Navbar />
            <Hero />
            <Features />
            <Philosophy />
            <Protocol />
            <Footer />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
