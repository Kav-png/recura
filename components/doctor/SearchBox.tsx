"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { severityMeta, type Severity } from "@/lib/status";

type SearchPatient = {
  id: string;
  name: string;
  condition: string;
  status: string;
};

export function SearchBox({ patients }: { patients: SearchPatient[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return patients
      .filter((p) => p.name.toLowerCase().includes(q) || p.condition.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, patients]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectPatient(id: string) {
    router.push(`/doctor/${id}`);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && results.length > 0) {
      selectPatient(results[0].id);
    }
  }

  return (
    <div ref={containerRef} className="relative hidden md:block w-[220px] lg:w-[280px]">
      <div className="flex items-center gap-2.5 bg-muted-bg rounded-xl px-4 py-2.5">
        <Search size={16} className="text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search patients..."
          className="bg-transparent text-sm w-full outline-none placeholder:text-muted"
        />
      </div>
      {open && query.trim() && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-surface border border-border rounded-xl shadow-lg shadow-black/10 overflow-hidden z-50">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">No patients found</div>
          ) : (
            results.map((p) => {
              const meta = severityMeta[(p.status as Severity) ?? "stable"];
              return (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p.id)}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-muted-bg transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted truncate">{p.condition}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
