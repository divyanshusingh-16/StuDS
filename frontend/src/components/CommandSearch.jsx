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
    /* Backdrop */
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-28 sm:pt-32 bg-neutral-950/40 dark:bg-black/65 backdrop-blur-[2px]"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div 
        className="w-full max-w-2xl mx-4 bg-white dark:bg-[#1c1f26] border border-neutral-200 dark:border-[#2e3140] overflow-hidden flex flex-col shadow-xl rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 dark:border-[#2a2d38]">
          <svg 
            className="w-4.5 h-4.5 text-neutral-400 dark:text-neutral-500 mr-3 shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            ref={inputRef}
            type="text"
            placeholder="Search notes, chapters, past papers..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-neutral-900 dark:text-white text-sm sm:text-base placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-[#252830] border border-neutral-200 dark:border-[#363a48] rounded ml-3 font-mono">
            ESC
          </kbd>
        </div>

        {query.trim() !== '' && (
          <div className="max-h-[60vh] overflow-y-auto bg-white dark:bg-[#1c1f26]">
            {loading && (
              <div className="px-4 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Searching…
              </div>
            )}
            
            {!loading && results.length === 0 && (
              <div className="px-4 py-8 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                No results for &ldquo;<span className="font-semibold text-neutral-700 dark:text-neutral-200">{query}</span>&rdquo;
              </div>
            )}

            {!loading && results.length > 0 && (
              <ul ref={resultsRef} className="py-1.5" role="listbox">
                {results.map((item, idx) => (
                  <li 
                    key={idx}
                    role="option"
                    aria-selected={selectedIndex === idx}
                    className={`px-4 py-3 cursor-pointer flex flex-col gap-1.5 border-l-[3px] ${
                      selectedIndex === idx 
                        ? 'bg-neutral-100 dark:bg-[#252830] border-neutral-900 dark:border-neutral-300' 
                        : 'border-transparent hover:bg-neutral-50 dark:hover:bg-[#20232a]'
                    }`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <span className={`text-sm font-semibold truncate ${
                        selectedIndex === idx 
                          ? 'text-neutral-900 dark:text-white' 
                          : 'text-neutral-700 dark:text-neutral-200'
                      }`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 shrink-0 bg-neutral-100 dark:bg-[#282c36] border border-neutral-200 dark:border-[#363a48] px-2 py-0.5 rounded font-mono">
                        {item.parentContext}
                      </span>
                    </div>
                    {item.snippet && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed font-mono">
                        {item.snippet}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer hint */}
        {query.trim() === '' && (
          <div className="px-4 py-3 flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-[#252830]">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1 py-0.5 font-mono bg-neutral-100 dark:bg-[#252830] border border-neutral-200 dark:border-[#363a48] rounded text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 font-mono bg-neutral-100 dark:bg-[#252830] border border-neutral-200 dark:border-[#363a48] rounded text-[10px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 font-mono bg-neutral-100 dark:bg-[#252830] border border-neutral-200 dark:border-[#363a48] rounded text-[10px]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 font-mono bg-neutral-100 dark:bg-[#252830] border border-neutral-200 dark:border-[#363a48] rounded text-[10px]">Esc</kbd>
              Close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
