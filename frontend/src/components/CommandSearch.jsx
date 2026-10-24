import { useState, useEffect, useRef } from 'react';
import { globalSearch } from '../services/api';

function highlightMatch(text, query) {
  if (!text || !query) return text;
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(t => t.length >= 2);
  if (tokens.length === 0) return text;

  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  try {
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  } catch {
    return text;
  }
}

export default function CommandSearch({ onNavigate, currentSemester }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
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
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSelectedIndex(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await globalSearch(trimmed, currentSemester);
        setResults(Array.isArray(data) ? data : []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, currentSemester]);

  if (!isOpen) return null;

  const handleSelect = (item) => {
    setIsOpen(false);
    onNavigate(item);
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'subject':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'unit':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'chapter':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900';
      case 'resource':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-neutral-950/50 dark:bg-black/70 backdrop-blur-xs"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Search"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] overflow-hidden flex flex-col shadow-2xl rounded-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 dark:border-[#222428]">
          <svg
            className="w-5 h-5 text-neutral-400 dark:text-neutral-500 mr-3 shrink-0"
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
            placeholder="Search subjects, units, chapters, notes (e.g. comp, intro, CS504)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-neutral-900 dark:text-white text-sm sm:text-base placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin shrink-0 mr-2" />
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-[#1c1f26] border border-neutral-200 dark:border-[#2c2f38] rounded-md font-mono">
            ESC
          </kbd>
        </div>

        {/* Dynamic Results Body */}
        <div className="max-h-[60vh] overflow-y-auto bg-white dark:bg-[#14161a]">
          {query.trim().length === 1 && (
            <div className="px-4 py-8 text-xs text-neutral-400 dark:text-neutral-500 text-center font-medium">
              Keep typing to search subjects, chapters, notes, and course resources…
            </div>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-10 text-sm text-neutral-500 dark:text-neutral-400 text-center">
              No matching curriculum results for &ldquo;
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{query}</span>
              &rdquo;
            </div>
          )}

          {results.length > 0 && (
            <ul ref={resultsRef} className="py-2 divide-y divide-neutral-100 dark:divide-[#1c1f26]" role="listbox">
              {results.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <li
                    key={item.id || idx}
                    role="option"
                    aria-selected={isSelected}
                    className={`px-4 py-3 cursor-pointer flex flex-col gap-1 transition-colors border-l-[3px] ${
                      isSelected
                        ? 'bg-neutral-100/90 dark:bg-[#1c1f26] border-blue-600 dark:border-blue-400'
                        : 'border-transparent hover:bg-neutral-50 dark:hover:bg-[#171a1f]'
                    }`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 font-mono ${getBadgeStyle(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        {item.code && (
                          <span className="text-xs font-semibold font-mono text-neutral-500 dark:text-neutral-400 shrink-0">
                            {highlightMatch(item.code, query)}
                          </span>
                        )}
                        <span
                          className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-neutral-950 dark:text-white' : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {highlightMatch(item.title, query)}
                        </span>
                      </div>
                      {item.semester && (
                        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 shrink-0">
                          Sem {item.semester}
                        </span>
                      )}
                    </div>

                    {item.parentContext && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate pl-0.5">
                        {highlightMatch(item.parentContext, query)}
                      </p>
                    )}

                    {item.snippet && (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1 pl-0.5 font-mono">
                        {highlightMatch(item.snippet, query)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-[#1e2026] bg-neutral-50/60 dark:bg-[#111317]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-[#1c1f26] border border-neutral-200 dark:border-[#2c2f38] rounded text-[10px] shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-[#1c1f26] border border-neutral-200 dark:border-[#2c2f38] rounded text-[10px] shadow-2xs">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 font-mono bg-white dark:bg-[#1c1f26] border border-neutral-200 dark:border-[#2c2f38] rounded text-[10px] shadow-2xs">
                ↵
              </kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-[#1c1f26] border border-neutral-200 dark:border-[#2c2f38] rounded text-[10px] shadow-2xs">
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
