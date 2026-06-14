import { useSEO } from '../hooks/useSEO';

const sections = [
  { title: '1. Information We Collect', content: 'We collect information you provide directly (name, email, payment details), information collected automatically (IP address, browser type, pages visited, cookies), and information from third-party services (Paystack for payment processing).' },
  { title: '2. How We Use Your Information', content: 'We use your information to provide, maintain, and improve the Platform; process payments and send receipts; send course progress updates and relevant announcements; respond to support requests; detect and prevent fraud or abuse; and comply with legal obligations.' },
  { title: '3. Data Sharing', content: 'We do not sell your personal data. We share data only with: service providers acting on our behalf (e.g. Paystack, email providers), when required by law, or with your explicit consent.' },
  { title: '4. Cookies', content: 'We use essential cookies to keep you signed in and functional cookies to remember your preferences. We do not use advertising or tracking cookies. You can disable cookies in your browser, but some Platform features may not work correctly.' },
  { title: '5. Data Retention', content: 'We retain your account data for as long as your account is active. Payment records are kept for 7 years for legal compliance. You may request deletion of your personal data by contacting us.' },
  { title: '6. Your Rights', content: 'Depending on your location, you may have the right to access, correct, or delete your personal data; object to or restrict processing; data portability; and lodge a complaint with a supervisory authority. To exercise these rights, contact privacy@ebringgs.com.' },
  { title: '7. Security', content: 'We implement industry-standard security measures including TLS encryption, bcrypt password hashing, and regular security reviews. However, no system is 100% secure. Please use a strong, unique password and keep your credentials safe.' },
  { title: '8. Children\'s Privacy', content: 'The Platform is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us data, please contact us.' },
  { title: '9. International Transfers', content: 'Your data may be processed in countries outside your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable law.' },
  { title: '10. Changes to This Policy', content: 'We may update this Privacy Policy from time to time. We will notify you of significant changes. Continued use of the Platform after changes constitutes acceptance.' },
  { title: '11. Contact', content: 'For privacy questions or requests, contact us at privacy@ebringgs.com.' },
];

export default function Privacy() {
  useSEO({ title: 'Privacy Policy', description: 'Read the E-Bringgs Technologies Privacy Policy and how we handle your data.' });

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <section className="bg-linear-to-br from-slate-900 to-teal-950 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-3">Privacy Policy</h1>
        <p className="text-slate-400 text-sm">Last updated: February 2026</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-10 p-5 bg-teal-50 dark:bg-teal-950 rounded-xl border border-teal-100 dark:border-slate-800">
          Your privacy matters to us. This policy explains what data we collect, how we use it, and the choices you have. If you have any questions, please reach out at <a href="mailto:privacy@ebringgs.com" className="text-teal-600 font-medium">privacy@ebringgs.com</a>.
        </p>
        <div className="space-y-8">
          {sections.map(({ title, content }) => (
            <div key={title}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
