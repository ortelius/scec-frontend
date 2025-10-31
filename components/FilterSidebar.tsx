'use client'

interface FilterSidebarProps {
  filters: {
    vulnerabilityScore: string[]
    openssfScore: string[]
    name: string
  }
  setFilters: (filters: any) => void
}

export default function FilterSidebar({ filters, setFilters }: FilterSidebarProps) {
  const handleCheckboxChange = (category: 'vulnerabilityScore' | 'openssfScore', value: string) => {
    setFilters((prev: any) => {
      const currentValues = prev[category]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v: string) => v !== value)
        : [...currentValues, value]

      return {
        ...prev,
        [category]: newValues,
      }
    })
  }

  const handleNameChange = (value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      name: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      vulnerabilityScore: [],
      openssfScore: [],
      name: '',
    })
  }

  const hasActiveFilters = filters.vulnerabilityScore.length > 0 || filters.openssfScore.length > 0 || filters.name !== ''

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Name</h4>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Filter by name..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Vulnerability Score</h4>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.vulnerabilityScore.includes('critical')}
                onChange={() => handleCheckboxChange('vulnerabilityScore', 'critical')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Critical</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.vulnerabilityScore.includes('high')}
                onChange={() => handleCheckboxChange('vulnerabilityScore', 'high')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">High</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.vulnerabilityScore.includes('medium')}
                onChange={() => handleCheckboxChange('vulnerabilityScore', 'medium')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Medium</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.vulnerabilityScore.includes('low')}
                onChange={() => handleCheckboxChange('vulnerabilityScore', 'low')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Low</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.vulnerabilityScore.includes('clean')}
                onChange={() => handleCheckboxChange('vulnerabilityScore', 'clean')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Clean</span>
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">OpenSSF Score</h4>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.openssfScore.includes('high')}
                onChange={() => handleCheckboxChange('openssfScore', 'high')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">High (8.0+)</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.openssfScore.includes('medium')}
                onChange={() => handleCheckboxChange('openssfScore', 'medium')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Medium (6.0-7.9)</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.openssfScore.includes('low')}
                onChange={() => handleCheckboxChange('openssfScore', 'low')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Low (&lt;6.0)</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  )
}
