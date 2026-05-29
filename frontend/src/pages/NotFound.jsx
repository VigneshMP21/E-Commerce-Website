import { Link } from 'react-router-dom';
import { HiOutlineHome } from 'react-icons/hi';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <h1 className="text-8xl md:text-9xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-flex">
          <HiOutlineHome size={20} className="mr-2" /> Go Home
        </Link>
      </div>
    </div>
  );
}
