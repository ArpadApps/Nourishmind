import './LegalPage.css'

export default function TermsPage({ onBack }) {
  return (
    <div className="legal">
      <div className="legal-inner">
        <button className="legal-back" onClick={onBack}>
          ← Back
        </button>

        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-updated">Last updated: 30 March 2026</p>

        <div className="legal-section">
          <h2>Who we are</h2>
          <p>NourishMind is operated by Arpad Toth, a self-employed individual (autónomo) registered in Spain. Contact: <a href="mailto:legal.nourishmind@gmail.com">legal.nourishmind@gmail.com</a></p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>What NourishMind is</h2>
          <p>NourishMind provides an AI-powered nutrition companion called Noor. It is an educational and informational service only. Nothing Noor says constitutes medical, dietary, or clinical advice. Always consult a qualified health professional before making changes to your diet or health routine.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Eligibility</h2>
          <p>You must be at least 18 years old to use NourishMind.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Free Trial</h2>
          <p>New users receive a 7-day free trial with up to 20 messages per day. No payment is required to start the trial.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Subscriptions and Payment</h2>
          <p>Pro subscription is $12.99 per month or $99.99 per year, charged via Stripe. Your subscription renews automatically until cancelled. You can cancel at any time.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Refund Policy</h2>
          <p>Due to the digital nature of this service, we do not offer refunds after 48 hours of your first charge. Contact <a href="mailto:legal.nourishmind@gmail.com">legal.nourishmind@gmail.com</a> within 48 hours if you believe you have been charged in error.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Message Limits</h2>
          <p>Free trial users may send up to 20 messages per day. Pro subscribers may send up to 50 messages per day. Limits reset at midnight in your local timezone.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Acceptable Use</h2>
          <p>You agree not to misuse the service, attempt to bypass usage limits, reverse engineer the application, or use it for any unlawful purpose.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Intellectual Property</h2>
          <p>All content, design, and technology within NourishMind is the property of Arpad Toth. You may not copy, reproduce, or distribute any part of the service without written permission.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Disclaimer</h2>
          <p>NourishMind is provided as-is. We make no guarantees regarding availability, accuracy, or fitness for a particular purpose.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Arpad Toth shall not be liable for any indirect, incidental, or consequential damages arising from your use of NourishMind.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Governing Law</h2>
          <p>These terms are governed by the laws of Spain. Any disputes shall be resolved in the courts of Ibiza, Baleares, Spain.</p>
        </div>

        <div className="legal-divider" />

        <div className="legal-section">
          <h2>Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance.</p>
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
