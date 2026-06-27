import React, { useState, useEffect } from 'react';
import { Database, ShoppingBag, MapPin, HelpCircle, Edit2, Check, ArrowRight } from 'lucide-react';

const DEFAULT_STORES = [
  { id: 'dfc', name: 'Dubai Festival City', emirate: 'Dubai', hours: 'Mon–Thu: 10:00 AM – 11:00 PM, Fri–Sun: 10:00 AM – 12:00 AM', location: 'Dubai Festival City Mall, Dubai' },
  { id: 'fp', name: 'Jebel Ali (Festival Plaza)', emirate: 'Dubai', hours: 'Mon–Wed: 10:00 AM – 11:00 PM, Thu–Sat: 10:00 AM – 12:00 AM, Sun: 10:00 AM – 11:00 PM', location: 'Festival Plaza, Jebel Ali, Dubai' },
  { id: 'yas', name: 'Yas Island Abu Dhabi', emirate: 'Abu Dhabi', hours: 'Sun–Thu: 10:00 AM – 11:00 PM, Fri–Sat: 10:00 AM – 12:00 AM', location: 'Yas Mall, Yas Island, Abu Dhabi' },
  { id: 'wah', name: 'Al Wahda Mall', emirate: 'Abu Dhabi', hours: 'Mon–Sun: 10:00 AM – 10:00 PM', location: 'Al Wahda Mall, Abu Dhabi' },
  { id: 'ain', name: 'Al Jimi Mall (Al Ain)', emirate: 'Al Ain', hours: 'Mon–Sun: 9:00 AM – 12:00 AM', location: 'Al Jimi Mall, Al Ain' },
  { id: 'rak', name: 'Ras Al Khaimah', emirate: 'Ras Al Khaimah', hours: 'Mon–Thu: 10:00 AM – 10:00 PM, Fri–Sun: 10:00 AM – 12:00 AM', location: 'Al Hamra Mall, Ras Al Khaimah' },
];

const DEFAULT_CATALOG = [
  { id: 'billy', name: 'BILLY Bookcase', price: '275 AED', article: '002.638.50', size: '80x28x202 cm', color: 'White', stock: { dfc: 45, fp: 12, yas: 28, wah: 8, ain: 15, rak: 19 } },
  { id: 'malm', name: 'MALM Chest of 4 drawers', price: '395 AED', article: '304.035.71', size: '80x100 cm', color: 'White', stock: { dfc: 0, fp: 14, yas: 0, wah: 3, ain: 5, rak: 5 } },
  { id: 'kallax', name: 'KALLAX Shelving unit', price: '395 AED', article: '104.099.32', size: '112x147 cm', color: 'White', stock: { dfc: 35, fp: 18, yas: 22, wah: 6, ain: 12, rak: 15 } },
  { id: 'poang', name: 'POÄNG Armchair', price: '395 AED', article: '192.407.88', size: '68x82x100 cm', color: 'Birch veneer/Knisa light beige', stock: { dfc: 24, fp: 31, yas: 19, wah: 10, ain: 14, rak: 10 } },
  { id: 'hemnes', name: 'HEMNES Day-bed frame', price: '1295 AED', article: '903.493.26', size: '80x200 cm', color: 'White', stock: { dfc: 8, fp: 5, yas: 12, wah: 2, ain: 4, rak: 3 } },
  { id: 'lack', name: 'LACK Side table', price: '39 AED', article: '304.499.08', size: '55x55 cm', color: 'White', stock: { dfc: 120, fp: 95, yas: 110, wah: 45, ain: 60, rak: 75 } },
  { id: 'gladom', name: 'GLADOM Tray table', price: '79 AED', article: '504.119.90', size: '45x53 cm', color: 'Dark grey', stock: { dfc: 65, fp: 40, yas: 50, wah: 22, ain: 30, rak: 35 } },
  { id: 'frakta', name: 'FRAKTA Carrier bag', price: '5 AED', article: '172.283.40', size: '71 l (large)', color: 'Blue', stock: { dfc: 850, fp: 620, yas: 730, wah: 310, ain: 420, rak: 500 } },
];

const DEFAULT_FAQS = [
  { id: 'del_acc', category: 'Delivery', question: 'What are the delivery fees for accessories in UAE?', answer: 'Home accessories delivery starts from AED 10, with free delivery on orders above AED 250.' },
  { id: 'del_fur', category: 'Delivery', question: 'What are the delivery fees for furniture in UAE?', answer: 'Furniture home delivery starts from AED 45, with free delivery on orders above AED 950.' },
  { id: 'ass_fees', category: 'Assembly', question: 'How much does furniture assembly cost?', answer: 'Assembly services start from AED 99. Combined delivery & assembly bundles are AED 144 for orders below AED 950, and AED 99 for orders above AED 950. Express delivery & assembly starts from AED 350.' },
  { id: 'ret_pol', category: 'Returns', question: 'What is the return and refund policy for UAE?', answer: 'Standard returns of unopened items in original packaging are accepted within 90 days of purchase with receipt. IKEA Family members enjoy an extended return period of up to 120 days.' },
  { id: 'click_coll', category: 'Click & Collect', question: 'How much does Click & Collect cost?', answer: 'Click & Collect is 100% Free. You can order online and pick up your items at any IKEA store or designated collection point.' },
  { id: 'fam_loy', category: 'IKEA Family', question: 'What is the IKEA Family program and its benefits?', answer: 'IKEA Family is free to join. Members receive exclusive discounts, an extended 120-day return window, and complimentary hot drinks (coffee or tea) at the IKEA restaurant.' },
  { id: 'contact_us', category: 'Customer Service', question: 'How can I contact customer support?', answer: 'You can contact customer service toll-free at 800-IKEA (800-4532), or via email at customer.service@ikea.ae.' },
];

