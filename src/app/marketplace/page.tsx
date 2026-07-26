// src/app/marketplace/page.tsx
export default function MarketplacePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Marketplace</h1>
      <p className="text-gray-600">Browse educational resources</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4">
            <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
            <h3 className="font-semibold">Resource {i}</h3>
            <p className="text-sm text-gray-600">Sample resource description</p>
          </div>
        ))}
      </div>
    </div>
  )
}
