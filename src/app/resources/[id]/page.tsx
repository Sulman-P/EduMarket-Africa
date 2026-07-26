// src/app/resources/[id]/page.tsx
export default function ResourceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Resource Details</h1>
      <p className="text-gray-600">Viewing resource: {params.id}</p>
    </div>
  )
}
