import { redirect } from 'next/navigation'

// Esta ruta era el preview de la nube 3D (v1 hero orbitando, v2 mapa de
// islas, v3 la nube Ergo Proxy/Lain) mientras la home real seguía siendo
// la versión 2D/scroll. Ya pasó a ser la home real (app/page.tsx) — este
// archivo solo redirige para no romper ningún link viejo a /home-3d.
export default function HomeThreeDRedirect() {
  redirect('/')
}
