import { useEffect, useRef } from "react";
import AppLogo from "./AppLogo";

const REPO = "Tolaj/clipboard_sync";
const VERSION = "1.0.0";

function getDownload() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) {
    return {
      label: "Download for macOS",
      href: `https://github.com/${REPO}/releases/download/v${VERSION}/Clipboard.Sync_${VERSION}_aarch64.dmg`,
      secondary: { label: "Intel Mac", href: `https://github.com/${REPO}/releases/download/v${VERSION}/Clipboard.Sync_${VERSION}_x64.dmg` },
    };
  }
  if (ua.includes("win")) {
    return {
      label: "Download for Windows",
      href: `https://github.com/${REPO}/releases/download/v${VERSION}/Clipboard.Sync_${VERSION}_x64-setup.exe`,
      secondary: null,
    };
  }
  if (ua.includes("linux")) {
    return {
      label: "Download for Linux",
      href: `https://github.com/${REPO}/releases/download/v${VERSION}/clipboard-sync_${VERSION}_amd64.deb`,
      secondary: { label: "AppImage", href: `https://github.com/${REPO}/releases/download/v${VERSION}/clipboard-sync_${VERSION}_amd64.AppImage` },
    };
  }
  return { label: "Download", href: `https://github.com/${REPO}/releases/latest`, secondary: null };
}

