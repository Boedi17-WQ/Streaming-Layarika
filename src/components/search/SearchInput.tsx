"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

interface SearchInputProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  initialQuery = "",
  placeholder = "Cari film, serial, atau genre...",
  className = "",
  autoFocus = false,
}: SearchInputProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`relative flex items-center w-full ${className}`}
    >
      <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-[#A3A3A3]">
        <MagnifyingGlass size={18} />
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-10 w-full rounded-lg border border-[#292929] bg-[#171717] pl-10 pr-10 text-sm text-[#F5F5F5] placeholder-[#737373] transition-colors focus:border-[#D9A52E] focus:outline-none focus:ring-1 focus:ring-[#D9A52E]"
      />

      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Bersihkan pencarian"
          className="absolute right-3 flex items-center justify-center text-[#A3A3A3] hover:text-[#F5F5F5]"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
}
