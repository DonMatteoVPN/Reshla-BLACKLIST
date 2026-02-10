import { useTranslation } from 'react-i18next'

interface FilterBarProps {
    filter: 'all' | 'active' | 'pending'
    setFilter: (filter: 'all' | 'active' | 'pending') => void
    searchQuery: string
    setSearchQuery: (query: string) => void
}

const FilterBar = ({ filter, setFilter, searchQuery, setSearchQuery }: FilterBarProps) => {
    const { t } = useTranslation()

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Фильтры */}
            <div className="flex space-x-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded transition-colors ${filter === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-dark-surface hover:bg-dark-border'
                        }`}
                >
                    {t('dashboard.filterAll')}
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded transition-colors ${filter === 'active'
                            ? 'bg-primary text-white'
                            : 'bg-dark-surface hover:bg-dark-border'
                        }`}
                >
                    {t('dashboard.filterActive')}
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded transition-colors ${filter === 'pending'
                            ? 'bg-primary text-white'
                            : 'bg-dark-surface hover:bg-dark-border'
                        }`}
                >
                    {t('dashboard.filterPending')}
                </button>
            </div>

            {/* Поиск */}
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.searchPlaceholder')}
                className="flex-1 px-4 py-2 rounded bg-dark-surface border border-dark-border focus:border-primary outline-none transition-colors"
            />
        </div>
    )
}

export default FilterBar
