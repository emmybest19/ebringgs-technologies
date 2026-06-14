import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Heart, Users } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const ceo = {
  name: 'Kofi Mensah',
  role: 'Founder & CEO',
  bio: 'Full-stack engineer with 10 years building products across Africa and Europe.',
  photo: '/images/team/ceo.jpg',
};

const teamMembers = [
  { name: 'Amara Diallo', role: 'Head of Data Science', bio: 'PhD researcher turned ML engineer. Passionate about data-driven decision making.', photo: '/images/team/data-lead.jpg' },
  { name: 'Fatima Nkosi', role: 'Head of Design', bio: 'Award-winning UX designer specialising in inclusive, accessible digital products.', photo: '/images/team/design-lead.jpg' },
  { name: 'Seun Adeleke', role: 'Lead Backend Engineer', bio: 'Infrastructure and API specialist with deep expertise in scalable systems.', photo: '/images/team/backend-lead.jpg' },
];

const values = [
  { icon: Target, title: 'Excellence', description: 'We hold ourselves to the highest standard in everything we deliver â€” code, design, or curriculum.' },
  { icon: Heart, title: 'Empowerment', description: 'We believe every person deserves access to world-class technology skills and opportunities.' },
  { icon: Users, title: 'Community', description: 'We build relationships, not just products. Our alumni and client network is our greatest asset.' },
  { icon: Eye, title: 'Transparency', description: 'Honest timelines, clear pricing, and open communication â€” no surprises, ever.' },
];

export default function About() {
  useSEO({ title: 'About Us', description: 'Learn about E-Bringgs Technologies â€” our mission, values, and the team behind the platform.' });

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Hero */}
      <section className="relative text-white py-28 px-4 overflow-hidden">
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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our mission</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg leading-relaxed">
              To democratise access to technology education and high-quality software services â€” empowering individuals and organisations across Africa and beyond to compete at a global level.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src="/images/about/mission.jpg" alt="Our mission" className="w-full h-64 object-cover" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg order-2 md:order-1">
            <img src="/images/about/office-space.jpg" alt="Our workspace" className="w-full h-64 object-cover" />
          </div>
          <div className="order-1 md:order-2">
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

      {/* Team â€” Orbital Layout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24 overflow-hidden">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">Meet the team</h2>
        <p className="text-gray-500 dark:text-slate-400 text-center max-w-xl mx-auto mb-20">The people behind E-Bringgs â€” passionate about technology, education, and impact.</p>

        {/* Orbital container â€” hidden on small screens */}
        <div className="relative mx-auto hidden sm:block" style={{ width: '100%', maxWidth: 800, height: 800 }}>
          {/* Orbit ring */}
          <div className="absolute rounded-full border-2 border-dashed border-gray-200 dark:border-slate-700/60" style={{ top: 75, left: 75, right: 75, bottom: 75 }} />

          {/* Connecting lines from center to each member */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 800">
            {[90, 210, 330].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x = 400 + 260 * Math.cos(rad);
              const y = 400 + 260 * Math.sin(rad);
              return <line key={angle} x1="400" y1="400" x2={x} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" className="text-gray-200 dark:text-slate-700/60" />;
            })}
          </svg>

          {/* CEO â€” Center */}
          <div className="absolute z-10" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden ring-4 ring-teal-500 shadow-2xl shadow-teal-500/30">
                  <img src={ceo.photo} alt={ceo.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
                  CEO
                </div>
              </div>
              <div className="text-center mt-5">
                <p className="font-bold text-gray-900 dark:text-white text-lg">{ceo.name}</p>
                <p className="text-teal-600 text-sm font-medium">{ceo.role}</p>
              </div>
            </div>
          </div>

          {/* Team members â€” evenly spaced on the orbit circle */}
          {teamMembers.map((member, i) => {
            // 3 members at 90Â°, 210Â°, 330Â° (top, bottom-left, bottom-right)
            const angle = (90 + i * 120) * (Math.PI / 180);
            const radius = 42; // % from center
            const top = 50 - radius * Math.cos(angle);
            const left = 50 + radius * Math.sin(angle);

            return (
              <div
                key={member.name}
                className="absolute group"
                style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-3 ring-white dark:ring-slate-700 shadow-xl group-hover:ring-teal-400 transition-all duration-300 group-hover:scale-110">
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center mt-3">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{member.name}</p>
                    <p className="text-teal-600 text-xs font-medium">{member.role}</p>
                  </div>
                </div>

                {/* Hover bio tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-20">
                  <p className="text-gray-500 dark:text-slate-400 text-xs leading-relaxed">{member.bio}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile fallback â€” stacked cards */}
        <div className="mt-8 grid grid-cols-1 sm:hidden gap-4">
          {[ceo, ...teamMembers].map((member) => (
            <div key={member.name} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-teal-500 shrink-0">
                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{member.name}</p>
                <p className="text-teal-600 text-xs font-medium">{member.role}</p>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-600 py-20 px-4 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">Join us on the journey</h2>
        <p className="text-teal-200 mb-8 max-w-xl mx-auto">Whether you want to learn, build something, or work with us â€” there's a place for you at E-Bringgs.</p>
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
