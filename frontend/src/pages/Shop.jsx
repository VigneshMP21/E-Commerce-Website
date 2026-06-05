import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments, HiOutlineX } from 'react-icons/hi';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import ProductSkeleton from '../components/ui/Skeleton';
import Breadcrumb from '../components/ui/Breadcrumb';

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Best Selling' },
  { value: 'rating', label: 'Highest Rated' }
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [searchInfo, setSearchInfo] = useState(null);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const requestedSort = searchParams.get('sort') || '';
  const sort = !search && requestedSort === 'relevance' ? 'newest' : requestedSort || (search ? 'relevance' : 'newest');
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: '50', sort });
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    api.get(`/products?${params}`)
      .then(res => {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
        setSearchInfo(res.data.search || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, sort, minPrice, maxPrice, page]);

  const updateParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});
  const visibleSortOptions = search ? sortOptions : sortOptions.filter(option => option.value !== 'relevance');
  const highlightQuery = searchInfo?.usedQuery || searchInfo?.correctedQuery || search;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 md:py-8 lg:px-8 2xl:px-10">
      <Breadcrumb items={[
        ...(category ? [{ name: 'Categories', path: '/categories' }] : []),
        { name: search ? `Search: "${search}"` : category || 'All Products' }
      ]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {search ? `Results for "${search}"` : category ? category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} products found</p>
          {searchInfo?.correctedQuery && searchInfo.correctedQuery.toLowerCase() !== search.toLowerCase() && (
            <p className="mt-1 text-sm text-gray-500">
              Showing results for <span className="font-medium text-gray-900 dark:text-gray-100">{searchInfo.correctedQuery}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select value={sort} onChange={e => updateParams('sort', e.target.value)}
            className="input-field text-sm !py-2 !w-auto">
            {visibleSortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary !px-3 !py-2 lg:hidden">
            <HiOutlineAdjustments size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-6 xl:gap-8">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 flex' : 'hidden'} lg:block lg:relative lg:w-64 xl:w-72 flex-shrink-0`}>
          <div className="bg-white dark:bg-gray-950 lg:bg-transparent w-full max-w-sm lg:max-w-none p-6 lg:p-0 lg:sticky lg:top-24 lg:h-fit overflow-y-auto">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setShowFilters(false)}><HiOutlineX size={24} /></button>
            </div>

            {/* Price range */}
            <div className="mb-6">
              <h4 className="font-medium text-sm mb-3">Price Range</h4>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={e => updateParams('minPrice', e.target.value)}
                  className="input-field text-sm !py-2" />
                <input type="number" placeholder="Max" value={maxPrice} onChange={e => updateParams('maxPrice', e.target.value)}
                  className="input-field text-sm !py-2" />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="font-medium text-sm mb-3">Category</h4>
              <div className="space-y-2">
                {['electronics', 'fashion', 'home-living', 'beauty', 'books', 'sports'].map(c => (
                  <button key={c} onClick={() => updateParams('category', category === c ? '' : c)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === c ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={clearFilters} className="btn-secondary text-sm w-full">Clear Filters</button>
          </div>
          {/* Overlay for mobile */}
          {showFilters && <div className="fixed inset-0 bg-black/50 -z-10 lg:hidden" onClick={() => setShowFilters(false)} />}
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 2xl:grid-cols-5">
              {[...Array(10)].map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 2xl:grid-cols-5">
                {products.map(product => <ProductCard key={product.id} product={product} searchQuery={highlightQuery} />)}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button key={i} onClick={() => updateParams('page', String(i + 1))}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${page === String(i + 1) ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineAdjustments size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
