import React from 'react';
import Navbar from '../components/Navbar';

export default function PrivacyPolicy({ session }) {
  return (
    <div>
      <Navbar session={session} />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Last updated: June 15, 2026</p>

        {[
          {
            title: '1. Introduction',
            content: `MarketAI Global ("we", "us", or "our") operates the website marketai-global.vercel.app (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.`
          },
          {
            title: '2. Information We Collect',
            content: `We collect information you provide directly to us when you:
• Create an account (name, email address, business name, business type, country)
• Use our AI content generation features (business details, product information, target audience)
• Make a payment (processed securely by Razorpay or Infinity — we do not store card details)
• Contact us for support

We also automatically collect certain information when you use our Service, including your IP address, browser type, operating system, and usage data.`
          },
          {
            title: '3. How We Use Your Information',
            content: `We use the information we collect to:
• Provide, maintain, and improve our Service
• Process transactions and send related information
• Generate AI marketing content based on your inputs
• Send technical notices, updates, and support messages
• Respond to your comments and questions
• Monitor and analyze usage patterns to improve user experience
• Detect and prevent fraudulent transactions and abuse`
          },
          {
            title: '4. Data Storage and Security',
            content: `Your data is stored securely using Supabase, a trusted cloud database provider. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data transmission is encrypted using SSL/TLS technology. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`
          },
          {
            title: '5. Third-Party Services',
            content: `We use the following third-party services:
• Supabase — database and authentication
• Google OAuth — sign-in functionality
• Google Gemini AI — content generation
• Razorpay — payment processing (India)
• Infinity — international payment processing
• Vercel — website hosting

Each of these services has their own privacy policy governing the use of your information.`
          },
          {
            title: '6. Cookies',
            content: `We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data sent to your browser. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our Service may not function properly.`
          },
          {
            title: '7. Data Retention',
            content: `We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us. We will respond to deletion requests within 30 days.`
          },
          {
            title: '8. Your Rights',
            content: `You have the right to:
• Access the personal information we hold about you
• Request correction of inaccurate data
• Request deletion of your personal data
• Object to processing of your personal data
• Request restriction of processing
• Data portability

To exercise any of these rights, please contact us at the email address provided below.`
          },
          {
            title: '9. Children\'s Privacy',
            content: `Our Service is not directed to children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.`
          },
          {
            title: '10. Changes to This Policy',
            content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.`
          },
          {
            title: '11. Contact Us',
            content: `If you have any questions about this Privacy Policy, please contact us at:\n\nMarketAI Global\nEmail: marketai.global@gmail.com\nWebsite: https://marketai-global.vercel.app`
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.7rem', color: '#1e293b' }}>{section.title}</h2>
            <p style={{ color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
