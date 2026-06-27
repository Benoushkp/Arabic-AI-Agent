import React, { useState } from 'react';
import { BarChart3, Clock, Smile, ShieldAlert, PhoneIncoming, Search, Eye } from 'lucide-react';

const INITIAL_CALLS_LOG = [
  { id: 'c1', number: '+971 50 882 1928', time: '10 mins ago', duration: '1m 45s', topic: 'Order Tracking', status: 'Resolved', csat: '5/5', transcript: [
    { sender: 'user', text: 'Hello, I want to check when my wardrobe is coming.' },
    { sender: 'agent', text: 'Hej! Welcome to IKEA UAE Customer Support. My name is Sofia. I would be happy to track your wardrobe order. May I please have your 9-digit order number?' },
    { sender: 'user', text: 'Yes, it is 429 801 324.' },
    { sender: 'agent', text: 'Thank you! Let me check that order... Yes, I see it. Your PAX wardrobe is scheduled for delivery and assembly tomorrow between 9 AM and 2 PM. Our driver will send an SMS link with their live location 30 minutes before arrival.' },
    { sender: 'user', text: 'Perfect, thank you so much.' },
    { sender: 'agent', text: 'You are very welcome! Thank you for calling IKEA UAE. Have a wonderful day, and Hej då!' }
  ] },
  { id: 'c2', number: '+971 55 209 1198', time: '1 hour ago', duration: '2m 15s', topic: 'Stock Check', status: 'Resolved', csat: '4/5', transcript: [
    { sender: 'user', text: 'Hi, do you have the white billy bookcase in stock in dubai?' },
    { sender: 'agent', text: 'Hej! Welcome to IKEA UAE. Let me check the stock levels for the BILLY Bookcase in white. We have 45 units available in Dubai Festival City and 12 units in Festival Plaza Jebel Ali. It is currently fully in stock!' },
    { sender: 'user', text: 'Awesome, can I do click and collect?' },
    { sender: 'agent', text: 'Yes, absolutely! You can place a Click & Collect order online for free and pick it up from either store. Would you like me to guide you on how to place that order?' },
    { sender: 'user', text: 'No, that is okay, I will do it on the app. Thanks.' },
    { sender: 'agent', text: 'You are welcome! Thank you for calling IKEA UAE. Hej då!' }
  ] },
  { id: 'c3', number: '+971 56 312 8844', time: '3 hours ago', duration: '3m 02s', topic: 'Refund Inquiry', status: 'Resolved', csat: '5/5', transcript: [
    { sender: 'user', text: 'Hello, I bought a Malm dresser but it is opened and I want to return it.' },
    { sender: 'agent', text: 'Hej! I can explain our return policy. Opened or assembled items can be returned within 90 days of purchase with your receipt. We will issue an IKEA refund card for store credit. You can drop it off at the Customer Relations desk at any store.' },
    { sender: 'user', text: 'Okay, what about unopened items?' },
    { sender: 'agent', text: 'Unopened items in original packaging can be returned within 365 days for a full refund in your original payment method.' },
    { sender: 'user', text: 'Thank you. That is clear.' },
    { sender: 'agent', text: 'Great! Thank you for calling IKEA UAE. Have a lovely day, Hej då!' }
  ] }
];

