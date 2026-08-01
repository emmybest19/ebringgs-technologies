import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Heart, Users } from 'lucide-react';
import { useSEO, schema } from '@ebringgs/ui';

const values = [
  { icon: Target, title: 'Excellence', description: 'We hold ourselves to the highest standard in everything we deliver, code, design, or curriculum.' },
  { icon: Heart, title: 'Empowerment', description: 'We believe every person deserves access to world-class technology skills and opportunities.' },
  { icon: Users, title: 'Community', description: 'We build relationships, not just products. Our alumni and client network is our greatest asset.' },
  { icon: Eye, title: 'Transparency', description: 'Honest timelines, clear pricing, and open communication, no surprises, ever.' },
];

export default function About() {
  useSEO({
    title: 'About Us',
    description: 'Learn about E-Bringgs Technologies, our mission, and the values behind the platform.',
    keywords: ['about E-Bringgs', 'tech company Nigeria', 'software training Africa'],
    url: 'https://ebringgs.com/about',
    image: 'https://ebringgs.com/logo-full.jpg',
    imageAlt: 'About E-Bringgs Technologies',
    jsonLd: [
      schema.organization(),
      schema.breadcrumb([
        { name: 'Home', url: 'https://ebringgs.com/' },
        { name: 'About', url: 'https://ebringgs.com/about' },
      ]),
    ],
  });

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Hero */}
      <section className="no-reveal relative text-white py-28 px-4 overflow-hidden">
        <img src="/images/about/team-meeting.jpg" alt="Team meeting" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 to-teal-950/85" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-5">We're building Africa's premier tech platform</h1>
          <p className="text-slate-300 text-xl leading-relaxed">
            E-Bringgs Technologies exists to close the gap between world-class technology skills and the talented people who deserve them.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="no-reveal reveal-clip max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="reveal-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our mission</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg leading-relaxed">
              To democratise access to technology education and high-quality software services, empowering individuals and organisations across Africa and beyond to compete at a global level.
            </p>
          </div>
          <div className="reveal-right rounded-2xl overflow-hidden shadow-lg">
            <img loading="lazy" src="/images/about/mission.jpg" alt="Our mission" className="w-full h-64 object-cover" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="reveal-left rounded-2xl overflow-hidden shadow-lg order-2 md:order-1">
            <img loading="lazy" src="/images/about/office-space.jpg" alt="Our workspace" className="w-full h-64 object-cover" />
          </div>
          <div className="reveal-right order-1 md:order-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our vision</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg leading-relaxed">
              A world where geography is no barrier to a world-class tech career or a well-built digital product. We believe the next generation of great software will be built by diverse, globally distributed teams.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 dark:bg-slate-950 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-14">What we stand for</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card-hover-border bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="inline-flex p-3 bg-teal-50 dark:bg-teal-950 rounded-xl mb-4">
                  <Icon size={22} className="text-teal-600" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-600 py-20 px-4 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">Join us on the journey</h2>
        <p className="text-teal-200 mb-8 max-w-xl mx-auto">Whether you want to learn, build something, or work with us, there's a place for you at E-Bringgs.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="px-8 py-4 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors">
            Get started
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors">
            Contact us <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
