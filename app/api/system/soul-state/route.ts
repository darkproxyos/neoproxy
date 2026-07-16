import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // 1. Git log - commits últimos 30 días
    let commits_30d = 0
    let last_commit: { date: string | null, message: string | null } = { date: null, message: null }
    
    try {
      const { stdout } = await execAsync('git log --since="30 days ago" --pretty=format:"%ad|%s" --date=short', {
        cwd: process.cwd()
      })
      
      const lines = stdout.trim().split('\n').filter(line => line)
      commits_30d = lines.length
      
      if (lines.length > 0) {
        const lastLine = lines[0]
        const [date, ...messageParts] = lastLine.split('|')
        last_commit = {
          date: date || null,
          message: messageParts.join('|') || null
        }
      }
    } catch (error) {
      console.error('Git log error:', error)
      // Git commands failed - return nulls
    }

    // 2. Calcular streak (días consecutivos con commits)
    let streak_days: number | null = null
    try {
      const { stdout } = await execAsync('git log --since="30 days ago" --pretty=format:"%ad" --date=short', {
        cwd: process.cwd()
      })
      
      const dates = [...new Set(stdout.trim().split('\n').filter(line => line))]
      dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      
      if (dates.length > 0) {
        let streak = 1
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (let i = 0; i < dates.length - 1; i++) {
          const current = new Date(dates[i])
          const next = new Date(dates[i + 1])
          const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diffDays === 1) {
            streak++
          } else {
            break
          }
        }
        streak_days = streak
      }
    } catch (error) {
      console.error('Streak calculation error:', error)
    }

    // 3. Leer hub.json
    let hub_data: any = null
    try {
      const hubPath = path.join(process.cwd(), 'Memory', 'hub.json')
      const hubContent = await fs.readFile(hubPath, 'utf-8')
      hub_data = JSON.parse(hubContent)
    } catch (error) {
      console.error('hub.json read error:', error)
    }

    // 4. Contar archivos en Memory/
    let events_count = 0
    let decisions_count = 0
    let artifacts_count = 0
    
    try {
      const memoryPath = path.join(process.cwd(), 'Memory')
      
      const eventsPath = path.join(memoryPath, 'events')
      const decisionsPath = path.join(memoryPath, 'decisions')
      const artifactsPath = path.join(memoryPath, 'artifacts')
      
      try {
        const eventsFiles = await fs.readdir(eventsPath)
        events_count = eventsFiles.length
      } catch {}
      
      try {
        const decisionsFiles = await fs.readdir(decisionsPath)
        decisions_count = decisionsFiles.length
      } catch {}
      
      try {
        const artifactsFiles = await fs.readdir(artifactsPath)
        artifacts_count = artifactsFiles.length
      } catch {}
    } catch (error) {
      console.error('Memory count error:', error)
    }

    // 5. Extraer datos de hub.json si existen
    const agents_active = hub_data?.active_agents ?? null
    const system_health = hub_data?.system_health ?? hub_data?.kernel?.metatron?.system_health ?? null
    const last_backup = hub_data?.last_backup ?? null

    const metatron = hub_data?.kernel?.metatron ? {
      status: hub_data.kernel.metatron.status,
      current_intent: hub_data.kernel.metatron.current_intent,
      pipeline: hub_data.kernel.metatron.current_pipeline,
      running_agents: hub_data.kernel.metatron.running_agents,
      system_health: hub_data.kernel.metatron.system_health,
      memory_sync_pct: hub_data.kernel.metatron.memory_sync_pct
    } : null

    return NextResponse.json({
      commits_30d,
      streak_days,
      last_commit,
      agents_active,
      system_health,
      events_count,
      decisions_count,
      artifacts_count,
      last_backup,
      metatron
    }, { status: 200 })
  } catch (error) {
    console.error('Soul state error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch soul state' },
      { status: 500 }
    )
  }
}
