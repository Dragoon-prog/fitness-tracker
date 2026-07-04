import React, { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // This ensures the link works on your local PC and your live site
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      alert(error.error_description || error.message)
    } else {
      alert('Check your email for the login link!')
    }
    setLoading(false)
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#0f172a', marginBottom: '10px' }}>Fitness Tracker</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Sign in via magic link with your email below</p>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <input
              style={inputStyle}
              type="email"
              placeholder="Your email"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <button style={btnStyle} disabled={loading}>
              {loading ? <span>Sending...</span> : <span>Send Magic Link</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- STYLES ---
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  padding: '20px'
};

const cardStyle = {
  background: 'white',
  padding: '40px',
  borderRadius: '24px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  textAlign: 'center',
  maxWidth: '400px',
  width: '100%',
  border: '1px solid #e2e8f0'
};

const inputStyle = {
  width: '100%',
  padding: '12px 15px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '16px',
  boxSizing: 'border-box'
};

const btnStyle = {
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  padding: '14px 20px',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  width: '100%',
  transition: 'background 0.2s'
};