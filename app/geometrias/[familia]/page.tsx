import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Explorer from '@/components/geometrias/Explorer'
import { GEOMETRY_FAMILIES, type GeometryFamily } from '@/lib/specimens/families'
import { GEO } from '@/lib/specimens/geo-specs'

export const dynamicParams = false
export function generateStaticParams() {
  return GEOMETRY_FAMILIES.map((familia) => ({ familia }))
}

export async function generateMetadata({ params }: { params: Promise<{ familia: string }> }): Promise<Metadata> {
  const { familia } = await params
  const spec = GEO[familia as GeometryFamily]
  if (!spec) return {}
  return { title: `${spec.title}: ${spec.tagline} // NeoProxy GEOMETRÍAS`, description: spec.concept.slice(0, 200) }
}

export default async function Page({ params }: { params: Promise<{ familia: string }> }) {
  const { familia } = await params
  if (!(GEOMETRY_FAMILIES as readonly string[]).includes(familia)) notFound()
  return <Explorer family={familia as GeometryFamily} />
}
