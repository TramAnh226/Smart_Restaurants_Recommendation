import './QuickFilterBar.css';

export default function QuickFilterBar({ filters, activeFilter, onSelect }) {
  return (
    <div className="quick-filter-bar">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`quick-filter-chip ${activeFilter?.id === filter.id ? 'active' : ''}`}
          onClick={() => onSelect(filter)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
