import './WelcomeScreen.css'

export default function WelcomeScreen({ onStart, onTerms, onPrivacy }) {
  return (
    <div className="welcome">
      <div className="welcome-inner">

        {/* 1. Logo bar */}
        <header className="welcome-brand">
          <img src="/NM-icon.png" alt="NourishMind" className="welcome-nm-logo" />
          <span className="welcome-wordmark">NourishMind</span>
        </header>

        {/* 2. Eyebrow */}
        <p className="welcome-eyebrow">AI-Powered Longevity Science</p>

        {/* 3. Headline */}
        <h1 className="welcome-headline">
          The truths about food<br />
          that change<br />
          <span className="welcome-headline-gold">everything.</span>
        </h1>

        {/* 4. Divider */}
        <div className="welcome-divider" />

        {/* 5. Avatar + name */}
        <div className="welcome-avatar-block">
          <div className="welcome-avatar-glow">
            <img
              src="/noor-avatar.png"
              alt="Noor"
              className="welcome-avatar"
            />
          </div>
          <p className="welcome-avatar-name">Noor</p>
          <p className="welcome-avatar-role">Your NourishMind companion</p>
        </div>

        {/* 6. Quote */}
        <p className="welcome-quote">
          "Once you know it, you can't unknow it."
        </p>

        {/* 7. CTA */}
        <div className="welcome-cta">
          <button className="welcome-btn" onClick={onStart}>
            Start the conversation →
          </button>
        </div>

        {/* 8. Subtext */}
        <p className="welcome-subtext">No forms. No meal plans. No calorie counting.</p>

        {/* 9. Pillars */}
        <p className="welcome-pillars">
          Longevity science · What the industry hides · Your companion
        </p>

        {/* 10. Footer */}
        <footer className="welcome-footer">
          <button className="welcome-footer-link" onClick={onTerms}>Terms of Service</button>
          <span className="welcome-footer-sep">·</span>
          <button className="welcome-footer-link" onClick={onPrivacy}>Privacy Policy</button>
        </footer>

      </div>
    </div>
  )
}
