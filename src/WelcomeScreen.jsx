import './WelcomeScreen.css'

function NoorN() {
  return (
    <img
      src="/noor-avatar.png"
      alt="Noor"
      className="noor-n-avatar"
    />
  )
}

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="welcome">
      <div className="welcome-inner">
        <header className="welcome-brand">
          <div className="nm-logo" aria-hidden="true"><span>NM</span></div>
          <span className="welcome-wordmark">NourishMind</span>
        </header>

        <div className="welcome-hero">
          <p className="welcome-eyebrow">AI-Powered Longevity Science</p>
          <h1 className="welcome-headline">
            The truths about food<br />
            that change<br />
            everything.
          </h1>
          <p className="welcome-sub">
            For decades, what influenced what we ate was marketing — never designed to give your body what it actually needs to stay healthy long term. Noor updates you with the latest research, simply and clearly. Not a diet app. A permanent shift in how you think.
          </p>
        </div>

        <div className="welcome-quote-block">
          <div className="welcome-quote-noor">
            <NoorN />
            <div className="welcome-quote-meta">
              <span className="welcome-cite-name">Noor</span>
              <span className="welcome-cite-role">Your health companion</span>
            </div>
          </div>
          <blockquote className="welcome-quote">
            Once you know it, you can't unknow it.
          </blockquote>
        </div>

        <div className="welcome-cta">
          <button className="welcome-btn" onClick={onStart}>
            Start the conversation
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="welcome-reassurance">No forms. No meal plans. No calorie counting.</p>
        </div>

        <div className="welcome-pillars">
          <div className="pillar">
            <div className="pillar-dot" />
            <span>Longevity science</span>
          </div>
          <div className="pillar-divider" />
          <div className="pillar">
            <div className="pillar-dot" />
            <span>What the industry hides</span>
          </div>
          <div className="pillar-divider" />
          <div className="pillar">
            <div className="pillar-dot" />
            <span>Your companion</span>
          </div>
        </div>
      </div>
    </div>
  )
}
