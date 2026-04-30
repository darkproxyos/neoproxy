'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
// import SpecimenCard from '@/components/npos/fabrication/SpecimenCard'
// import SpecimenModal from '@/components/npos/fabrication/SpecimenModal'

interface Specimen {
  name: string
  path: string
  size: string
  modified: string
  tokenId?: number
  txHash?: string
}

export default function FabricationGallery() {
  const [specimens, setSpecimens] = useState<Specimen[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/curated_stl_index.json')
        const data = await res.json()
        
        // Convert STL paths to GLB paths
        const glbData = data.map((item: any) => ({
          ...item,
          name: item.name.replace('.stl', ''),
          path: item.path.replace('/stls/', '/models/').replace('.stl', '.glb')
        }))
        setSpecimens(glbData)
        setLoading(false)
      } catch (err) {
        console.error('Error loading index:', err)
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const handleSpecimenUpdate = (updated: Specimen) => {
    setSpecimens(prev => prev.map(s => s.name === updated.name ? updated : s))
    setSelectedSpecimen(updated)
  }

  const filtered = specimens.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#020408', 
      color: '#00d4ff', 
      fontFamily: "'Space Mono', monospace",
      padding: '20px'
    }}>
      <div className="gallery-header">
        <div>
          <h1 style={{ fontSize: '18px', margin: 0 }}>NPOS // FABRICATION // CURATED_GALLERY</h1>
          <p style={{ fontSize: '10px', color: '#4a6080', margin: '4px 0 0 0' }}>
            PREMIUM_SPECIMENS: {specimens.length} OBJECTS DETECTED
          </p>
        </div>
        
        <div className="header-controls">
          <input 
            type="text" 
            placeholder="SEARCH_SPECIMEN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <Link href="/npos" className="back-link">
            BACK_TO_OS
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontSize: '14px', letterSpacing: '4px' }}>
          INITIALIZING_DATABASE...
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map((specimen, idx) => (
            <div key={idx} className="specimen-placeholder">
              <h3>{specimen.name}</h3>
              <p>{specimen.size}</p>
              <p>{specimen.modified}</p>
              <button onClick={() => setSelectedSpecimen(specimen)}>
                VIEW_SPECIMEN
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedSpecimen && (
        <div className="specimen-modal">
          <h2>{selectedSpecimen.name}</h2>
          <p>Size: {selectedSpecimen.size}</p>
          <p>Modified: {selectedSpecimen.modified}</p>
          <p>Path: {selectedSpecimen.path}</p>
          <button onClick={() => setSelectedSpecimen(null)}>
            CLOSE
          </button>
        </div>
      )}

      {/* Footer Status */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '20px', 
        fontSize: '9px', 
        color: '#1a3040',
        pointerEvents: 'none'
      }}>
        // LOCAL_LINK_READY // PROXY_FS_ACTIVE // GALLERY_V1.0
      </div>

      <style jsx>{`
        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 1px solid #00d4ff22;
          padding-bottom: 10px;
        }

        .header-controls {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .search-input {
          background: rgba(0, 212, 255, 0.05);
          border: 1px solid #00d4ff44;
          color: #00d4ff;
          padding: 8px 15px;
          font-size: 11px;
          width: 250px;
          outline: none;
        }

        .back-link {
          color: #00d4ff;
          text-decoration: none;
          font-size: 11px;
          border: 1px solid #00d4ff44;
          padding: 8px 15px;
          white-space: nowrap;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        @media (max-width: 768px) {
          .gallery-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .header-controls {
            width: 100%;
            justify-content: space-between;
            gap: 10px;
          }

          .search-input {
            width: 100%;
            flex: 1;
          }

          .gallery-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 15px;
          }
        }

        @media (max-width: 480px) {
          .gallery-grid {
            grid-template-columns: 1fr;
          }

          .header-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .back-link {
            text-align: center;
          }
        }
      `}</style>
      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #020408; }
        ::-webkit-scrollbar-thumb { background: #00d4ff33; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #00d4ff66; }
      `}</style>
    </div>
  )
}
