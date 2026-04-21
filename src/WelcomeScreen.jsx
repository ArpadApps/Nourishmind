import './WelcomeScreen.css'

export default function WelcomeScreen({ onStart, onTerms, onPrivacy }) {
  return (
    <div className="welcome">
      <div className="welcome-inner">

        <div className="welcome-brand">
          <img src="/NM-icon.png" alt="NourishMind" className="welcome-nm-logo" />
          <span className="welcome-wordmark">NourishMind</span>
        </div>

        <p className="welcome-eyebrow">Your nutrition companion</p>

        <h1 className="welcome-headline">
          Meet <span className="welcome-headline-gold">Noor</span>
        </h1>

        <div className="welcome-divider" />

        <div className="welcome-avatar-block">
          <div className="welcome-avatar-glow">
            <img src="/noor-avatar.png" alt="Noor" className="welcome-avatar" />
          </div>
          <p className="welcome-avatar-name">Noor</p>
          <p className="welcome-avatar-role">AI Nutrition Companion</p>
        </div>

        <p className="welcome-quote">
          "Most of what people believe about food comes from marketing, not science."
        </p>

        <div className="welcome-cta">
          <button className="welcome-btn" onClick={onStart}>
            Start the conversation
          </button>
        </div>

        <p className="welcome-subtext">No forms. No meal plans. No tracking.</p>

        <p className="welcome-pillars">Food science · Longevity · Real ingredients</p>

        <div className="welcome-footer">
          <button className="welcome-footer-link" onClick={onTerms}>Terms of Service</button>
          <span className="welcome-footer-sep">·</span>
          <button className="welcome-footer-link" onClick={onPrivacy}>Privacy Policy</button>
        </div>

      </div>
    </div>
  )
}
