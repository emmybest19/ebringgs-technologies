import { useSEO } from '../hooks/useSEO';

const sections = [
  { title: '1. Acceptance of Terms', content: 'By accessing or using E-Bringgs Technologies ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.' },
  { title: '2. Use of the Platform', content: 'You may use the Platform only for lawful purposes and in accordance with these Terms. You agree not to use the Platform to transmit harmful, unlawful, or infringing content, to attempt to gain unauthorized access to any part of the Platform, to interfere with or disrupt the integrity or performance of the Platform, or to collect or harvest any user data without consent.' },
  { title: '3. Accounts', content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. E-Bringgs Technologies is not liable for any loss resulting from unauthorized use of your account.' },
  { title: '4. Payments & Subscriptions', content: 'All payments are processed securely via Paystack. Subscription fees are billed in advance on a monthly or annual basis. You may cancel your subscription at any time; access continues until the end of the current billing period. We offer a 7-day money-back guarantee for first-time purchases.' },
  { title: '5. Intellectual Property', content: 'All content on the Platform — including course materials, blog posts, code, and design — is owned by E-Bringgs Technologies or its content creators and is protected by copyright law. You may not reproduce, distribute, or create derivative works without written permission.' },
  { title: '6. User Content', content: 'By submitting content (assignments, forum posts, comments), you grant E-Bringgs Technologies a non-exclusive licence to use, display, and distribute that content within the Platform. You retain ownership of your content.' },
  { title: '7. Termination', content: 'We reserve the right to suspend or terminate your account if you violate these Terms. You may also terminate your account at any time by contacting support.' },
  { title: '8. Limitation of Liability', content: 'E-Bringgs Technologies shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.' },
  { title: '9. Governing Law', content: 'These Terms are governed by the laws of Ghana. Any disputes shall be resolved through binding arbitration in Accra, Ghana, unless otherwise required by applicable law.' },
  { title: '10. Changes to Terms', content: 'We may update these Terms from time to time. We will notify you of significant changes via email or a prominent notice on the Platform. Continued use after changes constitutes acceptance.' },
  { title: '11. Contact', content: 'For questions about these Terms, contact us at legal@ebringgs.com.' },
];

export default function Terms() {
  useSEO({ title: 'Terms of Service', description: 'Read the E-Bringgs Technologies Terms of Service.' });

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <section className="bg-gradient-to-br from-slate-900 to-teal-950 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-3">Terms of Service</h1>
        <p className="text-slate-400 text-sm">Last updated: February 2026</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-8">
          {sections.map(({ title, content }) => (
            <div key={title}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
