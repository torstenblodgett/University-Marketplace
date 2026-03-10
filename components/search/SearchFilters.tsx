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
      <form method="GET" className="space-y-4">
        <div className="flex gap-2">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search listings..."
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          />
          <button
            type="submit"
            className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 transition-colors"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            name="type"
            defaultValue={type ?? ''}
            onChange={autoSubmit}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            <option value="">All types</option>
            <option value="good">Goods</option>
            <option value="service">Services</option>
          </select>

          <select
            name="category"
            defaultValue={category ?? ''}
            onChange={autoSubmit}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              name="min"
              type="number"
              min="0"
              defaultValue={min}
              placeholder="$ Min"
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-700"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              name="max"
              type="number"
              min="0"
              defaultValue={max}
              placeholder="$ Max"
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-700"
            />
          </div>

          <select
            name="sort"
            defaultValue={sort ?? ''}
            onChange={autoSubmit}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            <option value="">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>

          {hasFilters && (
            <Link
              href="/search"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear filters ×
            </Link>
          )}
        </div>
      </form>

      {/* Category pill shortcuts */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.value}
            href={`/search?category=${cat.value}`}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === cat.value
                ? 'border-red-700 bg-red-50 text-red-700'
                : 'border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700',
            ].join(' ')}
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </>
  )
}
