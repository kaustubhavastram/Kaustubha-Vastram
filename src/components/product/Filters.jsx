import { CATEGORIES } from '../../lib/constants';

export default function Filters({ activeFilter, onFilterChange }) {
  return (
    <div className="filters" id="filters">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          className={`filter${activeFilter === cat ? ' active' : ''}`}
          onClick={() => onFilterChange(cat)}
        >
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      ))}
    </div>
  );
}