export default function Analytics({ customCallHistory = [] }) {
  const [selectedCall, setSelectedCall] = useState(null);
  
  const logs = [...customCallHistory, ...INITIAL_CALLS_LOG];

  const topicsBreakdown = [
    { label: 'Order Delivery & Assembly Tracking', value: 42, color: 'var(--ikea-blue)' },
    { label: 'Store Stock & Product Catalog Checks', value: 28, color: 'var(--ikea-blue-light)' },
    { label: 'Returns, Exchanges & Refund Policies', value: 18, color: 'var(--ikea-yellow)' },
    { label: 'General Store Hours & Directions', value: 12, color: 'var(--status-idle)' }
  ];

  return (
    <div className="tab-content-container">
      <h2 className="section-title">
        <BarChart3 size={20} className="text-accent" />
        Call Analytics & Logs
      </h2>
      <p className="section-description">
        Monitor real-time performance indicators, topic distributions, and browse historical support transcripts.
      </p>

      {/* Metrics Cards Grid */}
      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <PhoneIncoming size={12} /> Total Calls
          </div>
          <div className="metric-value">142</div>
          <div className="metric-trend up">
            +12% this week
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> Avg. Handle Time
          </div>
          <div className="metric-value">2m 14s</div>
          <div className="metric-trend down" style={{ color: 'var(--status-success)' }}>
            -18s decrease
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Smile size={12} /> CSAT Rating
          </div>
          <div className="metric-value">94.2%</div>
          <div className="metric-trend up">
            +1.5% target index
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldAlert size={12} /> FCR Rate
          </div>
          <div className="metric-value">88.5%</div>
          <div className="metric-trend up">
            +0.8% auto-resolves
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Topic distribution */}
        <div className="card" style={{ margin: 0 }}>
          <h3 className="list-item-title" style={{ marginBottom: '1rem' }}>Support Topic Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {topicsBreakdown.map((topic, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span className="text-secondary">{topic.label}</span>
                  <span style={{ fontWeight: '600' }}>{topic.value}%</span>
                </div>
                <div className="chart-bar-track">
                  <div 
                    className="chart-bar-fill" 
                    style={{ 
                      width: `${topic.value}%`,
                      backgroundColor: topic.color
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSAT breakdown */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="list-item-title" style={{ marginBottom: '0.5rem' }}>Customer Sentiment</h3>
            <p className="form-label" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
              Sentiment analysis is derived from natural language keywords and CSAT reviews left by customers during phone surveys.
            </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-success)' }}>82%</div>
              <div className="form-label" style={{ fontSize: '0.7rem', margin: 0 }}>Positive</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-warning)' }}>12%</div>
              <div className="form-label" style={{ fontSize: '0.7rem', margin: 0 }}>Neutral</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-error)' }}>6%</div>
              <div className="form-label" style={{ fontSize: '0.7rem', margin: 0 }}>Negative</div>
            </div>
          </div>

          <div className="stock-pill in-stock" style={{ display: 'flex', justifyContent: 'center', padding: '0.4rem', fontSize: '0.75rem', marginTop: '1rem' }}>
            91% of positive reviews cite representative warm greetings.
          </div>
        </div>
      </div>

      {/* Recent Calls Log Table */}
      <div className="card" style={{ margin: 0 }}>
        <h3 className="list-item-title" style={{ marginBottom: '1rem' }}>Recent Calls Feed</h3>
        
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Primary Topic</th>
                <th>FCR CSAT</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontWeight: '500' }}>{log.number}</td>
                  <td>{log.time}</td>
                  <td>{log.duration}</td>
                  <td>
                    <span 
                      className="stock-pill" 
                      style={{ 
                        backgroundColor: 'rgba(255, 218, 26, 0.05)', 
                        color: 'var(--text-accent)', 
                        border: '1px solid rgba(255, 218, 26, 0.1)',
                        fontSize: '0.7rem'
                      }}
                    >
                      {log.topic}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--status-success)', fontWeight: '600' }}>{log.csat}</span>
                  </td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      onClick={() => setSelectedCall(log)}
                      style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', height: 'auto', borderRadius: '4px' }}
                    >
                      <Eye size={12} /> View transcript
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Modal Overlay */}
      {selectedCall && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '2rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            margin: 0,
            background: 'var(--bg-app)',
            borderColor: 'var(--border-focus)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h3 className="list-item-title" style={{ margin: 0 }}>Call Transcript</h3>
                <span className="list-item-subtitle" style={{ fontSize: '0.75rem' }}>{selectedCall.number} • {selectedCall.time}</span>
              </div>
              <button 
                onClick={() => setSelectedCall(null)} 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', height: 'auto', borderRadius: '4px' }}
              >
                Close
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px', paddingBottom: '1rem' }}>
              {selectedCall.transcript.map((bubble, i) => (
                <div 
                  key={i} 
                  className={`phone-bubble ${bubble.sender === 'agent' ? 'agent' : 'user'}`}
                  style={{ fontSize: '0.8rem', maxWidth: '85%' }}
                >
                  <div style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '2px', fontWeight: 'bold' }}>
                    {bubble.sender === 'agent' ? 'IKEA Sofia' : 'Customer'}
                  </div>
                  {bubble.text}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span><strong>Topic:</strong> {selectedCall.topic}</span>
              <span><strong>CSAT Rating:</strong> <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>{selectedCall.csat}</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export { INITIAL_CALLS_LOG };
