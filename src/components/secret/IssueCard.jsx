import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export function IssueCard({
  title,
  number,
  summary,
  yourPosition,
  myResponse,
  conclusion,
  appendixLink,
  appendixLabel,
  scrollToId,
  isOpen,
  onToggle
}) {

  const handleLinkClick = (e) => {
    if (scrollToId && appendixLink) {
      e.preventDefault();
      const targetId = appendixLink.replace('#', '');
      scrollToId(targetId);
    }
  };

  return (
    <div className={`mb-6 border rounded-xl transition-all duration-300 ${isOpen ? 'border-indigo-200 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-4 w-full">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg shrink-0 transition-colors ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {number}
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-slate-800">{title}</h3>
            <p className="text-sm md:text-base text-slate-500 mt-1">{summary}</p>
          </div>
        </div>
        <div className="ml-4 shrink-0">
            {isOpen ? <ChevronUp className="text-indigo-600" /> : <ChevronDown className="text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
             {/* Your Position */}
             <div className="bg-slate-50 p-5 rounded-lg border-l-4 border-slate-400">
                <div className="flex items-center gap-2 mb-3 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                    <AlertCircle size={16} />
                    Your Position
                </div>
                <div className="text-slate-700 italic text-base leading-relaxed">
                  {yourPosition}
                </div>
             </div>

             {/* My Response */}
             <div className="bg-indigo-50 p-5 rounded-lg border-l-4 border-indigo-500">
                <div className="flex items-center gap-2 mb-3 text-indigo-800 font-semibold uppercase text-xs tracking-wider">
                    <CheckCircle2 size={16} />
                    My Response
                </div>
                <div className="text-slate-800 text-base leading-relaxed space-y-4">
                    {myResponse}
                </div>
             </div>
          </div>

          {conclusion && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                  <div className="mt-1 text-amber-600 shrink-0">
                      <AlertCircle size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-amber-800 text-sm uppercase tracking-wide mb-1">My Position</h4>
                      <p className="text-amber-900 text-base font-medium">{conclusion}</p>
                  </div>
              </div>
          )}

          {appendixLink && (
            <div className="mt-4 text-right">
                <a
                  href={appendixLink}
                  onClick={handleLinkClick}
                  className="text-sm text-indigo-500 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 font-medium"
                >
                    {appendixLabel || "See Detailed Documentation"} &rarr;
                </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
