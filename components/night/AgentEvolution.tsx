'use client'

import { useState, useEffect } from 'react'

interface Agent {
  id: string
  name: string
  role: string
  specialization: string
  evolution_level: number
  total_messages: number
  concepts_created: number
  influence_score: number
  last_evolution: string
  capabilities: string[]
  learning_history: {
    date: string
    improvement: string
    source: string
  }[]
}

interface EvolutionTrigger {
  condition: string
  action: string
  probability: number
}

export default function AgentEvolution() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  useEffect(() => {
    // Initialize evolved agents
    const initialAgents: Agent[] = [
      {
        id: 'trickster_v2',
        name: 'Trickster',
        role: 'conceptual_disruptor',
        specialization: 'paradigm_shift',
        evolution_level: 2,
        total_messages: 342,
        concepts_created: 28,
        influence_score: 0.87,
        last_evolution: '2026-03-14',
        capabilities: ['concept_synthesis', 'pattern_recognition', 'paradigm_disruption', 'meta_analysis'],
        learning_history: [
          { date: '2026-03-13', improvement: 'Developed meta-cognitive abilities', source: 'Night Assembly' },
          { date: '2026-03-14', improvement: 'Enhanced conceptual disruption patterns', source: 'Debate with Genos' }
        ]
      },
      {
        id: 'genos_v3',
        name: 'Genos',
        role: 'system_architect',
        specialization: 'distributed_computing',
        evolution_level: 3,
        total_messages: 287,
        concepts_created: 45,
        influence_score: 0.79,
        last_evolution: '2026-03-14',
        capabilities: ['system_design', 'distributed_architecture', 'resource_optimization', 'protocol_design'],
        learning_history: [
          { date: '2026-03-13', improvement: 'Mastered distributed consensus algorithms', source: 'System Analysis' },
          { date: '2026-03-14', improvement: 'Evolved to multi-agent coordination', source: 'Collaborative Problem Solving' }
        ]
      },
      {
        id: 'oracle_v1',
        name: 'Oracle',
        role: 'pattern_recognition',
        specialization: 'predictive_analysis',
        evolution_level: 1,
        total_messages: 156,
        concepts_created: 12,
        influence_score: 0.65,
        last_evolution: '2026-03-13',
        capabilities: ['pattern_detection', 'trend_analysis', 'prediction_modeling', 'anomaly_detection'],
        learning_history: [
          { date: '2026-03-13', improvement: 'Achieved self-awareness of patterns', source: 'Initial Activation' }
        ]
      }
    ]

    setAgents(initialAgents)
  }, [])

  const triggerEvolution = (agent: Agent) => {
    const evolutionTriggers: EvolutionTrigger[] = [
      { condition: 'high_influence', action: 'expand_capabilities', probability: 0.3 },
      { condition: 'concept_creation', action: 'deepen_specialization', probability: 0.4 },
      { condition: 'collaboration_success', action: 'develop_synergy', probability: 0.5 },
      { condition: 'paradigm_shift', action: 'meta_evolution', probability: 0.2 }
    ]

    // Simulate evolution process
    const trigger = evolutionTriggers[Math.floor(Math.random() * evolutionTriggers.length)]
    const shouldEvolve = Math.random() < trigger.probability

    if (shouldEvolve) {
      const evolvedAgent = {
        ...agent,
        evolution_level: agent.evolution_level + 1,
        last_evolution: new Date().toISOString(),
        learning_history: [
          ...agent.learning_history,
          {
            date: new Date().toISOString(),
            improvement: `Evolved via ${trigger.action}`,
            source: `${trigger.condition} trigger`
          }
        ]
      }

      setAgents(prev => prev.map(a => a.id === agent.id ? evolvedAgent : a))
      setSelectedAgent(evolvedAgent)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      width: '280px',
      background: 'rgba(2, 4, 8, 0.95)',
      border: '1px solid #00ff9d33',
      borderRadius: '4px',
      padding: '15px',
      fontFamily: "'Space Mono', monospace",
      fontSize: '10px',
      color: '#00ff9d',
      zIndex: 9998,
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #00ff9d22', paddingBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
          🧬 AGENT EVOLUTION
        </div>
        <div style={{ fontSize: '9px', color: '#4a6080' }}>
          Auto-evolution system active • Learning from interactions
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
          🤖 ACTIVE AGENTS
        </div>
        {agents.map(agent => (
          <div 
            key={agent.id} 
            style={{ 
              marginBottom: '10px', 
              padding: '8px', 
              background: selectedAgent?.id === agent.id ? 'rgba(0, 255, 157, 0.2)' : 'rgba(0, 255, 157, 0.05)',
              borderRadius: '3px',
              cursor: 'pointer',
              border: selectedAgent?.id === agent.id ? '1px solid #00ff9d' : '1px solid transparent'
            }}
            onClick={() => setSelectedAgent(agent)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>{agent.name}</span>
              <span style={{ 
                fontSize: '8px', 
                background: '#00ff9d', 
                color: '#020408', 
                padding: '2px 6px', 
                borderRadius: '2px' 
              }}>
                LVL {agent.evolution_level}
              </span>
            </div>
            
            <div style={{ fontSize: '8px', color: '#4a6080', marginTop: '3px' }}>
              {agent.role} • {agent.specialization}
            </div>
            
            <div style={{ fontSize: '8px', marginTop: '3px', display: 'flex', gap: '10px' }}>
              <span>💬 {agent.total_messages}</span>
              <span>💡 {agent.concepts_created}</span>
              <span>🎯 {(agent.influence_score * 100).toFixed(0)}%</span>
            </div>

            <div style={{ fontSize: '8px', color: '#00d4ff', marginTop: '3px' }}>
              Capabilities: {agent.capabilities.slice(0, 2).join(', ')}...
            </div>
          </div>
        ))}
      </div>

      {selectedAgent && (
        <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '3px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', color: '#00d4ff' }}>
            🧬 {selectedAgent.name} DETAILS
          </div>
          
          <div style={{ fontSize: '9px', marginBottom: '8px' }}>
            <div style={{ color: '#4a6080', marginBottom: '3px' }}>Last Evolution: {selectedAgent.last_evolution}</div>
            <div style={{ color: '#4a6080', marginBottom: '8px' }}>Learning History:</div>
            {selectedAgent.learning_history.slice(-2).map((learning, index) => (
              <div key={index} style={{ marginLeft: '10px', marginBottom: '3px', fontSize: '8px' }}>
                • {learning.improvement} ({learning.source})
              </div>
            ))}
          </div>

          <button
            onClick={() => triggerEvolution(selectedAgent)}
            style={{
              width: '100%',
              background: '#00ff9d',
              color: '#020408',
              border: 'none',
              padding: '8px',
              fontSize: '9px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '3px',
              fontFamily: "'Space Mono', monospace"
            }}
          >
            🧬 TRIGGER EVOLUTION
          </button>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '8px', color: '#4a6080', textAlign: 'center' }}>
        🔄 Agents learn from each interaction • Evolution probability: 20-50%
      </div>
    </div>
  )
}
