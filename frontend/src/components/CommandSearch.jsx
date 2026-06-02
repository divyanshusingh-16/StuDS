import { useState, useEffect, useRef } from 'react';
import { globalSearch } from '../services/api';

export default function CommandSearch({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
      }
    };
    
    const handleOpenEvent = () => setIsOpen(true);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const activeEl = resultsRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await globalSearch(query);
        setResults(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);
    
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (item) => {
    setIsOpen(false);
    onNavigate(item);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-slate-950/40 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 overflow-hidden flex flex-col shadow-none rounded-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-700 bg-slate-900">
          <svg className="w-5 h-5 text-slate-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            ref={inputRef}
            type="text"
            placeholder="Search notes, chapters, past papers..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-white text-base placeholder-slate-500 font-medium"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-800 border border-slate-700 rounded ml-3">ESC</kbd>
        </div>

        {(query.trim() !== '') && (
          <div className="max-h-[60vh] overflow-y-auto bg-slate-900">
            {loading && <div className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Searching database...</div>}
            
            {!loading && results.length === 0 && (
              <div className="px-4 py-6 text-sm text-slate-400 text-center">No results found for "{query}"</div>
            )}

            {!loading && results.length > 0 && (
              <ul ref={resultsRef} className="py-2">
                {results.map((item, idx) => (
                  <li 
                    key={idx}
                    className={`px-4 py-3 cursor-pointer flex flex-col gap-1.5 transition-none border-l-[3px] ${selectedIndex === idx ? 'bg-slate-800 border-white' : 'border-transparent hover:bg-slate-800/50'}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <span className={`text-sm font-semibold truncate ${selectedIndex === idx ? 'text-white' : 'text-slate-200'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                        {item.parentContext}
                      </span>
                    </div>
                    {item.snippet && (
                      <span className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-mono">
                        {item.snippet}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
