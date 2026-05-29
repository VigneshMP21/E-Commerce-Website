export default function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton" />
        <div className="h-4 w-full skeleton" />
        <div className="h-3 w-24 skeleton" />
        <div className="h-5 w-20 skeleton" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-custom py-8 space-y-6">
      <div className="h-8 w-48 skeleton" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    </div>
  );
}
