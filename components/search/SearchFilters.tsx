'use client'

import Link from 'next/link'
import { CATEGORIES } from '@/lib/validators/listings'

interface Props {
  q?: string
  category?: string
  type?: string
  min?: string
  max?: string
  sort?: string
}

export function SearchFilters({ q, category, type, min, max, sort }: Props) {
  const hasFilters = !!(q || category || type || min || max)

  function autoSubmit(e: React.ChangeEvent<HTMLSelectElement>) {
    e.currentTarget.form?.submit()
  }

  return (
    <>
      {/* Search + filter bar */}
      <form method="GET" className="space-y-3">
        <div className="flex gap-2">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search listings..."
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#ED1B2F] px-5 py-2 text-sm font-medium text-white hover:bg-[#C41525] transition-colors"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            name="type"
            defaultValue={type ?? ''}
            onChange={autoSubmit}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]"
          >
            <option value="">All types</option>
            <option value="good">Goods</option>
            <option value="service">Services</option>
          </select>

          <select
            name="category"
            defaultValue={category ?? ''}
            onChange={autoSubmit}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <input
              name="min"
              type="number"
              min="0"
              defaultValue={min}
              placeholder="$ Min"
              className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              name="max"
              type="number"
              min="0"
              defaultValue={max}
              placeholder="$ Max"
              className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]"
            />
          </div>

          <select
            name="sort"
            defaultValue={sort ?? ''}
            onChange={autoSubmit}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#ED1B2F] focus:border-[#ED1B2F]"
          >
            <option value="">Newest first</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </select>

          {hasFilters && (
            <Link
              href="/search"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Clear ×
            </Link>
          )}
        </div>
      </form>

      {/* Category pill shortcuts */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.value}
            href={`/search?category=${cat.value}`}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === cat.value
                ? 'border-[#ED1B2F] bg-red-50 text-[#ED1B2F]'
                : 'border-gray-200 text-gray-600 hover:border-[#ED1B2F] hover:text-[#ED1B2F]',
            ].join(' ')}
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </>
  )
}
