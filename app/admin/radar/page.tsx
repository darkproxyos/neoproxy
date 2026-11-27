import { redirect } from 'next/navigation'

// RADAR se mudó a /radar (sin login de admin; lo que gasta créditos pide la clave personal)
export default function RadarAdmin() { redirect('/radar') }
