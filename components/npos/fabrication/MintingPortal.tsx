'use client'

import { useState } from 'react'
import { Cipher } from '@/lib/agents/cipher'

interface MintingPortalProps {
  specimen: {
    name: string
    path: string
  }
  onSuccess: (data: any) => void
}

export default function MintingPortal({ specimen, onSuccess }: MintingPortalProps) {
  const [step, setStep] = useState<'IDLE' | 'HASHING' | 'IPFS' | 'MINTING' | 'SUCCESS'>('IDLE')
  const [wallet, setWallet] = useState('')
  const [progress, setProgress] = useState(0)

  const handleMint = async () => {
    if (!wallet) return alert('WALLET_REQUIRED_FOR_LINEAGE_BINDING')
    
    setStep('HASHING')
    let p = 0
    const interval = setInterval(() => {
      p += 5
      setProgress(p)
      if (p === 30) setStep('IPFS')
      if (p === 70) setStep('MINTING')
      if (p >= 100) {
        clearInterval(interval)
        finalize()
      }
    }, 100)
  }

  const finalize = async () => {
    try {
      const result = await Cipher.requestMint(specimen.name, wallet, { name: specimen.name, path: specimen.path })
      await Cipher.confirmMint(specimen.name, result.tokenId, result.txHash)
      setStep('SUCCESS')
      onSuccess(result)
    } catch (e) {
      console.error(e)
      alert('MINTING_PROTOCOL_ERROR')
      setStep('IDLE')
    }
  }

  return (
    <div className="minting-portal">
      {step === 'IDLE' && (
        <div className="portal-idle">
          <input 
            type="text" 
            placeholder="ENTER_DESTINATION_WALLET_0x..." 
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="wallet-input"
          />
          <button onClick={handleMint} className="mint-action-btn">
            PERMANENTIZE_UNIT (MINT)
          </button>
        </div>
      )}

      {(step === 'HASHING' || step === 'IPFS' || step === 'MINTING') && (
        <div className="portal-active">
          <div className="status-label">{step}_PROTOCOL_IN_PROGRESS...</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="meta-trace">NODE_SYNC: OK // GAS_LIMIT: PREDETERMINED</div>
        </div>
      )}

      {step === 'SUCCESS' && (
        <div className="portal-success">
          <div className="success-icon">✓</div>
          <div className="success-label">LINEAGE_PERMANENTLY_SEALED</div>
          <div className="meta-trace" style={{ color: '#5ef0c0' }}>TOKEN_ID_BOUND_TO_SPECIMEN</div>
        </div>
      )}

      <style jsx>{`
        .minting-portal {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: rgba(0, 212, 255, 0.05);
          border: 1px dashed rgba(0, 212, 255, 0.2);
          border-radius: 4px;
        }
        .portal-idle {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .wallet-input {
          background: rgba(2, 4, 8, 0.8);
          border: 1px solid #1a2c42;
          color: #00d4ff;
          padding: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          outline: none;
        }
        .mint-action-btn {
          background: #00d4ff22;
          border: 1px solid #00d4ff;
          color: #00d4ff;
          padding: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mint-action-btn:hover {
          background: #00d4ff44;
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
        }
        .portal-active {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .status-label {
          font-size: 0.7rem;
          letter-spacing: 2px;
          color: #00d4ff;
        }
        .progress-bar {
          height: 4px;
          background: rgba(26, 44, 66, 0.5);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #00d4ff;
          box-shadow: 0 0 10px #00d4ff;
          transition: width 0.1s;
        }
        .meta-trace {
          font-size: 0.5rem;
          color: #4a6080;
          font-family: 'Space Mono', monospace;
        }
        .portal-success {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .success-icon {
          color: #5ef0c0;
          font-size: 1.5rem;
        }
        .success-label {
          color: #5ef0c0;
          font-size: 0.8rem;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  )
}