export default function KnowledgeBase() {
  const [subTab, setSubTab] = useState('catalog'); // catalog, stores, faqs
  const [stores, setStores] = useState(JSON.parse(localStorage.getItem('ikea_kb_stores')) || DEFAULT_STORES);
  const [catalog, setCatalog] = useState(JSON.parse(localStorage.getItem('ikea_kb_catalog')) || DEFAULT_CATALOG);
  const [faqs, setFaqs] = useState(JSON.parse(localStorage.getItem('ikea_kb_faqs')) || DEFAULT_FAQS);
  const [editId, setEditId] = useState(null);
  
  // Catalog editing form state
  const [editPrice, setEditPrice] = useState('');
  
  useEffect(() => {
    const storedStores = localStorage.getItem('ikea_kb_stores');
    if (!storedStores || !storedStores.includes('Al Wahda Mall')) {
      localStorage.setItem('ikea_kb_stores', JSON.stringify(DEFAULT_STORES));
      localStorage.setItem('ikea_kb_catalog', JSON.stringify(DEFAULT_CATALOG));
      localStorage.setItem('ikea_kb_faqs', JSON.stringify(DEFAULT_FAQS));
      setStores(DEFAULT_STORES);
      setCatalog(DEFAULT_CATALOG);
      setFaqs(DEFAULT_FAQS);
    }
  }, []);

  const saveCatalogEdit = (id) => {
    const updated = catalog.map(item => {
      if (item.id === id) {
        return { ...item, price: editPrice };
      }
      return item;
    });
    setCatalog(updated);
    localStorage.setItem('ikea_kb_catalog', JSON.stringify(updated));
    setEditId(null);
  };

  const getStockPill = (stockQty) => {
    if (stockQty > 20) return <span className="stock-pill in-stock">{stockQty} in stock</span>;
    if (stockQty > 0) return <span className="stock-pill low-stock">{stockQty} low stock</span>;
    return <span className="stock-pill out-of-stock">Out of stock</span>;
  };

  return (
    <div className="tab-content-container">
      <h2 className="section-title">
        <Database size={20} className="text-accent" />
        Customer Support Knowledge Base
      </h2>
      <p className="section-description">
        Manage the database of product stock, store locations, opening hours, and policies used by the AI Voice Agent to answer questions.
      </p>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setSubTab('catalog')} 
          className={`tab-btn ${subTab === 'catalog' ? 'active' : ''}`}
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
        >
          <ShoppingBag size={16} /> Catalog & Stock
        </button>
        <button 
          onClick={() => setSubTab('stores')} 
          className={`tab-btn ${subTab === 'stores' ? 'active' : ''}`}
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
        >
          <MapPin size={16} /> Stores & Hours
        </button>
        <button 
          onClick={() => setSubTab('faqs')} 
          className={`tab-btn ${subTab === 'faqs' ? 'active' : ''}`}
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
        >
          <HelpCircle size={16} /> Service FAQs
        </button>
      </div>

      {/* Product Catalog Tab */}
      {subTab === 'catalog' && (
        <div className="list-grid">
          {catalog.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 className="list-item-title">{item.name}</h4>
                    <span className="list-item-subtitle">Article: {item.article}</span>
                  </div>
                  {editId === item.id ? (
                    <button 
                      onClick={() => saveCatalogEdit(item.id)} 
                      className="btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                    >
                      <Check size={14} className="text-success" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditId(item.id);
                        setEditPrice(item.price);
                      }} 
                      className="btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                <div style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                  <div><strong>Color:</strong> {item.color}</div>
                  <div><strong>Size:</strong> {item.size}</div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>Price: </strong> 
                    {editId === item.id ? (
                      <input 
                        type="text" 
                        value={editPrice} 
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="form-input" 
                        style={{ display: 'inline-block', width: '90px', padding: '0.15rem 0.4rem', fontSize: '0.85rem', verticalAlign: 'middle' }}
                      />
                    ) : (
                      <span className="text-accent" style={{ fontWeight: '600' }}>{item.price}</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Store Stock Levels:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem', fontSize: '0.75rem' }}>
                  {stores.map(store => (
                    <div key={store.id}>{store.name.split(' ')[0]}: {getStockPill(item.stock[store.id] || 0)}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stores Tab */}
      {subTab === 'stores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stores.map(store => (
            <div key={store.id} className="card" style={{ margin: 0, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: 'var(--ikea-blue-light)' }} />
                  IKEA {store.name} ({store.emirate})
                </h4>
                <span className="stock-pill in-stock">Open</span>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: '0.25rem' }}><strong>Operating Hours: </strong>{store.hours}</p>
                <p><strong>Address: </strong>{store.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAQs Tab */}
      {subTab === 'faqs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map(faq => (
            <div key={faq.id} className="card" style={{ margin: 0, padding: '1.25rem' }}>
              <span 
                className="stock-pill" 
                style={{ 
                  backgroundColor: 'var(--ikea-blue-soft)', 
                  color: 'var(--ikea-blue-light)', 
                  border: '1px solid rgba(0, 81, 186, 0.2)',
                  fontSize: '0.7rem',
                  marginBottom: '0.5rem'
                }}
              >
                {faq.category}
              </span>
              <h4 className="list-item-title" style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <HelpCircle size={16} style={{ color: 'var(--ikea-yellow)', flexShrink: 0, marginTop: '2px' }} />
                {faq.question}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: '1.4' }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export { DEFAULT_STORES, DEFAULT_CATALOG, DEFAULT_FAQS };
