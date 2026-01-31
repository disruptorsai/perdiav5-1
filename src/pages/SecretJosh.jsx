import { useState, useEffect } from 'react';
import {
  Briefcase,
  ShieldCheck,
  TrendingUp,
  FileText,
  Menu,
  X,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { CostChart } from '../components/secret/CostChart';
import { IssueCard } from '../components/secret/IssueCard';

const SECRET_PASSWORD = 'dm2026';

export default function SecretJosh() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');
  const [activeIssue, setActiveIssue] = useState(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('secret-josh-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === SECRET_PASSWORD) {
      sessionStorage.setItem('secret-josh-auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  const NavLink = ({ id, icon, label }) => (
    <button
      onClick={() => scrollToSection(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        activeSection === id
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
          : 'text-slate-600 hover:bg-white hover:text-indigo-600'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-slate-900 p-4">
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-slate-900 text-2xl font-bold mb-2">Password Required</h2>
          <p className="text-slate-500 mb-6">Enter the password to access this document.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-lg mb-4 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {error && <p className="text-red-500 mb-4 font-medium">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-3 text-base font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Access Document
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 className="font-bold text-indigo-900 text-lg">Will Welsh</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-0 z-40 bg-slate-100/95 backdrop-blur-sm md:static md:bg-slate-100 md:w-80 md:border-r md:border-slate-200 md:h-screen md:sticky md:top-0
        flex flex-col p-6 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:block mb-10 mt-4">
          <h1 className="text-3xl font-bold text-indigo-900 leading-tight">Contract &<br/>Compensation</h1>
          <p className="text-base text-slate-500 mt-2 font-medium">December 2025</p>
        </div>

        <nav className="space-y-3 flex-1">
          <NavLink id="intro" icon={<TrendingUp size={20} />} label="Cost & Value Analysis" />
          <NavLink id="issues" icon={<AlertTriangle size={20} />} label="The Issues" />
          <NavLink id="proposal" icon={<FileText size={20} />} label="My Proposal" />
          <NavLink id="summary" icon={<CheckCircle size={20} />} label="Summary" />
          <NavLink id="appendices" icon={<Briefcase size={20} />} label="Appendices" />
        </nav>

        <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-400">
          Prepared for<br/>
          <strong className="text-slate-600">Disruptors Media</strong>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto overflow-y-auto">

        {/* Header Section */}
        <header className="mb-12 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-3xl p-8 md:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-40 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <div className="inline-block bg-indigo-700/50 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider mb-6 border border-indigo-500/30">
              CONFIDENTIAL
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">Contract & Compensation Discussion</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-4 text-indigo-200 text-base md:text-lg">
              <span className="font-medium">Will Welsh</span>
              <span className="hidden md:block w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
              <span className="font-medium">Tech Integration Labs LLC</span>
            </div>
          </div>
        </header>

        {/* Intro Section */}
        <section className="mb-16">
           <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-slate-200">
             <div className="text-lg md:text-xl text-slate-700 leading-relaxed space-y-6">
               <p>Josh,</p>
               <p>
                 I need to address several things about my contract and compensation. I'm going to go through the issues you've raised point by point, give you my responses, and then present my proposal for how we move forward.
               </p>
               <p>
                 For each topic, I've included links to detailed documentation and research in the appendix if you want to dig deeper.
               </p>
             </div>
           </div>
        </section>

        {/* Cost Analysis Section */}
        <section id="intro" className="mb-24 scroll-mt-8">
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                    <TrendingUp className="text-indigo-600 shrink-0" size={32} />
                    Industry Cost Analysis & The "Vibe Coder" Question
                </h2>

                <div className="prose prose-lg prose-slate max-w-none text-slate-600 mb-10">
                    <p>
                        Before we get into the specific issues, I want to share some important context. Somewhere along the way, a disconnect has developed between what I'm actually delivering and how that work is being perceived.
                    </p>
                    <p>
                        Recently, the company turned down a dentist app project (Elite Dental Force) due to liability concerns, risk concerns, and the belief that I—referred to as a "vibe coder"—wouldn't be capable of building it. This decision was informed by consulting AI and calling large development agencies.
                    </p>
                    <div className="font-bold text-slate-800 bg-slate-50 p-6 rounded-xl border-l-4 border-indigo-500 my-8">
                        I decided to use the exact same methodology—consulting AI and getting agency estimates—but applied it to the work I've already completed. The results tell a very different story.
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-8 mb-12 border border-slate-200">
                    <h3 className="font-bold text-xl text-slate-800 mb-4">How I Got These Numbers</h3>
                    <p className="text-base text-slate-600 mb-6">
                        I want to be clear about my methodology—I didn't guide this analysis in any direction. I didn't write prompts designed to get high or low numbers. I simply provided AI with:
                    </p>
                    <ul className="list-disc list-inside text-base text-slate-600 space-y-3 ml-2">
                        <li><strong>Full PRDs (Product Requirement Documents)</strong> for projects not yet built—the most accurate way to understand what an app will be in full context</li>
                        <li><strong>Full repositories (actual codebases)</strong> for projects that have been built—the most accurate way to analyze what has actually been delivered</li>
                    </ul>
                    <p className="text-base text-slate-600 mt-6">
                        These are the two most reliable inputs you can give AI to get back accurate estimates. I asked it to analyze them and provide real-world estimates based on large software agency pricing, documented past project builds of similar scope, and standard industry team compositions.
                    </p>
                    <p className="text-base text-slate-600 mt-4">
                        <strong>Importantly, I even asked it to account for how much faster and easier it is to build software today due to recent AI advancements.</strong> Despite factoring in AI-assisted development efficiencies, the estimates still came back in the ranges shown below.
                    </p>
                </div>

                {/* Table Data - Mobile Cards */}
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">What Traditional Agencies Would Actually Charge</h3>

                <div className="md:hidden space-y-4 mb-10">
                    {[
                      { name: 'Elite Dental Force (Turned Down)', cost: '$700,000 - $1.4M', time: '7-10 months', team: '4-7 developers', status: 'N/A - deal passed', bg: 'bg-slate-50' },
                      { name: 'Perdia AI Platform', cost: '$500,000 - $1.0M', time: '6-9 months', team: '5-9 developers', status: '90% complete in <3 weeks', bg: 'bg-white', highlight: true },
                      { name: 'Disruptors Marketing Hub', cost: '$325,000 - $590,000', time: '4-6 months', team: '6-10 developers', status: 'Live (called "incomplete")', bg: 'bg-slate-50', highlight: true },
                      { name: 'SegPro Calculator', cost: '$160,000 - $320,000', time: '3-6 months', team: '3-5 developers', status: 'Completed', bg: 'bg-white', highlight: true },
                    ].map((item, i) => (
                      <div key={i} className={`p-6 rounded-xl border ${item.highlight ? 'border-indigo-200 shadow-sm' : 'border-slate-200'} ${item.bg}`}>
                        <h4 className="font-bold text-lg text-indigo-900 mb-3">{item.name}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-500">Agency Cost:</span> <span className="font-bold text-slate-800">{item.cost}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Timeline:</span> <span className="font-medium text-slate-800">{item.time}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Team:</span> <span className="font-medium text-slate-800">{item.team}</span></div>
                          <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-slate-500">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.highlight ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{item.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Table Data - Desktop */}
                <div className="hidden md:block overflow-x-auto mb-12 border border-slate-200 rounded-xl shadow-sm">
                    <table className="w-full text-base text-left">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="p-5 font-semibold tracking-wide">Project</th>
                                <th className="p-5 font-semibold tracking-wide">Agency Cost</th>
                                <th className="p-5 font-semibold tracking-wide">Timeline</th>
                                <th className="p-5 font-semibold tracking-wide">Team Required</th>
                                <th className="p-5 font-semibold tracking-wide">My Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="bg-slate-50/50">
                                <td className="p-5 font-medium text-slate-600">Elite Dental Force (turned down)</td>
                                <td className="p-5 text-slate-600">$700,000 - $1.4M</td>
                                <td className="p-5 text-slate-600">7-10 months</td>
                                <td className="p-5 text-slate-600">4-7 developers</td>
                                <td className="p-5 text-slate-400 italic">N/A - deal passed</td>
                            </tr>
                            <tr className="bg-white">
                                <td className="p-5 font-bold text-indigo-900">Perdia AI Platform</td>
                                <td className="p-5 font-medium text-slate-800">$500,000 - $1.0M</td>
                                <td className="p-5 text-slate-600">6-9 months</td>
                                <td className="p-5 text-slate-600">5-9 developers</td>
                                <td className="p-5"><span className="font-bold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1 text-sm">90% complete in &lt;3 weeks</span></td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-5 font-bold text-indigo-900">Disruptors Marketing Hub</td>
                                <td className="p-5 font-medium text-slate-800">$325,000 - $590,000</td>
                                <td className="p-5 text-slate-600">4-6 months</td>
                                <td className="p-5 text-slate-600">6-10 developers</td>
                                <td className="p-5"><span className="font-bold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1 text-sm">Live (called "incomplete")</span></td>
                            </tr>
                            <tr className="bg-white">
                                <td className="p-5 font-bold text-indigo-900">SegPro Calculator</td>
                                <td className="p-5 font-medium text-slate-800">$160,000 - $320,000</td>
                                <td className="p-5 text-slate-600">3-6 months</td>
                                <td className="p-5 text-slate-600">3-5 developers</td>
                                <td className="p-5"><span className="font-bold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1 text-sm">Completed</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 mb-4">Why These Projects Cost So Much</h3>
                        <div className="prose prose-lg text-slate-600 space-y-4">
                            <p>When people hear "website" or "web app," they instinctively compare it to a simple WordPress site. That's like comparing a Tesla factory to a car wash because they both use concrete.</p>
                            <p><strong>DisruptorsMedia.com ($300K-$550K)</strong> isn't a website—it's a multi-tool marketing platform with: growth audit system, keyword research tools, content generators, Business Brain knowledge base, lead capture, and admin systems. Each is its own mini-app with AI orchestration, serverless functions, databases, plus hundreds of custom illustrations and videos. A WordPress site has 1-2 features; DisruptorsMedia.com has dozens.</p>
                            <p><strong>Perdia ($500K-$1M)</strong> is even more complex because nothing like it exists anywhere. It's not just "AI that writes articles"—it's a 20+ step content factory that automates topic discovery, keyword research, drafting, SEO optimization, humanization, editor feedback, learning from corrections, and WordPress publishing. It maintains a complete memory of every article on the site so it doesn't repeat itself and learns to write better over time. You can't buy this as a product—it combines AI writer + SEO assistant + CMS + editorial platform + analytics engine into one system.</p>
                            <p>To build either properly, agencies deploy 6-10 specialists (product leads, UX/UI designers, frontend/backend engineers, AI engineers, DevOps, QA, illustrators, video editors) at $150-$250+/hour. <strong>These are the kinds of products companies raise venture capital to build.</strong></p>
                        </div>
                    </div>
                    <div>
                        <CostChart />
                    </div>
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">What the "Vibe Coder" Is Actually Delivering</h3>
                <div className="hidden md:block overflow-x-auto mb-8 border border-slate-200 rounded-xl shadow-sm">
                    <table className="w-full text-base text-left">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="p-5 font-semibold tracking-wide">Project</th>
                                <th className="p-5 font-semibold tracking-wide">Industry Value</th>
                                <th className="p-5 font-semibold tracking-wide">My Cost to DM</th>
                                <th className="p-5 font-semibold tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                             <tr className="bg-white">
                                <td className="p-5 font-bold text-indigo-900">SegPro Calculator</td>
                                <td className="p-5 font-medium text-slate-800">$160K - $320K</td>
                                <td className="p-5 text-emerald-600">&lt; $4,000</td>
                                <td className="p-5 font-bold text-emerald-700">Completed</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-5 font-bold text-indigo-900">Perdia AI Platform</td>
                                <td className="p-5 font-medium text-slate-800">$500K - $1M</td>
                                <td className="p-5 text-emerald-600">&lt; $4,000</td>
                                <td className="p-5 font-bold text-emerald-700">90% complete in &lt;3 weeks</td>
                            </tr>
                            <tr className="bg-white">
                                <td className="p-5 font-bold text-indigo-900">Disruptors Marketing Hub</td>
                                <td className="p-5 font-medium text-slate-800">$325K - $590K</td>
                                <td className="p-5 text-emerald-600">Included in salary</td>
                                <td className="p-5 font-bold text-emerald-700">Live (called "incomplete")</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-indigo-900 text-white p-8 rounded-2xl text-center shadow-lg transform hover:-translate-y-1 transition-transform">
                        <div className="text-xs md:text-sm uppercase tracking-wider opacity-75 font-semibold mb-3">Combined Industry Value</div>
                        <div className="text-3xl md:text-4xl font-bold">$985K - $1.91M</div>
                    </div>
                    <div className="bg-emerald-600 text-white p-8 rounded-2xl text-center shadow-lg transform hover:-translate-y-1 transition-transform">
                        <div className="text-xs md:text-sm uppercase tracking-wider opacity-75 font-semibold mb-3">Cost to Disruptors Media</div>
                        <div className="text-3xl md:text-4xl font-bold">~$24,000</div>
                    </div>
                    <div className="bg-white border-2 border-slate-100 p-8 rounded-2xl text-center shadow-sm transform hover:-translate-y-1 transition-transform">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Cost Efficiency Ratio</div>
                        <div className="text-3xl md:text-4xl font-bold text-indigo-600">41x - 80x</div>
                        <div className="text-sm text-slate-400 mt-2 font-medium">Compared to traditional agency pricing</div>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-8 border-l-8 border-slate-800">
                    <h3 className="font-bold text-xl text-slate-800 mb-4">Same Method, Opposite Conclusions</h3>
                    <p className="text-slate-600 text-lg mb-4">
                        The company consulted AI and agencies to determine whether a "vibe coder" could build the dentist app. The conclusion was no—too risky, not capable.
                    </p>
                    <p className="text-slate-600 text-lg mb-4">
                        I used the <strong>exact same method</strong> to analyze the actual work I've already delivered. The conclusion: I'm single-handedly producing millions of dollars worth of enterprise software at a tiny fraction of traditional costs.
                    </p>
                    <p className="font-bold text-slate-800 text-lg">
                        Same method. Opposite conclusions. The difference? My analysis is based on actual deliverables—real codebases, real PRDs, real completed work. Not hypotheticals about what might go wrong.
                    </p>
                </div>

                 <div className="mt-8 bg-indigo-900 p-8 rounded-2xl text-white">
                    <strong className="block text-xl text-yellow-400 mb-3">The Real Question:</strong>
                    <p className="text-lg leading-relaxed">
                        The question isn't whether I can build complex applications—the evidence shows I already am. The real question is how this perception gap developed, and why work that's worth millions by industry standards is being characterized as not good enough, taking too long, or not generating direct revenue.
                    </p>
                </div>
            </div>
        </section>

        {/* Issues Section */}
        <section id="issues" className="mb-24 scroll-mt-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-10 flex items-center gap-4 border-b border-slate-200 pb-6">
                <AlertTriangle className="text-indigo-600" size={32} />
                Part 1: Your Points & My Responses
            </h2>

            <IssueCard
                number={1}
                title="The $1,800 Deduction"
                summary="API charges deducted from pay."
                yourPosition="I 'signed up for something' that resulted in $1,800 in API charges, so it's coming out of my pay."
                myResponse={
                    <>
                        <p>That's not what happened. API keys aren't optional services I signed up for—they're essential infrastructure. Every app I build has 10-20+ keys. Without them, nothing works. APIs are to apps and websites what electricity is to a job site.</p>
                        <p>API incidents happen constantly (39 million keys leaked on GitHub in 2024 alone—even Fortune 500 companies with dedicated security teams experience these incidents). Industry standard is that companies absorb these costs as operational overhead, not individual developers. I researched this extensively and could not find a single example of a company deducting API charges from a developer's paycheck. It's simply not done.</p>
                        <p>There was never any agreement—written or verbal—that I would personally cover operational costs. And according to Utah labor law and federal regulations, employers cannot deduct amounts from wages without express written authorization—deductions for operational costs without clear voluntary agreement are generally prohibited.</p>
                        <p>If I'm personally liable for API charges going forward, I would have to shut down every API key across every project immediately to protect myself. That would halt all development indefinitely. I don't think that's what you want.</p>
                    </>
                }
                conclusion="The $1,800 needs to be reversed. I'm actively pursuing the refund from Google, which will be reimbursed directly to the company."
                appendixLink="#appendix-a"
                appendixLabel="Appendix A: API Deduction Analysis"
                scrollToId={scrollToSection}
                isOpen={activeIssue === 1}
                onToggle={() => setActiveIssue(activeIssue === 1 ? null : 1)}
            />

            <IssueCard
                number={2}
                title="The Website 'Not Being Complete'"
                summary="Scope creep and design iterations."
                yourPosition="The website was never completed, and since you've been good to me, I should finish it for free."
                myResponse={
                    <>
                        <p>Here is a super simplified and condensed version of what actually happened: I designed the website. Then I got detailed page-by-page revisions from one person, applied them—which broke the visual coherence—so I had to redesign all the aesthetics around their requests until it all looked good again. Then I got a completely different set of revisions from someone else. This cycle repeated for weeks. Then the question came: "Why is this taking so long?"</p>
                        <p>The website is complete. It's live and functional. We have received lots of feedback on it from clients and it's all been extremely positive. One client even said that part of the reason he chose us was because he liked how we designed our website (I know that was Kyle and Tyler's point about the old website, but the comment I'm referring to came from a recent client about the new site).</p>
                        <p>You're telling me the website still isn't completed and tasking me with the responsibility of finally building the perfect version of it that you are envisioning. But when I ask you for details on what exactly is not complete you said something along the lines of "It doesn't tell our story perfectly." Based on my experience designing this site for you guys so far—the only way I will ever be able to produce the site you are envisioning (the site that you can feel good about considering complete and be happy with me about)—is if you give me:</p>
                        <ol className="list-decimal list-inside ml-2 space-y-2 my-4 font-medium pl-4 border-l-2 border-indigo-200">
                            <li>Specific, written requirements — exactly what to change, page by page</li>
                            <li>One point of contact for feedback — not conflicting input from multiple people</li>
                        </ol>
                        <p>I'm happy to do more work on the website. But vague direction + multiple conflicting stakeholders = the exact cycle that made this take so long in the first place.</p>
                        <p>For context: what happened with the website is textbook <strong>scope creep</strong>—the #1 cause of project delays and budget overruns in software and design. Research shows projects with unclear requirements take 2-3x longer than those with clear specs. That's why professional projects have discovery phases, defined revision rounds ("this price includes 2 rounds of revisions"), and change orders for additional work. Asking a developer to work until something is "perfect" with no clear definition of "perfect" is asking for infinite work.</p>
                    </>
                }
                conclusion="Important note: You guys have been amazing and understanding about the unexpected situation with my mom, and I sincerely appreciate that... That being said, I don't feel good at all about tying this in with things you are saying like that I never completed, or somehow failed in the website build."
                appendixLink="#appendix-b"
                appendixLabel="Appendix B: Scope Creep"
                scrollToId={scrollToSection}
                isOpen={activeIssue === 2}
                onToggle={() => setActiveIssue(activeIssue === 2 ? null : 2)}
            />

            <IssueCard
                number={3}
                title="'Not As Far Along With AI As You Thought'"
                summary="Response to comment regarding AI capability."
                yourPosition="You said something along the lines of, 'I guess you weren't as far along with AI as you thought you were.'"
                myResponse={
                    <>
                        <p>That comment caught me off guard, and I fully disagree with it.</p>
                        <p>The company didn't just grow—it transformed from a marketing agency to an AI-first development company. I'm not saying that pivot was built entirely on my work. But I think it's unreasonable to assume that this transformation, which happened over the course of the few months since I started, wasn't at least an indirect result of my contributions.</p>
                        <p>You brought me on as an AI expert. I've taught Kyle and the team everything I know about AI and how to best use it, every single day I've worked here. I'm the only developer. No other technical staff. Managing 3-6 projects simultaneously, alone.</p>
                        <p>We were at $18K MRR. We're now at $42K+ MRR and growing quickly, plus $15K+ in app deposits. In our initial phone conversations where you were telling me about pay and equity incentives that would be based on our MRR increasing, I asked you how you'd know if the growth was from me. Your response was that we're a three-person team, so where else would the increases in MRR come from.</p>
                        <p>Rather than a lack of AI skills on my part, I think this perception can be attributed to a few things: the inherently unpredictable nature of AI development work, unrealistic expectations of what a one-person development team can deliver, and honestly—my own underwhelming communication skills. I'm not someone who demands credit where credit is due or escalates every obstacle. I'm used to working on teams of creators and engineers where failing fast is encouraged (as Elon always recommends), where we collaborate and solve problems together rather than constantly covering our own backs. That's served me well in those environments, but I recognize it may have left you without visibility into what I'm actually contributing here.</p>
                        <p>For reference, here's what industry research says about realistic AI development timelines:</p>
                        <ul className="list-disc list-inside ml-2 my-2 text-sm text-slate-500 bg-slate-100 p-3 rounded-lg">
                            <li>Simple AI chatbot: 4-8 weeks</li>
                            <li>Basic AI app with existing APIs: 2-4 months</li>
                            <li>Custom AI features with training: 3-6 months</li>
                            <li>Complex enterprise AI application: 9-12+ months</li>
                            <li>Novel/never-done-before features: Add 2-4 weeks just for evaluation</li>
                        </ul>
                         <p>As one industry source put it: <em>"AI eats scope for breakfast—data pipelines, model eval loops, and privacy reviews can stretch timelines fast."</em></p>
                    </>
                }
                conclusion="The results (transformation to AI company, MRR growth, completed apps) contradict this sentiment."
                appendixLink="#appendix-c"
                appendixLabel="Appendix C: Company Growth"
                scrollToId={scrollToSection}
                isOpen={activeIssue === 3}
                onToggle={() => setActiveIssue(activeIssue === 3 ? null : 3)}
            />

            <IssueCard
                number={4}
                title="The New Contract / Feeling Like My Work Isn't Creating Revenue"
                summary="Contract renegotiation."
                yourPosition="You want to redo my contract, moving to the 50% of $250/hour model."
                myResponse={
                    <>
                        <p>I did receive part of the raise you promised—my bi-weekly checks went from $2K to $2,750. But the push to redo my contract and the concern that my work isn't generating revenue doesn't match what the numbers show—MRR has grown 133%, we have $15K+ in app deposits, and the company has transformed into an AI-first business.</p>
                        <p>You said when I joined: <em>"If I can see that we've gone from, yeah, I think we're at, like, 17, 8, let's just call it 18,000, and now we're at 36,000. I give you my word as a man that I will give you a $2,000 pay increase."</em></p>
                        <p>Here's the thing: 50% of $250/hour is the absolute minimum I'll accept. And here's why that's already generous on my part:</p>
                        <ul className="list-disc list-inside ml-2 my-4 space-y-2">
                            <li>I get 0% of initial down payments ($15K+ so far)</li>
                            <li>I get 0% of recurring revenue ($3-5K/month per app, ongoing for years)</li>
                            <li>I get 50% of the hourly rate we charge for development work—while doing 100% of the dev work</li>
                        </ul>
                        <p>For every billable hour, there's another hour of unbillable work (setup, research, testing, client emails). That $125/hour is really ~$62.50/hour of my actual time.</p>
                        <p>For context on industry standards:</p>
                        <ul className="list-disc list-inside ml-2 my-2 space-y-1">
                             <li>Senior/specialized developers (AI, complex integrations) command $150-$250+/hour</li>
                             <li>Agency rates for enterprise work often range $200-$400/hour</li>
                             <li>AI app development costs range from $20,000-$250,000+ per project</li>
                             <li>Staffing agencies typically take 30-50% of the billed rate, meaning contractors typically receive 50-70% of what clients pay</li>
                        </ul>
                        <p>At 50%, I'm at the low end of industry standard—while receiving nothing from down payments or recurring revenue.</p>
                    </>
                }
                conclusion="My position: I want either a share of down payments (10-20%) or a share of recurring revenue (10-20%). If I'm getting 0% of both, 50% hourly is the floor."
                appendixLink="#appendix-d"
                appendixLabel="Appendix D: Industry Compensation"
                scrollToId={scrollToSection}
                isOpen={activeIssue === 4}
                onToggle={() => setActiveIssue(activeIssue === 4 ? null : 4)}
            />

            <IssueCard
                number={5}
                title="Equity"
                summary="Unfulfilled equity discussions."
                yourPosition={
                    <>
                        "That would mean that I would have 24% or something... if you're capable of doing those incredible things, yeah, I mean, I know that the entire team would not be opposed, if you can just absolutely crush it."
                    </>
                }
                myResponse={
                    <>
                        <p>I accepted $48K/year—way below market—partly because of that conversation.</p>
                        <p>I'm assuming equity is off the table now, given that it hasn't been mentioned a single time since the moment I agreed to your terms. I imagine it has something to do with the "not as far along with AI" comment.</p>
                        <p>But if that's the perception, and if equity is no longer part of the picture, then the compensation structure needs to reflect that reality. I didn't accept below-market pay for the fun of it.</p>
                        <p>You also said at the time: <em>"The reality is, Will, let's be honest, if you're not making a minimum of a quarter of a million a year, it's not enough."</em></p>
                        <p><em>"There is an AI opportunity right now to be AI consultants and AI partners with tons of companies, because there's not enough people like us, right, and you, and Emerald Deacon, there's not enough people like them to facilitate the needs of all the companies out there. There just isn't."</em></p>
                        <p>I believed those things then, and I still believe them now. That's why I took this opportunity.</p>
                    </>
                }
                conclusion="If no equity, the pay structure needs to change."
                appendixLink="#appendix-e"
                appendixLabel="Appendix E: Original Quotes"
                scrollToId={scrollToSection}
                isOpen={activeIssue === 5}
                onToggle={() => setActiveIssue(activeIssue === 5 ? null : 5)}
            />

            <IssueCard
                number={6}
                title="Internal DM Work"
                summary="Unpaid internal labor."
                yourPosition="The issue: A significant portion of my work has no defined compensation."
                myResponse={
                    <>
                        <p>How will I be compensated for:</p>
                        <ul className="list-disc list-inside ml-2 my-2 space-y-1">
                            <li>Teaching the team</li>
                            <li>Website work (see above)</li>
                            <li>Internal apps (Sniper Sales, Client Portal, Content Writer)</li>
                            <li>GoHighLevel integrations</li>
                            <li>Non-app client work (EVLogic HeyGen, etc.)</li>
                        </ul>
                        <p>This needs to be defined in writing.</p>
                    </>
                }
                conclusion="This needs to be defined in writing."
                appendixLink="#appendix-f"
                appendixLabel="Appendix F: Uncompensated Work List"
                scrollToId={scrollToSection}
                isOpen={activeIssue === 6}
                onToggle={() => setActiveIssue(activeIssue === 6 ? null : 6)}
            />
        </section>

        {/* Proposal Section */}
        <section id="proposal" className="mb-24 scroll-mt-8">
             <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
                <header className="mb-12 border-b border-slate-100 pb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Part 2: My Proposal</h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Josh, I know liability is a major concern for you. The API incident brought this into sharp focus. Here's my proposal to address everything:
                    </p>
                </header>

                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-indigo-900 mb-6">What "Taking On Liability" Actually Means in the Industry</h3>
                    <div className="bg-slate-50 p-8 rounded-2xl text-slate-700 text-base leading-relaxed mb-8">
                        <p className="mb-6">Nobody in software says "I'll take unlimited personal liability for anything that goes wrong." That would be insane. Instead, real dev companies do three things:</p>
                        <ol className="list-decimal list-inside space-y-4 mb-6">
                            <li><strong>Use an entity, not a person:</strong> The vendor is the company (Tech Integration Labs LLC), not the individual developer. That's what my LLC is for—it's the contracting party, not "Will personally."</li>
                            <li><strong>Carry Professional Liability Insurance (Tech E&O):</strong> This is called Technology Errors & Omissions (E&O). It's designed for exactly this scenario. If a client claims our software error, negligence, or bad advice caused them financial loss, the insurance covers legal defense costs and settlements.</li>
                            <li><strong>Limit Liability in the Contract:</strong> Standard software contracts have a limitation of liability clause that caps total liability to something like "fees paid under this contract in the last 12 months" or "2x the total fees paid" and excludes certain damages.</li>
                        </ol>
                        <p>So when actual dev shops "take on liability," it means: <em>"Our company will be legally responsible up to a defined cap for issues caused by our negligence, backed by professional liability insurance, and defined in the contract."</em> <strong>NOT:</strong> <em>"I personally will eat any and all losses no matter what happens."</em></p>
                    </div>

                    <h3 className="text-2xl font-bold text-indigo-900 mb-6">How to Handle "Never-Been-Done-Before" Work</h3>
                    <div className="bg-slate-50 p-8 rounded-2xl text-slate-700 text-base leading-relaxed">
                        <p className="mb-4">For complex apps and future novel projects, here's how professional dev shops handle uncertain, first-of-its-kind work:</p>
                        <ul className="list-disc list-inside space-y-4">
                            <li><strong>Discovery / Scoping Phase (Paid):</strong> Time-boxed (2-6 weeks). Fixed fee or small T&M budget. Deliverables: Clarified requirements, feasibility analysis, architecture, risks, ranges.</li>
                            <li><strong>Proof of Concept (PoC) / Spike Work:</strong> When something is truly novel, we define a paid PoC focused on just the hard part. Key attributes: Time-boxed, narrow scope, paid, outcome-driven.</li>
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Offering Column */}
                    <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100 shadow-sm">
                        <h3 className="text-2xl font-bold text-emerald-900 mb-8 flex items-center gap-3">
                            <ShieldCheck size={28} /> What I'm Offering
                        </h3>
                        <p className="text-emerald-800 text-base mb-6 italic font-medium">Through Tech Integration Labs LLC, I will:</p>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4 text-emerald-900">
                                <div className="mt-1 bg-emerald-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-emerald-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Act as the development vendor</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">Entity-to-entity relationship.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-emerald-900">
                                <div className="mt-1 bg-emerald-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-emerald-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Carry Tech E&O insurance</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">Development-related liability covered by my policy.</span>
                                </div>
                            </li>
                             <li className="flex items-start gap-4 text-emerald-900">
                                <div className="mt-1 bg-emerald-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-emerald-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Use standard limitation-of-liability contract language</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">Capped exposure, excluded damages.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-emerald-900">
                                <div className="mt-1 bg-emerald-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-emerald-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Cover all AI subscriptions and API costs myself</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">These are the same subscriptions we're already paying through Disruptors Media. The person who bears the risk needs to control the accounts.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-emerald-900">
                                <div className="mt-1 bg-emerald-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-emerald-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Manage and pay software developer freelancers</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">When their expertise is needed to complete a project.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-emerald-900">
                                <div className="mt-1 bg-emerald-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-emerald-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Manage all technical accounts and infrastructure</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">You won't be liable or responsible for any fees, risks, or complexities.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-emerald-900">
                                <div className="mt-1 bg-emerald-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-emerald-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Implement Discovery/PoC phases</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">De-risk projects before full commitment.</span>
                                </div>
                            </li>
                        </ul>
                         <p className="mt-6 text-emerald-800 font-bold text-center">This removes liability from Disruptors Media entirely—handled professionally, like an actual vendor relationship.</p>
                    </div>

                    {/* Needs Column */}
                    <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
                        <h3 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-3">
                            <Briefcase size={28} /> What I Need in Return
                        </h3>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4 text-blue-900">
                                <div className="mt-1 bg-blue-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-blue-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">50% of hourly fees for actual development</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">This is the minimum, non-negotiable. The hourly rate we charge clients should be close to $250, which is standard. I'll also be using AI-powered time tracking software for full transparency. 50% means you're getting paid exactly as much as I am for every hour of actual development work I complete.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-blue-900">
                                <div className="mt-1 bg-blue-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-blue-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">10-20% of initial down payments</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">I do significant upfront work to close these deals (open to negotiation).</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-blue-900">
                                <div className="mt-1 bg-blue-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-blue-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">10-20% of recurring revenue</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">The apps I build generate income for years (open to negotiation).</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-blue-900">
                                <div className="mt-1 bg-blue-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-blue-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Written compensation terms for internal DM work</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">No more ambiguity. Important caveat: I'm happy to help out the company without pay in many ways that are reasonable and agreed upon under friendly terms (training, consulting). But it needs to be in a friendly and respectful manner.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-blue-900">
                                <div className="mt-1 bg-blue-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-blue-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">The $1,800 deduction reversed</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">Google will reimburse directly to the company.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-blue-900">
                                <div className="mt-1 bg-blue-200 p-1.5 rounded-full shrink-0"><CheckCircle size={16} className="text-blue-700" /></div>
                                <div>
                                    <span className="font-bold block text-lg mb-1">Everything in writing going forward</span>
                                    <span className="text-sm opacity-90 leading-relaxed block">No more verbal agreements that get reinterpreted.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 bg-slate-800 text-white p-8 md:p-10 rounded-2xl shadow-xl">
                    <h4 className="font-bold text-xl md:text-2xl mb-8">Why This Works for Both of Us</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-base">
                        <div>
                            <strong className="block text-indigo-300 text-lg mb-4">For Disruptors Media:</strong>
                            <ol className="list-decimal list-inside space-y-3 text-slate-300">
                                <li>Zero liability exposure on the technical side</li>
                                <li>No surprise API charges hitting your accounts</li>
                                <li>Predictable costs</li>
                                <li>Full transparency on hours and deliverables</li>
                                <li>Professional vendor relationship</li>
                                <li>You get paid as much as I do</li>
                                <li>Access to help and training without the overhead</li>
                            </ol>
                        </div>
                        <div>
                            <strong className="block text-emerald-300 text-lg mb-4">For Me:</strong>
                            <ol className="list-decimal list-inside space-y-3 text-slate-300">
                                <li>Fair compensation that reflects the risk I'm taking on</li>
                                <li>Clear terms I can count on</li>
                                <li>The ability to operate professionally as a true subcontractor</li>
                                <li>Control over the things I'm responsible for</li>
                                <li>A sustainable working relationship</li>
                                <li>The autonomy to do my best work</li>
                            </ol>
                        </div>
                    </div>
                </div>
             </div>
        </section>

        {/* Summary */}
        <section id="summary" className="mb-24 scroll-mt-8">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 md:p-16 text-center">
                <h2 className="text-3xl font-bold text-amber-900 mb-10">Summary</h2>
                <div className="bg-white p-8 rounded-2xl shadow-md inline-block text-left max-w-2xl w-full mb-12 transform rotate-1">
                    <h3 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm border-b pb-4">Non-Negotiables</h3>
                    <ol className="space-y-4 list-decimal list-inside text-slate-800 text-lg font-medium">
                        <li>$1,800 deduction reversed</li>
                        <li>50% of hourly minimum</li>
                        <li>Written terms for internal work</li>
                        <li>No unauthorized deductions going forward</li>
                    </ol>
                </div>

                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-10 md:p-14 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold mb-4">The Bottom Line</h3>
                    <p className="text-slate-300 text-xl leading-relaxed max-w-3xl mx-auto">
                        I want this to work. I believe in what we're building.
                        <br/><span className="text-white font-bold block mt-2 text-2xl">But it needs to work for both of us.</span>
                    </p>
                    <div className="mt-12 pt-8 border-t border-slate-700 flex justify-end">
                        <div className="text-right">
                            <p className="text-xl font-bold mb-0">Let's discuss.</p>
                            <div className="font-serif italic text-3xl text-slate-300 mt-6">—Will</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Appendices */}
        <section id="appendices" className="mb-20 scroll-mt-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 border-b pb-6">Appendices: Detailed Documentation & Research</h2>

            <div className="space-y-10">
                {/* Appendix A */}
                <div id="appendix-a" className="scroll-mt-4 bg-white p-8 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-slate-400"/> Appendix A: The $1,800 API Deduction — Detailed Analysis</h3>
                    <div className="prose prose-lg max-w-none text-slate-600">
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">A.1 What Is an API Key?</h4>
                        <p>Think of an API key like a password that lets one piece of software talk to another. Every modern app works this way. The apps I'm building for Disruptors Media each have 10-20+ API keys connecting them to various services. Without these keys, the apps literally cannot function.</p>
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">A.2 API Incidents Are Extremely Common</h4>
                        <ul className="list-disc list-inside">
                            <li>39 million API secrets were leaked on GitHub in 2024 alone</li>
                            <li>40% of API keys across the industry are stored in ways that could be exposed</li>
                            <li>Even Fortune 500 companies with dedicated security teams experience API key incidents</li>
                            <li>The average cost of a mobile application security incident ranges from just under $1 million to several million dollars</li>
                        </ul>
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">A.3 How Companies Normally Handle This</h4>
                        <p>In every professional software organization, the company absorbs these costs as operational overhead. Developers aren't negligent; it's a known risk. I researched this extensively and could not find a single example of a company deducting API charges from a developer's paycheck.</p>
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">A.4 What Labor Law Says About Deductions</h4>
                        <p>According to Utah labor law (and federal regulations under 29 CFR 4.168), employers cannot deduct amounts from wages without express written authorization. Deductions for equipment damage, operational costs, or shortages without clear voluntary agreement are generally prohibited.</p>
                        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-6 text-sm">
                            <a href="https://www.gitguardian.com/remediation/google-api-key" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"><ExternalLink size={14}/> GitGuardian - Remediating Google API Key Leaks</a>
                            <a href="https://laborcommission.utah.gov/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"><ExternalLink size={14}/> Utah Labor Commission</a>
                        </div>
                    </div>
                </div>

                {/* Appendix B */}
                <div id="appendix-b" className="scroll-mt-4 bg-white p-8 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-slate-400"/> Appendix B: The Website — Scope Creep Documentation</h3>
                    <div className="prose prose-lg max-w-none text-slate-600">
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">B.1 What Happened</h4>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>I designed the website (Version 1)</li>
                            <li>One boss provided a full list of revisions—page by page, tabs, text changes, color changes</li>
                            <li>I applied those revisions, which broke the visual coherence (changing one color affects everything around it)</li>
                            <li>I had to redesign sections to make it look good again while keeping the new revisions</li>
                            <li>By the time that was done, another boss provided a completely different list of revisions</li>
                            <li>Repeat the entire process</li>
                            <li>This went on for weeks</li>
                        </ol>
                        <p className="mt-4">Then the question came: "Why is this taking so long?"</p>
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">B.2 What Is Scope Creep?</h4>
                        <p>Scope creep is one of the most common problems in software and design projects. It's when requirements keep changing or expanding after work has begun. Research shows projects with unclear requirements take 2-3x longer than those with clear specs.</p>
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">B.3 Why "Perfect" Is Impossible Without Clear Direction</h4>
                        <p>Asking a developer to work until something is "perfect" with no clear definition of "perfect" is asking for infinite work. Professional projects have defined revision rounds and change orders.</p>
                    </div>
                </div>

                {/* Appendix C & D Combined */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div id="appendix-c" className="scroll-mt-4 bg-white p-8 rounded-2xl border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-slate-400"/> Appendix C: Industry Compensation Research</h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-slate-900 mb-2">C.1 Standard Hourly Rates</h4>
                                <ul className="text-base text-slate-600 list-disc list-inside">
                                    <li>Senior/specialized developers (AI, complex integrations): $150-$250+/hour</li>
                                    <li>Agency rates for enterprise work: $200-$400/hour</li>
                                    <li>AI app development costs: $20,000-$250,000+ per project</li>
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-bold text-slate-900 mb-2">C.2 Revenue Share Arrangements</h4>
                                <p className="text-base text-slate-600">Research shows that staffing agencies typically take 30-50% of the billed rate as their cut, meaning contractors typically receive 50-70% of what clients pay. At 50%, I'm at the low end.</p>
                            </div>
                        </div>
                    </div>
                    <div id="appendix-d" className="scroll-mt-4 bg-white p-8 rounded-2xl border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-slate-400"/> Appendix D: Original Conversation Quotes</h3>
                        <div className="space-y-4">
                             <blockquote className="text-base italic text-slate-600 border-l-4 border-slate-200 pl-4 py-1">
                                "That would mean that I would have 24% or something... if you're capable of doing those incredible things, yeah, I mean, I know that the entire team would not be opposed, if you can just absolutely crush it."
                            </blockquote>
                            <blockquote className="text-base italic text-slate-600 border-l-4 border-slate-200 pl-4 py-1">
                                "The reality is, Will, let's be honest, if you're not making a minimum of a quarter of a million a year, it's not enough."
                            </blockquote>
                            <blockquote className="text-base italic text-slate-600 border-l-4 border-slate-200 pl-4 py-1">
                                "There is an AI opportunity right now to be AI consultants and AI partners with tons of companies, because there's not enough people like us... There just isn't."
                            </blockquote>
                        </div>
                    </div>
                </div>

                 <div id="appendix-e" className="scroll-mt-4 bg-white p-8 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-slate-400"/> Appendix E: Original Quotes (Extended)</h3>
                    <div className="prose prose-lg max-w-none text-slate-600">
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">E.1 On Equity</h4>
                        <blockquote className="text-base italic text-slate-600 border-l-4 border-slate-200 pl-4 py-1">
                            "That would mean that I would have 24% or something... It depends on what you're capable of. For sure, sure. I mean, if you're capable of doing those incredible things, yeah, I mean, I know that the entire team would not be opposed, if you can just absolutely crush it."
                        </blockquote>
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">E.2 On Pay Increases</h4>
                        <blockquote className="text-base italic text-slate-600 border-l-4 border-slate-200 pl-4 py-1">
                            "If I can see that we've gone from, yeah, I think we're at, like, 17, 8, let's just call it 18,000, and now we're at 36,000. I give you my word as a man that I will give you a $2,000 pay increase."
                        </blockquote>
                        <blockquote className="text-base italic text-slate-600 border-l-4 border-slate-200 pl-4 py-1 mt-4">
                            "For every 5,000 that we go up, you get 500 of it."
                        </blockquote>
                    </div>
                </div>

                 <div id="appendix-f" className="scroll-mt-4 bg-white p-8 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-slate-400"/> Appendix F: Uncompensated Internal Work</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-4 rounded-tl-lg">Work Type</th>
                                    <th className="p-4 rounded-tr-lg">Examples</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-4 font-medium">Teaching the team</td>
                                    <td className="p-4">Training sessions (2+ hours this last Monday afternoon alone)</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-medium">Website work</td>
                                    <td className="p-4">Disruptors Media website development (Weeks)</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-medium">Internal apps</td>
                                    <td className="p-4">Sniper Sales App, Client Portal, Content Writer Template</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-medium">GoHighLevel integrations</td>
                                    <td className="p-4">Various automations and workflows</td>
                                </tr>
                                 <tr>
                                    <td className="p-4 font-medium">Non-app client work</td>
                                    <td className="p-4">EVLogic's digital avatar/HeyGen work</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="appendix-g" className="scroll-mt-4 bg-white p-8 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-slate-400"/> Appendix G: Agile Development & Client Pricing</h3>
                    <div className="prose prose-lg max-w-none text-slate-600">
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">G.1 How Agile Pricing Works</h4>
                        <p>"When a project's scope is subject to change due to early user feedback, evolving customer requirements, or other factors, the development cost can be bound to agreed rates and the efforts experts spend to introduce deliverables, so the client only pays for actual work done."</p>
                        <h4 className="font-bold text-slate-900 mt-6 mb-3">G.2 Discovery Phases & Proof of Concept</h4>
                        <p>For projects involving novel features—things that have never been done before—professional development companies use paid discovery phases and proofs of concept.</p>
                        <blockquote className="text-base italic text-slate-600 border-l-4 border-slate-200 pl-4 py-1">
                            "The pre-development stage, first of all, aims to eliminate financial risks for the client and make the development process as predictable and smooth as possible."
                        </blockquote>
                    </div>
                </div>

                 <div id="appendix-h" className="scroll-mt-4 bg-white p-8 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-slate-400"/> Appendix H: Full Source Reference List</h3>
                    <div className="text-sm text-slate-600 space-y-2">
                        <p className="font-bold text-slate-800 mb-4">Compensation & Revenue Share</p>
                        <ul className="list-disc list-inside space-y-1 mb-6">
                            <li>ZipRecruiter - Software Developer Contractor Salary</li>
                            <li>Glassdoor - Software Engineer Contractor Salary</li>
                            <li>FullStack Labs - 2024 Software Development Price Guide</li>
                            <li>PayScale - Software Engineer Contractor Hourly Pay</li>
                        </ul>
                        <p className="font-bold text-slate-800 mb-4">API Key Security & Liability</p>
                        <ul className="list-disc list-inside space-y-1 mb-6">
                            <li>Nordic APIs - Keep API Keys Safe</li>
                            <li>Wallarm - API Token Leaks Guide</li>
                            <li>GitGuardian - Remediating Google API Key Leaks</li>
                        </ul>
                        <p className="font-bold text-slate-800 mb-4">Professional Liability Insurance</p>
                        <ul className="list-disc list-inside space-y-1 mb-6">
                            <li>Insureon - Software Developer Insurance</li>
                            <li>The Hartford - Technology E&O Insurance</li>
                            <li>TechInsurance - Software Developer Insurance</li>
                        </ul>
                        <p className="font-bold text-slate-800 mb-4">Agile Development & Pricing</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Toptal - Software Costs Estimation in Agile</li>
                            <li>MITRE - Agile Cost Estimation</li>
                            <li>Stfalcon - Discovery Phase in Software Development</li>
                            <li>Designli - Proof of Concept in Software Development</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
}
