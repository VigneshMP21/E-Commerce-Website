import { Link } from 'react-router-dom';
import { HiOutlineChevronRight, HiOutlineHome } from 'react-icons/hi';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
      <Link to="/" className="hover:text-primary-600 transition-colors">
        <HiOutlineHome size={16} />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <HiOutlineChevronRight size={14} />
          {index === items.length - 1 ? (
            <span className="text-gray-900 dark:text-white font-medium">{item.name}</span>
          ) : (
            <Link to={item.path} className="hover:text-primary-600 transition-colors">{item.name}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
