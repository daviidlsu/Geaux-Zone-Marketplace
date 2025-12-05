import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles, MapPin } from "lucide-react";

export default function LandingPage() {
  const reveals = useRef<HTMLElement[]>([]);
  const navigate = useNavigate();
  const aboutSectionRef = useRef<HTMLElement | null>(null);
  const featuresSectionRef = useRef<HTMLElement | null>(null);

  const [trackHeight] = useState<number>(60);
  const [hideScrollIndicator] = useState<boolean>(false);

  // Reveal sections on scroll
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      reveals.current.forEach((el) => el.classList.add("reveal-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    reveals.current.forEach((el) => observer.observe(el));

    return () => {
      reveals.current.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  


  const setRevealRef = (el: HTMLElement | null) => {
    if (el && !reveals.current.includes(el)) reveals.current.push(el);
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844] overflow-x-hidden">
      {/* floating subtle background blobs + grid */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <svg
          className="absolute left-[-10%] top-[-10%] w-[60vw] h-[60vh] opacity-30 animate-blob-slow"
          viewBox="0 0 600 600"
        >
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#46207e" />
              <stop offset="100%" stopColor="#f2b200" />
            </linearGradient>
          </defs>
          <g transform="translate(300,300)">
            <path
              fill="url(#g1)"
              d="M120,-150C160,-120,190,-80,200,-40C210,0,200,40,170,80C140,120,100,150,60,170C20,190,-30,200,-70,180C-110,160,-140,120,-160,80C-180,40,-190,0,-180,-40C-170,-80,-140,-120,-100,-150C-60,-180,-30,-200,10,-200C50,-200,80,-180,120,-150Z"
            />
          </g>
        </svg>

        <svg
          className="absolute right-[-5%] bottom-[-5%] w-[50vw] h-[50vh] opacity-20 animate-blob-slower"
          viewBox="0 0 600 600"
        >
          <defs>
            <linearGradient id="g2" x1="0" x2="1">
              <stop offset="0%" stopColor="#f2b200" />
              <stop offset="100%" stopColor="#6b2fb5" />
            </linearGradient>
          </defs>
          <g transform="translate(300,300)">
            <path
              fill="url(#g2)"
              d="M100,-130C140,-110,170,-70,190,-30C210,10,210,60,180,100C150,140,100,170,50,190C0,210,-40,220,-80,200C-120,180,-150,140,-170,100C-190,60,-190,10,-180,-30C-170,-70,-140,-110,-100,-130C-60,-150,-30,-160,10,-170C50,-180,80,-160,100,-130Z"
            />
          </g>
        </svg>

        {/* faint grid */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff1a 1px, transparent 1px), linear-gradient(90deg, #ffffff1a 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header / Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-3">
          <a
           className="flex items-center gap-3">
            <img
              src="/geauxzone_tiger.png"
              alt="TigerTrade logo"
              className="w-10 h-10 md:w-12 md:h-12 object-contain"
            />
            <span
              className="text-base font-semibold"
              style={{ fontFamily: "Rock Salt, cursive" }}
            >
              TigerTrade
            </span>
          </a>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <a href="#features" className="text-white/80 hover:text-white transition">
            Features
          </a>
          <a href="#about" className="text-white/80 hover:text-white transition">
            About
          </a>
          <a
            onClick={() => navigate("/register")}
            className="px-4 py-2 rounded-md bg-[#f2b200] text-[#41206a] font-semibold hover:brightness-95 transition shadow-sm"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* HERO */}
      <header className="max-w-6xl mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left column: text */}
          <div>
            <h1
              className="text-4xl md:text-5xl font-extrabold leading-tight md:leading-[1.1] tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, #FDD023 0%, #FFFFFF 100%)",
              }}
            >
              Buy. Sell. Geaux — the LSU way.
            </h1>
            <p className="mt-6 text-lg text-white/85 max-w-xl">
              A trusted campus marketplace built by and for Tigers — verified LSU logins, safe
              meet-up spots, smart pricing suggestions, and student-only deals.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                onClick={() => navigate("/listings")}
                className="inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-[#FDD023] text-[#41206a] font-semibold shadow-lg hover:translate-y-[-2px] hover:shadow-[0_18px_45px_rgba(0,0,0,0.55)] transition"
              >
                Geaux Shop
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-lg border border-white/20 text-white/90 hover:bg-white/5 transition"
              >
                See what sets us apart
              </a>
            </div>

            <div className="mt-6 text-sm text-white/65">
              Trusted by students across campus — built during 2025 by LSU students.
              <span className="ml-2 text-white/85">No ads, just community.</span>
            </div>

            {/* Scroll indicator (desktop): follows sections */}
            {!hideScrollIndicator && (
              <div className="mt-10 hidden md:flex flex-col items-start gap-3 text-xs text-white/70">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FDD023] animate-pulse" />
                  Scroll to see how it works
                </span>

                <div className="relative flex items-start">
                  <div
                    className="w-[4px] bg-gradient-to-b from-white/90 via-white/60 to-[#FDD023] rounded-full overflow-hidden"
                    style={{ height: `${trackHeight}px` }}
                  >
                    <div className="scroll-dot" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column: spotlight card */}
          <div className="relative">
            {/* status pill */}
            <div className="absolute -top-6 left-4 text-xs text-white/70 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.35)]" />
              Live campus listings
            </div>

            {/* device-style frame */}
            <div className="w-full h-[360px] md:h-[420px] rounded-3xl bg-gradient-to-br from-white/40 via-white/10 to-[#7f5af0]/30 p-[1px] shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
              <div className="w-full h-full rounded-3xl bg-[#150b24]/95 border border-white/10 p-6 backdrop-blur-md flex flex-col gap-5 justify-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#f2b200] flex items-center justify-center text-[#41206a] font-bold">
                    LSU
                  </div>
                  <div>
                    <div className="text-sm text-white/85 font-semibold">
                      Student Spotlight
                    </div>
                    <div className="text-xs text-white/70">
                      &quot;Sold my couch in 2 days — thanks TigerTrade!&quot;
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  {[
                    { title: "MacBook Air", price: "$450", tag: "Electronics" },
                    { title: "Textbooks Bundle", price: "$28", tag: "Books" },
                    { title: "Dorm Fridge", price: "$60", tag: "Dorm" },
                    { title: "Game Day Shirt", price: "$15", tag: "Apparel" },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="p-3 rounded-xl bg-white/3 border border-white/10 flex flex-col gap-1"
                    >
                      <div className="flex justify-between text-[10px] text-white/55 uppercase tracking-wide">
                        <span>{item.tag}</span>
                        <span className="text-white/35">Featured</span>
                      </div>
                      <div className="text-sm font-semibold text-white/95">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#FDD023] font-semibold">
                        {item.price}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-xs text-white/55">
                  Quick preview of campus listings — log in to see more.
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ABOUT */}
      <section
        id="about"
        ref={(el) => {
          setRevealRef(el);
          aboutSectionRef.current = el;
        }}
        className="reveal reveal-hidden max-w-5xl mx-auto px-6 py-20"
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold">About TigerTrade</h3>
            <p className="mt-4 text-white/80">
              TigerTrade simplifies student life — buy textbooks, sell dorm furniture, swap
              game day gear. LSU email verification keeps the community safe.
            </p>
            <p className="mt-4 text-white/70">
              Our mission: a campus-first marketplace that&apos;s simple, private, and trusted.
            </p>
          </div>

          <div className="space-y-4">
            <div className="listing-card p-6 rounded-xl bg-white/4 border border-white/5">
              <div className="text-sm font-semibold">Verified Community</div>
              <div className="text-sm text-white/70 mt-2">
                Only LSU emails can sign up — less spam, more trust.
              </div>
            </div>
            <div className="listing-card p-6 rounded-xl bg-white/4 border border-white/5">
              <div className="text-sm font-semibold">Safe Meet-Ups</div>
              <div className="text-sm text-white/70 mt-2">
                Suggested campus meet-up spots with optional check-in.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        ref={(el) => {
          setRevealRef(el);
          featuresSectionRef.current = el;
        }}
        className="reveal reveal-hidden max-w-6xl mx-auto px-6 py-24"
      >
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold">What sets us apart</h3>
          <p className="mt-3 text-white/80 max-w-2xl mx-auto">
            Campus-first features that make buying and selling easy, safe, and social.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="LSU Email Verified"
            desc="Sign up with @lsu.edu — verified profiles reduce scams."
            Icon={ShieldCheck}
          />
          <FeatureCard
            title="Smart Pricing"
            desc="AI-backed price suggestions and historical trends."
            Icon={Sparkles}
          />
          <FeatureCard
            title="Safe Meet-Up Map"
            desc="Hand-picked safe spots across campus for exchanges."
            Icon={MapPin}
          />
        </div>
      </section>

      {/* CTA / Footer */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 blur-3xl opacity-30 bg-[radial-gradient(circle_at_top,#FDD023_0,transparent_55%)]" />
          <div className="relative rounded-2xl bg-white/5 p-8 md:p-10 border border-white/10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <h3 className="text-xl md:text-2xl font-bold">
              Ready to join the Tiger community?
            </h3>
            <p className="mt-3 text-white/80">
              Create an account with your LSU email to start buying and selling today.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
              <a
                onClick={() => navigate("/register")}
                className="px-6 py-3 rounded-lg bg-[#FDD023] text-[#41206a] font-semibold shadow-md hover:shadow-[0_18px_45px_rgba(0,0,0,0.55)] hover:translate-y-[-1px] transition"
              >
                Join with LSU Email
              </a>
              <a
                className="px-6 py-3 rounded-lg border border-white/15 text-white/90 hover:bg-white/5 transition"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-sm text-white/60 text-center">
          © {new Date().getFullYear()} TigerTrade — Built for LSU students • Privacy • Safety
        </footer>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rock+Salt&family=Inter:wght@400;500;600;700&display=swap');

        body {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* subtle blob animations */
        @keyframes blob-slow {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes blob-slower {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-blob-slow { animation: blob-slow 10s ease-in-out infinite; transform-origin: center; }
        .animate-blob-slower { animation: blob-slower 14s ease-in-out infinite; transform-origin: center; }

        /* reveal utility */
        .reveal-hidden {
          opacity: 0;
          transform: translateY(16px) scale(0.995);
          transition: opacity 700ms ease, transform 700ms cubic-bezier(.22,1,.36,1);
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* subtle glass / card polish */
        .bg-white\\/3 { background-color: rgba(255,255,255,0.03); }
        .bg-white\\/4 { background-color: rgba(255,255,255,0.04); }

        /* Hover scale & golden glow */
        .listing-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .listing-card:hover {
          transform: scale(1.04);
          box-shadow: 0 0 18px rgba(255, 215, 0, 0.55), 0 0 32px rgba(255, 215, 0, 0.35);
          border-color: rgba(253, 208, 35, 0.75);
        }

        /* small responsive tweaks */
        @media (max-width: 640px) {
          header h1 { font-size: 1.75rem; }
        }

        /* scroll indicator */
        @keyframes scrollDot {
          0% {
            transform: translateY(-15%);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(115%);
            opacity: 0;
          }
        }

        .scroll-dot {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #FDD023;
          box-shadow:
            0 0 10px rgba(253, 208, 35, 0.95),
            0 0 22px rgba(253, 208, 35, 0.8);
          margin-left: -4px; /* centers the 12px dot over the 4px track */
          animation: scrollDot 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  desc: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function FeatureCard({ title, desc, Icon }: FeatureCardProps) {
  return (
    <div className="p-6 rounded-xl bg-white/4 border border-white/5 listing-card">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#FDD023]/10 flex items-center justify-center border border-[#FDD023]/40">
          <Icon className="w-4 h-4 text-[#FDD023]" />
        </div>
        <div>
          <div className="text-lg font-semibold text-white/95">{title}</div>
          <div className="mt-2 text-sm text-white/70">{desc}</div>
        </div>
      </div>
    </div>
  );
}
