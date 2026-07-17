import ArsenalGallery from '@/components/ArsenalGallery';

export const metadata = { title: 'ARSENAL // NeoProxy' };

export default function ArsenalPage() {
  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <ArsenalGallery />
    </main>
  );
}
