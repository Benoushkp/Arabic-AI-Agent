import React, { useState, useEffect } from 'react';
import { User, MapPin, Calendar, CheckSquare, Package, AlertCircle } from 'lucide-react';

export default function CrmPanel() {
  const [crm, setCrm] = useState({
    customerName: "Fatima Al Maktoum",
    phone: "+971 50 123 4567",
    familyId: "991209384",
    orderNumber: "984029103",
    items: "PAX Wardrobe system (x1), MALM Dresser (x1), LACK Table (x2)",
    address: "Flat 402, Al Wahda Street, Dubai, UAE",
    deliveryDate: "Next Tuesday, July 2",
    assemblyService: "Included (AED 144 Package)",
    status: "In Transit"
  });

  const [highlightField, setHighlightField] = useState(null);

  useEffect(() => {
    const handleCrmUpdate = (e) => {
      const details = e.detail;
      setCrm(prev => {
        const updated = { ...prev, ...details };
        // Determine which field changed for visual highlight
        if (details.address) {
          triggerHighlight('address');
        } else if (details.status) {
          triggerHighlight('status');
        } else if (details.deliveryDate) {
          triggerHighlight('deliveryDate');
        }
        return updated;
      });
    };

    window.addEventListener('ikea_update_crm', handleCrmUpdate);
    return () => {
      window.removeEventListener('ikea_update_crm', handleCrmUpdate);
    };
  }, []);

  const triggerHighlight = (fieldName) => {
    setHighlightField(fieldName);
    setTimeout(() => setHighlightField(null), 3000);
  };

  const getStatusColor = (status) => {
    if (status === 'Cancelled') return 'var(--status-error)';
    if (status.includes('Rescheduled') || status.includes('July 5')) return 'var(--ikea-yellow)';
    return 'var(--status-success)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Overview Card */}
      <div className="card">
        <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <User size={18} style={{ color: 'var(--ikea-blue-light)' }} />
          Customer Profile (IKEA Family CRM)
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Name</span>
            <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{crm.customerName}</div>
          </div>
          <div>
            <span className="form-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</span>
            <div style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{crm.phone}</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span className="form-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IKEA Family Membership</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span className="status-badge active" style={{ fontSize: '0.7rem' }}>Active Member</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: {crm.familyId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Order Card */}
      <div className="card" style={{ border: highlightField ? '1px solid var(--text-accent)' : '1px solid var(--border-color)', transition: 'border 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Package size={18} style={{ color: 'var(--ikea-blue-light)' }} />
            Active Order Details
          </h3>
          <span 
            className="status-badge" 
            style={{ 
              backgroundColor: getStatusColor(crm.status) + '15', 
              color: getStatusColor(crm.status),
              border: `1px solid ${getStatusColor(crm.status)}30`,
              animation: highlightField === 'status' ? 'pulse 1s infinite' : 'none'
            }}
          >
            {crm.status}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <span className="form-label">Order Number</span>
            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>#{crm.orderNumber}</span>
          </div>

          <div>
            <span className="form-label">Ordered Items</span>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {crm.items}
            </p>
          </div>

          <div style={{ 
            backgroundColor: highlightField === 'address' ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
            padding: highlightField === 'address' ? '0.5rem' : '0',
            borderRadius: '4px',
            transition: 'background-color 0.5s ease'
          }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} /> Shipping Address
            </span>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '500' }}>
              {crm.address}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
            <div style={{ 
              backgroundColor: highlightField === 'deliveryDate' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
              padding: highlightField === 'deliveryDate' ? '0.5rem' : '0',
              borderRadius: '4px',
              transition: 'background-color 0.5s ease'
            }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} /> Delivery Date
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '500', display: 'block', marginTop: '0.2rem' }}>
                {crm.deliveryDate}
              </span>
            </div>
            
            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckSquare size={14} /> Assembly
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '500', display: 'block', marginTop: '0.2rem' }}>
                {crm.assemblyService}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Guide Banner */}
      <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <AlertCircle size={18} style={{ color: 'var(--ikea-blue-light)', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          <strong>Interactive Demo</strong>: Ask the voice assistant to <em>"change my delivery address to Abu Dhabi"</em>, <em>"cancel my order"</em>, or <em>"reschedule delivery"</em>. The agent will execute the tool call and update this panel in real-time.
        </p>
      </div>

    </div>
  );
}
