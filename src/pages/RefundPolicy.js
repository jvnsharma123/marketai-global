import React from 'react';
import Navbar from '../components/Navbar';

export default function RefundPolicy({ session }) {
  return (
    <div>
      <Navbar session={session} />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Refund Policy</h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Last updated: June 15, 2026</p>

        {[
          {
            title: '1. Overview',
            content: `At MarketAI Global, we want you to be completely satisfied with our Service. This Refund Policy outlines the conditions under which we offer refunds for our subscription plans. Please read this policy carefully before making a purchase.`
          },
          {
            title: '2. 7-Day Money-Back Guarantee',
            content: `We offer a 7-day money-back guarantee for all paid plans (Starter and Pro). If you are not satisfied with our Service for any reason within 7 days of your first payment, you may request a full refund. To be eligible:
• The refund request must be made within 7 days of the initial subscription payment
• This applies to first-time subscribers only
• The guarantee does not apply to renewal payments`
          },
          {
            title: '3. Eligibility for Refunds',
            content: `Refunds may be granted in the following situations:
• Within 7 days of initial purchase (money-back guarantee)
• Technical issues that prevent you from using the Service, if we are unable to resolve them within 72 hours
• Duplicate charges due to payment processing errors
• Charges made after a confirmed cancellation

Refunds will NOT be granted for:
• Change of mind after 7 days
• Partial month usage
• Violation of our Terms and Conditions
• Accounts terminated due to policy violations`
          },
          {
            title: '4. How to Request a Refund',
            content: `To request a refund, please contact us within the eligible period:

Email: marketai.global@gmail.com
Subject: Refund Request — [Your Email]

Please include:
• Your registered email address
• Date of payment
• Reason for refund request
• Payment transaction ID

We will review your request and respond within 2 business days.`
          },
          {
            title: '5. Refund Processing',
            content: `Once your refund is approved:
• Refunds for INR payments (Razorpay) will be credited to your original payment method within 5-7 business days
• Refunds for USD payments (Infinity) will be processed within 7-10 business days
• The exact timing depends on your bank or card issuer

You will receive an email confirmation once your refund has been processed.`
          },
          {
            title: '6. Cancellation Policy',
            content: `You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period. You will continue to have access to paid features until the end of the period you have paid for. We do not offer prorated refunds for cancellations mid-period after the 7-day guarantee window.`
          },
          {
            title: '7. Free Plan',
            content: `Our Free plan is available at no cost and does not require payment. No refunds are applicable to the Free plan as no payment is made.`
          },
          {
            title: '8. Changes to This Policy',
            content: `We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated date. Continued use of our Service after changes constitutes acceptance of the updated policy.`
          },
          {
            title: '9. Contact Us',
            content: `For any questions about our Refund Policy or to submit a refund request, please contact us:\n\nMarketAI Global\nEmail: marketai.global@gmail.com\nWebsite: https://marketai-global.vercel.app\nResponse time: Within 2 business days`
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