function LandingPage() {
  const dl = getDownload();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="land">
      {/* Nav */}
      <nav className="land-nav">
        <div className="land-nav-inner">
          <div className="land-nav-brand">
            <AppLogo size={26} />
            <span>Clipboard Sync</span>
          </div>
          <div className="land-nav-links">
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="land-nav-cta" href={dl.href}>Download</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="land-hero-inner">
          <div className="land-pill">End-to-end encrypted clipboard sync</div>
          <h1 className="land-title">
            Copy anywhere.<br />
            <span className="land-gradient-text">Paste everywhere.</span>
          </h1>
          <p className="land-subtitle">
            Seamlessly sync your clipboard across macOS, Windows, and Linux.
            Text, images, and code snippets — encrypted before they leave your device.
          </p>
          <div className="land-hero-actions">
            <a className="land-btn-primary" href={dl.href}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {dl.label}
            </a>
            {dl.secondary && (
              <a className="land-btn-secondary" href={dl.secondary.href}>{dl.secondary.label}</a>
            )}
            <a className="land-btn-ghost" href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Star on GitHub
            </a>
          </div>
          <p className="land-version">v{VERSION} &middot; Free &amp; open source &middot; macOS, Windows, Linux</p>
        </div>

        {/* App mockup */}
        <div className="land-mockup">
          <div className="land-mockup-window">
            <div className="land-mockup-titlebar">
              <div className="land-mockup-dots">
                <span className="dot-red" />
                <span className="dot-yellow" />
                <span className="dot-green" />
              </div>
              <span className="land-mockup-title">Clipboard Sync</span>
            </div>
            <div className="land-mockup-body">
              <div className="land-mockup-tabs">
                <span className="active">History</span>
                <span>Devices</span>
                <span>Settings</span>
              </div>
              <div className="land-mockup-clips">
                <div className="land-mockup-clip">
                  <div className="land-mockup-clip-text">const API_KEY = "sk-proj..."</div>
                  <div className="land-mockup-clip-meta">MacBook Pro &middot; just now</div>
                </div>
                <div className="land-mockup-clip">
                  <div className="land-mockup-clip-text">https://clipboard-sync-server.vercel.app</div>
                  <div className="land-mockup-clip-meta">Windows PC &middot; 2m ago</div>
                </div>
                <div className="land-mockup-clip land-mockup-clip-img">
                  <div className="land-mockup-img-placeholder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    <span>Screenshot.png</span>
                  </div>
                  <div className="land-mockup-clip-meta">MacBook Pro &middot; 5m ago</div>
                </div>
                <div className="land-mockup-clip">
                  <div className="land-mockup-clip-text">npm install @tauri-apps/api</div>
                  <div className="land-mockup-clip-meta">Linux Desktop &middot; 12m ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / trust strip */}
      <section className="land-trust reveal">
        <p>Built with technologies you trust</p>
        <div className="land-trust-logos">
          <span>Tauri</span>
          <span>React</span>
          <span>Rust</span>
          <span>MongoDB</span>
          <span>Vercel</span>
        </div>
      </section>

      {/* Features */}
      <section className="land-features" id="features">
        <div className="land-section-header reveal">
          <p className="land-section-label">Features</p>
          <h2>Everything you need to sync.<br />Nothing you don't.</h2>
          <p className="land-section-desc">A clipboard tool that respects your privacy, works across platforms, and stays out of your way.</p>
        </div>

        <div className="land-features-grid">
          <div className="land-feature-card reveal">
            <div className="land-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </div>
            <h3>Universal clipboard</h3>
            <p>Copy on your Mac, paste on your PC. Text, code, URLs — everything transfers in milliseconds.</p>
          </div>

          <div className="land-feature-card reveal">
            <div className="land-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            </div>
            <h3>Image support</h3>
            <p>Screenshots, diagrams, photos — images sync across devices just as easily as text.</p>
          </div>

          <div className="land-feature-card reveal">
            <div className="land-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3>Clipboard history</h3>
            <p>Access your last 20 clips. One click to re-copy. Never lose something you copied.</p>
          </div>

          <div className="land-feature-card reveal">
            <div className="land-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3>Zero-knowledge encryption</h3>
            <p>AES-256-GCM. The server stores encrypted blobs — no one can read your data. Not even us.</p>
          </div>

          <div className="land-feature-card reveal">
            <div className="land-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h3>Native on every platform</h3>
            <p>Built with Tauri and Rust. Lightweight, fast, and feels native on macOS, Windows, and Linux.</p>
          </div>

          <div className="land-feature-card reveal">
            <div className="land-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3>Instant device pairing</h3>
            <p>Create a group, share a code. Pair unlimited devices in seconds. No account required.</p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="land-security" id="security">
        <div className="land-security-inner">
          <div className="land-security-content reveal">
            <p className="land-section-label">Security</p>
            <h2>End-to-end encrypted.<br />By default.</h2>
            <p className="land-security-desc">Every clip is encrypted with AES-256-GCM on your device before it touches the network. The encryption key is generated locally and shared only through your pairing code.</p>
            <ul className="land-security-list">
              <li>Encryption key never leaves your devices</li>
              <li>Each message uses a unique random nonce</li>
              <li>Server stores only encrypted blobs</li>
              <li>Open source — verify it yourself</li>
            </ul>
          </div>
          <div className="land-security-visual reveal">
            <div className="land-encrypt-flow">
              <div className="land-encrypt-node">
                <div className="land-encrypt-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <span className="land-encrypt-label">Your device</span>
                <code>"Hello World"</code>
              </div>
              <div className="land-encrypt-arrow">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><line x1="0" y1="12" x2="34" y2="12" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3"/><polyline points="30,7 36,12 30,17" stroke="#d1d5db" strokeWidth="1.5" fill="none"/></svg>
              </div>
              <div className="land-encrypt-node land-encrypt-node-lock">
                <div className="land-encrypt-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <span className="land-encrypt-label">AES-256-GCM</span>
                <code>k3x9Qm7_nR4...</code>
              </div>
              <div className="land-encrypt-arrow">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><line x1="0" y1="12" x2="34" y2="12" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3"/><polyline points="30,7 36,12 30,17" stroke="#d1d5db" strokeWidth="1.5" fill="none"/></svg>
              </div>
              <div className="land-encrypt-node">
                <div className="land-encrypt-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                </div>
                <span className="land-encrypt-label">Server</span>
                <code>Encrypted blob</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="land-how">
        <div className="land-section-header reveal">
          <p className="land-section-label">How it works</p>
          <h2>Set up in under a minute.</h2>
        </div>
        <div className="land-steps">
          <div className="land-step reveal">
            <div className="land-step-num">1</div>
            <h3>Install the app</h3>
            <p>Download for your platform. Under 10MB, no account needed.</p>
          </div>
          <div className="land-step-divider" />
          <div className="land-step reveal">
            <div className="land-step-num">2</div>
            <h3>Create a group</h3>
            <p>One click generates a secure pairing code with your encryption key.</p>
          </div>
          <div className="land-step-divider" />
          <div className="land-step reveal">
            <div className="land-step-num">3</div>
            <h3>Start syncing</h3>
            <p>Enter the code on your other devices. Clipboard sync begins instantly.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="land-cta reveal">
        <div className="land-cta-inner">
          <h2>Ready to sync your clipboard?</h2>
          <p>Free, open source, and built for privacy.</p>
          <div className="land-cta-actions">
            <a className="land-btn-primary" href={dl.href}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {dl.label}
            </a>
            <a className="land-btn-secondary" href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer">
              View source on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-footer-brand">
            <AppLogo size={22} />
            <span>Clipboard Sync</span>
          </div>
          <div className="land-footer-links">
            <a href={`https://github.com/${REPO}`}>GitHub</a>
            <a href={`https://github.com/${REPO}/releases`}>Releases</a>
            <a href={`https://github.com/${REPO}/issues`}>Report a bug</a>
          </div>
          <p className="land-footer-copy">&copy; {new Date().getFullYear()} Clipboard Sync &middot; Open source under MIT</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
