import ArsenalGallery from '@/components/ArsenalGallery';

export const metadata = { title: 'ARSENAL // NeoProxy' };

export default function ArsenalPage() {
  return (
    <main style={{ background: '#000205', minHeight: '100vh' }}>
      <ArsenalGallery />
    </main>
  );
}
