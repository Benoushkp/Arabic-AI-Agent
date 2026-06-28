import React, { useState, useEffect } from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import Analytics from './components/Analytics';
import KnowledgeBase from './components/KnowledgeBase';
import PromptEditor from './components/PromptEditor';
import Settings from './components/Settings';
import CrmPanel from './components/CrmPanel';
import { BarChart3, Database, UserCheck, Settings as SettingsIcon, Sun, Moon, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, knowledge, prompt, settings, crm
  const [theme, setTheme] = useState(localStorage.getItem('ikea_theme') || 'dark');
  const [callHistory, setCallHistory] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ikea_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Prompt migration check: Upgrade stored system prompt to disable repeated greetings
    const storedPrompt = localStorage.getItem('ikea_system_prompt');
    if (storedPrompt && storedPrompt.includes("Always begin every new conversation by greeting")) {
      const targetStr = `5. Always begin every new conversation by greeting in both languages exactly as follows:\n   "Hello! Welcome to IKEA UAE. مرحباً! أهلاً بك في ايكيا الإمارات. How may I help you today?"`;
      const replacementStr = `5. Greet the customer ONLY in the initial welcome message. In all subsequent responses during the call, do NOT repeat the starting welcome greeting (such as "Welcome to IKEA UAE" or "How may I help you today"). Instead, answer their questions directly and conversationally.`;
      
      let updatedPrompt = storedPrompt.replace(targetStr, replacementStr);
      if (updatedPrompt === storedPrompt) {
        updatedPrompt = storedPrompt.replace(
          /5\.\s*Always\s*begin\s*every\s*new\s*conversation\s*by\s*greeting[\s\S]*?help\s*you\s*today\?\"/i,
          `5. Greet the customer ONLY in the initial welcome message. In all subsequent responses during the call, do NOT repeat the starting welcome greeting (such as "Welcome to IKEA UAE" or "How may I help you today"). Instead, answer their questions directly and conversationally.`
        );
      }
      localStorage.setItem('ikea_system_prompt', updatedPrompt);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleCallFinished = (newCallLog) => {
    // Generate a unique id
    const callWithId = {
      id: `c_${Date.now()}`,
      number: newCallLog.number,
      time: newCallLog.time,
      duration: newCallLog.duration,
      // Map topic loosely from transcript keywords
      topic: analyzeTopic(newCallLog.transcript),
      status: 'Resolved',
      csat: '5/5', // Simulated CSAT
      transcript: newCallLog.transcript.map(t => ({
        sender: t.sender,
        text: t.text
      }))
    };

    // Prepend to history
    setCallHistory(prev => [callWithId, ...prev]);
  };

  // Helper to detect main topic from dialogue
  const analyzeTopic = (transcript) => {
    const text = transcript.map(t => t.text.toLowerCase()).join(' ');
    if (text.includes('order') || text.includes('track') || text.includes('delivery')) return 'Order Tracking';
    if (text.includes('stock') || text.includes('billy') || text.includes('malm') || text.includes('kallax')) return 'Stock Check';
    if (text.includes('return') || text.includes('refund') || text.includes('exchange')) return 'Refund Inquiry';
    if (text.includes('delivery fee') || text.includes('assembly') || text.includes('cost')) return 'Service Rates';
    return 'General Inquiry';
  };

  return (
    <div className="app-container">
      {/* Left Panel - Phone Call Simulator */}
      <PhoneSimulator onCallFinished={handleCallFinished} />

      {/* Right Panel - Agent Management Dashboard */}
      <main className="dashboard-panel">
        
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-title-area">
            <span className="logo-badge">IKEA</span>
            <h1 className="dashboard-title">UAE Customer Support Voice Console</h1>
          </div>

          <button onClick={toggleTheme} className="theme-switch" title="Toggle Light/Dark Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Tab Buttons Navigation */}
        <nav className="dashboard-tabs">
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <BarChart3 size={16} /> Analytics & Logs
          </button>
          
          <button 
            onClick={() => setActiveTab('knowledge')} 
            className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
          >
            <Database size={16} /> Knowledge Base
          </button>

          <button 
            onClick={() => setActiveTab('crm')} 
            className={`tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
          >
            <ShieldAlert size={16} /> Live CRM & Actions
          </button>
          
          <button 
            onClick={() => setActiveTab('prompt')} 
            className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
          >
            <UserCheck size={16} /> System Prompt
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <SettingsIcon size={16} /> API & Voice Settings
          </button>
        </nav>

        {/* Tab Content Display */}
        <div className="dashboard-content">
          {activeTab === 'analytics' && <Analytics customCallHistory={callHistory} />}
          {activeTab === 'knowledge' && <KnowledgeBase />}
          {activeTab === 'crm' && <CrmPanel />}
          {activeTab === 'prompt' && <PromptEditor />}
          {activeTab === 'settings' && <Settings theme={theme} toggleTheme={toggleTheme} />}
        </div>

      </main>
    </div>
  );
}
export { App };
