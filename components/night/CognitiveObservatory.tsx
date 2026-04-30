'use client'

import { useState, useEffect } from 'react'

interface AgentMetrics {
  agent_name: string
  messages_count: number
  avg_response_time: number
  novelty_score: number
  influence_score: number
  specialization: string
  evolution_level: number
}

interface TopicMetrics {
  topic: string
  message_count: number
  consensus_score: number
  entropy_score: number
  dominant_agent: string
  concept_discoveries: string[]
}

interface AssemblyMetrics {
  date: string
  total_messages: number
  active_agents: number
  topics_discussed: number
  novel_concepts: number
  consensus_level: number
  system_entropy: number
}

export default function CognitiveObservatory() {
  const [metrics, setMetrics] = useState<AssemblyMetrics | null>(null)
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([])
  const [topicMetrics, setTopicMetrics] = useState<TopicMetrics[]>([])

  useEffect(() => {
    // Simulate real-time cognitive metrics
    const interval = setInterval(() => {
      // Simulate assembly metrics
      const newMetrics: AssemblyMetrics = {
        date: new Date().toISOString(),
        total_messages: Math.floor(Math.random() * 500) + 200,
        active_agents: Math.floor(Math.random() * 8) + 3,
        topics_discussed: Math.floor(Math.random() * 15) + 5,
        novel_concepts: Math.floor(Math.random() * 20) + 8,
        consensus_level: Math.random() * 0.8 + 0.2,
        system_entropy: Math.random() * 0.9 + 0.1
      }

      // Simulate agent metrics
      const agents = ['Trickster', 'Genos', 'Oracle', 'Architect', 'Explorer', 'Synthesizer']
      const newAgentMetrics: AgentMetrics[] = agents.map(name => ({
        agent_name: name,
        messages_count: Math.floor(Math.random() * 100) + 20,
        avg_response_time: Math.random() * 2000 + 500,
        novelty_score: Math.random() * 0.8 + 0.2,
        influence_score: Math.random() * 0.9 + 0.1,
        specialization: ['Conceptual', 'Technical', 'Creative', 'Analytical', 'Synthesis', 'Strategic'][Math.floor(Math.random() * 6)],
        evolution_level: Math.floor(Math.random() * 5) + 1
      }))

      // Simulate topic metrics
      const topics = ['Aesthetic Genome', 'Distributed Agent Council', 'Cognitive Architecture', 'Procedural Evolution', 'Neural Style Transfer']
      const newTopicMetrics: TopicMetrics[] = topics.map(topic => ({
        topic,
        message_count: Math.floor(Math.random() * 50) + 10,
        consensus_score: Math.random() * 0.7 + 0.3,
        entropy_score: Math.random() * 0.8 + 0.2,
        dominant_agent: agents[Math.floor(Math.random() * agents.length)],
        concept_discoveries: [`Concept_${Math.random().toString(36).substr(2, 9)}`, `Idea_${Math.random().toString(36).substr(2, 9)}`]
      }))

      setMetrics(newMetrics)
      setAgentMetrics(newAgentMetrics)
      setTopicMetrics(newTopicMetrics)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '320px',
      background: 'rgba(2, 4, 8, 0.95)',
      border: '1px solid #00d4ff33',
      borderRadius: '4px',
      padding: '15px',
      fontFamily: "'Space Mono', monospace",
      fontSize: '10px',
      color: '#00d4ff',
      zIndex: 9999,
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #00d4ff22', paddingBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#00ff9d' }}>
          🔬 COGNITIVE OBSERVATORY
        </div>
        {metrics && (
          <div style={{ fontSize: '9px', lineHeight: '1.4' }}>
            <div>📅 {new Date(metrics.date).toLocaleDateString()}</div>
            <div>💬 Messages: {metrics.total_messages}</div>
            <div>🤖 Agents: {metrics.active_agents}</div>
            <div>🎯 Topics: {metrics.topics_discussed}</div>
            <div>💡 Concepts: {metrics.novel_concepts}</div>
            <div>🤝 Consensus: {(metrics.consensus_level * 100).toFixed(1)}%</div>
            <div>🌊 Entropy: {(metrics.system_entropy * 100).toFixed(1)}%</div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '15px', borderBottom: '1px solid #00d4ff22', paddingBottom: '10px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', color: '#00ff9d' }}>
          🏆 TOP AGENTS
        </div>
        {agentMetrics
          .sort((a, b) => b.influence_score - a.influence_score)
          .slice(0, 3)
          .map((agent, index) => (
            <div key={agent.agent_name} style={{ fontSize: '9px', marginBottom: '5px', padding: '5px', background: 'rgba(0, 255, 157, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{index + 1}. {agent.agent_name}</span>
                <span style={{ color: '#00ff9d' }}>{(agent.influence_score * 100).toFixed(0)}%</span>
              </div>
              <div style={{ fontSize: '8px', color: '#4a6080', marginTop: '2px' }}>
                {agent.specialization} • Level {agent.evolution_level}
              </div>
            </div>
          ))}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', color: '#00ff9d' }}>
          🧠 ACTIVE CONCEPTS
        </div>
        {topicMetrics
          .sort((a, b) => b.consensus_score - a.consensus_score)
          .slice(0, 3)
          .map((topic, index) => (
            <div key={topic.topic} style={{ fontSize: '9px', marginBottom: '5px', padding: '5px', background: 'rgba(0, 212, 255, 0.1)' }}>
              <div style={{ fontWeight: 'bold' }}>{index + 1}. {topic.topic}</div>
              <div style={{ fontSize: '8px', color: '#4a6080', marginTop: '2px' }}>
                Consensus: {(topic.consensus_score * 100).toFixed(0)}% • by {topic.dominant_agent}
              </div>
            </div>
          ))}
      </div>

      <div style={{ marginTop: '10px', fontSize: '8px', color: '#4a6080', textAlign: 'center' }}>
        🔄 Real-time Analysis • Auto-refresh every 3s
      </div>
    </div>
  )
}
