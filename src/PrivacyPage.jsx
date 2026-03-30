import './LegalPage.css'

export default function PrivacyPage({ onBack }) {
  return (
    <div className="legal">
      <div className="legal-inner">
        <button className="legal-back" onClick={onBack}>
          ← Back
        </button>

        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated: 30 March 2026</p>

        <div className="legal-section">
          <h2>Who controls your data</h2>
          <p>Arpad Toth (autónomo, Spain). Contact: <a href="mailto:legal.nourishmind@gmail.com">legal.nourishmind@gmail.com</a></p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>What data we collect</h2>
          <p>We collect information you share in conversations with Noor, including food habits, preferences, and any personal details you choose to share. We also collect your email address and payment information when you subscribe.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>How we use your data</h2>
          <p>Your conversation data is used solely to personalise your experience with Noor. Payment data is processed by Stripe and never stored by us. We do not sell your data to third parties.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Third party services</h2>
          <p>We use Anthropic to power Noor's AI responses, Stripe for payment processing, and Vercel for hosting. Each has their own privacy policy.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Data retention</h2>
          <p>Your conversation memory is stored to provide continuity across sessions. You may request deletion of your data at any time by contacting <a href="mailto:legal.nourishmind@gmail.com">legal.nourishmind@gmail.com</a>.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Your rights under GDPR</h2>
          <p>You have the right to access, correct, delete, and export your personal data. Contact <a href="mailto:legal.nourishmind@gmail.com">legal.nourishmind@gmail.com</a>. We will respond within 30 days.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Cookies</h2>
          <p>NourishMind uses minimal cookies necessary for the service to function. We do not use advertising or tracking cookies.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Children</h2>
          <p>NourishMind is not intended for users under 18. We do not knowingly collect data from minors.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Changes</h2>
          <p>We may update this policy at any time and will notify users of significant changes by email.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Contact</h2>
          <p>Arpad Toth — <a href="mailto:legal.nourishmind@gmail.com">legal.nourishmind@gmail.com</a></p>
        </div>
      </div>
    </div>
  )
}
