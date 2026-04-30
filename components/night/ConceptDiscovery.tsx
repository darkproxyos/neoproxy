'use client'

import { useState, useEffect } from 'react'

interface DiscoveredConcept {
  id: string
  concept: string
  domain: string
  description: string
  origin: string
  agents: string[]
  confidence: number
  novelty_score: number
  applications: string[]
  timestamp: string
  tags: string[]
}

export default function ConceptDiscovery() {
  const [concepts, setConcepts] = useState<DiscoveredConcept[]>([])
  const [selectedConcept, setSelectedConcept] = useState<DiscoveredConcept | null>(null)

  useEffect(() => {
    // Simulate concept discovery from night assembly
    const discoveredConcepts: DiscoveredConcept[] = [
      {
        id: 'cognitive_observatory',
        concept: 'Cognitive Observatory',
        domain: 'systems_architecture',
        description: 'Real-time monitoring and analysis of multi-agent cognitive processes, enabling emergent behavior detection and system optimization.',
        origin: 'Night Assembly 2026-03-14',
        agents: ['Oracle', 'Trickster', 'Genos'],
        confidence: 0.87,
        novelty_score: 0.92,
        applications: ['Agent coordination', 'System optimization', 'Emergent behavior prediction'],
        timestamp: '2026-03-14T02:30:00Z',
        tags: ['cognition', 'monitoring', 'multi-agent', 'emergence']
      },
      {
        id: 'aesthetic_genome',
        concept: 'Aesthetic Genome',
        domain: 'design_systems',
        description: 'Parameterized style system allowing mutation, evolution, and inheritance of visual characteristics across NeoProxy artifacts.',
        origin: 'Night Assembly 2026-03-14',
        agents: ['Trickster', 'Explorer'],
        confidence: 0.73,
        novelty_score: 0.88,
        applications: ['Procedural generation', 'Style evolution', 'Design inheritance'],
        timestamp: '2026-03-14T03:15:00Z',
        tags: ['aesthetics', 'procedural', 'evolution', 'design']
      },
      {
        id: 'distributed_agent_council',
        concept: 'Distributed Agent Council',
        domain: 'governance',
        description: 'Decentralized decision-making system where agents vote on system-level changes based on expertise and influence metrics.',
        origin: 'Night Assembly 2026-03-14',
        agents: ['Genos', 'Architect', 'Oracle'],
        confidence: 0.81,
        novelty_score: 0.79,
        applications: ['System governance', 'Resource allocation', 'Conflict resolution'],
        timestamp: '2026-03-14T01:45:00Z',
        tags: ['governance', 'distributed', 'voting', 'autonomy']
      },
      {
        id: 'neural_style_transfer',
        concept: 'Neural Style Transfer',
        domain: 'ai_integration',
        description: 'Real-time style migration between different aesthetic domains using neural networks, enabling cross-domain creativity.',
        origin: 'Night Assembly 2026-03-14',
        agents: ['Explorer', 'Synthesizer'],
        confidence: 0.68,
        novelty_score: 0.95,
        applications: ['Style synthesis', 'Creative augmentation', 'Cross-domain inspiration'],
        timestamp: '2026-03-14T04:00:00Z',
        tags: ['neural', 'style', 'transfer', 'creativity']
      }
    ]

    setConcepts(discoveredConcepts)
  }, [])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#00ff9d'
    if (confidence >= 0.6) return '#00d4ff'
    return '#ff6b6b'
  }

  const getNoveltyIndicator = (novelty: number) => {
    if (novelty >= 0.9) return '🔥 BREAKTHROUGH'
    if (novelty >= 0.7) return '💡 NOVEL'
    return '📈 EVOLUTIONARY'
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      width: '320px',
      background: 'rgba(2, 4, 8, 0.95)',
      border: '1px solid #ff6b6b33',
      borderRadius: '4px',
      padding: '15px',
      fontFamily: "'Space Mono', monospace",
      fontSize: '10px',
      color: '#ff6b6b',
      zIndex: 9997,
      maxHeight: '70vh',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #ff6b6b22', paddingBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
          🧠 CONCEPT DISCOVERY
        </div>
        <div style={{ fontSize: '9px', color: '#4a6080' }}>
          {concepts.length} concepts discovered • Auto-extraction from assembly
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
          💡 DISCOVERED CONCEPTS
        </div>
        {concepts
          .sort((a, b) => b.novelty_score - a.novelty_score)
          .slice(0, 4)
          .map(concept => (
            <div 
              key={concept.id}
              style={{ 
                marginBottom: '10px', 
                padding: '8px', 
                background: selectedConcept?.id === concept.id ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.05)',
                borderRadius: '3px',
                cursor: 'pointer',
                border: selectedConcept?.id === concept.id ? '1px solid #ff6b6b' : '1px solid transparent'
              }}
              onClick={() => setSelectedConcept(concept)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '10px' }}>{concept.concept}</span>
                <span style={{ fontSize: '8px', color: getConfidenceColor(concept.confidence) }}>
                  {(concept.confidence * 100).toFixed(0)}%
                </span>
              </div>
              
              <div style={{ fontSize: '8px', color: '#4a6080', marginBottom: '4px' }}>
                {concept.domain} • {getNoveltyIndicator(concept.novelty_score)}
              </div>
              
              <div style={{ fontSize: '8px', color: '#4a6080', marginBottom: '4px' }}>
                by: {concept.agents.join(', ')}
              </div>

              <div style={{ fontSize: '8px', color: '#ff6b6b', marginTop: '4px' }}>
                {concept.description.substring(0, 80)}...
              </div>
            </div>
          ))}
      </div>

      {selectedConcept && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: 'rgba(255, 107, 107, 0.1)', 
          borderRadius: '3px',
          border: '1px solid #ff6b6b33'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
            🔍 {selectedConcept.concept}
          </div>
          
          <div style={{ fontSize: '9px', lineHeight: '1.4' }}>
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#4a6080' }}>Domain:</span> {selectedConcept.domain}
            </div>
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#4a6080' }}>Origin:</span> {selectedConcept.origin}
            </div>
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#4a6080' }}>Confidence:</span> 
              <span style={{ color: getConfidenceColor(selectedConcept.confidence) }}>
                {(selectedConcept.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#4a6080' }}>Novelty:</span> {getNoveltyIndicator(selectedConcept.novelty_score)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#4a6080' }}>Applications:</span>
              <div style={{ marginTop: '3px', marginLeft: '10px' }}>
                {selectedConcept.applications.map((app, index) => (
                  <div key={index} style={{ fontSize: '8px', marginBottom: '2px' }}>
                    • {app}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span style={{ color: '#4a6080' }}>Tags:</span>
              <div style={{ marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {selectedConcept.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '7px',
                    background: '#ff6b6b22',
                    color: '#ff6b6b',
                    padding: '2px 6px',
                    borderRadius: '2px'
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '8px', color: '#4a6080', textAlign: 'center' }}>
        🧠 Concepts auto-extracted • Novelty threshold: 0.7 • Confidence threshold: 0.6
      </div>
    </div>
  )
}
