import React, { useState, useEffect } from 'react';
import { voiceAgent } from '../services/voiceAgentService';
import { Volume2, Globe, Sparkles, User, Info } from 'lucide-react';

export default function Settings({ theme, toggleTheme }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(localStorage.getItem('ikea_voice_name') || '');
  const [agentName, setAgentName] = useState(localStorage.getItem('ikea_agent_name') || 'Sofia');
  const [savedStatus, setSavedStatus] = useState(false);
  const [langPreference, setLangPreference] = useState(localStorage.getItem('ikea_language_preference') || 'bilingual');
  const [bargeIn, setBargeIn] = useState(localStorage.getItem('ikea_barge_in') !== 'false');
  const [apiKey, setApiKey] = useState(localStorage.getItem('ikea_gemini_api_key') || '');
  const [ttsEngine, setTtsEngine] = useState(localStorage.getItem('ikea_tts_engine') || 'browser');
  const [openaiApiKey, setOpenaiApiKey] = useState(localStorage.getItem('ikea_openai_api_key') || '');
  const [openaiVoice, setOpenaiVoice] = useState(localStorage.getItem('ikea_openai_voice') || 'shimmer');
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState(localStorage.getItem('ikea_elevenlabs_api_key') || '');
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState(localStorage.getItem('ikea_elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM');

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      const availableVoices = voiceAgent.getAvailableVoices();
      setVoices(availableVoices);
      
      // Select default voice if none set
      if (!localStorage.getItem('ikea_voice_name') && availableVoices.length > 0) {
        // Prefer female Arabic first if available, otherwise fallback to English
        const arVoices = availableVoices.filter(v => v.lang.startsWith('ar'));
        const preferredArVoice = arVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes('laila') || name.includes('mariam') || name.includes('hoda') || name.includes('zeina') || name.includes('female');
        }) || arVoices.find(v => {
          const name = v.name.toLowerCase();
          return !name.includes('maged') && !name.includes('tarik') && !name.includes('tarif');
        }) || arVoices[0];

        const defVoice = preferredArVoice || 
                         availableVoices.find(v => v.lang.startsWith('en-GB')) || 
                         availableVoices.find(v => v.lang.startsWith('en-US')) || 
                         availableVoices[0];
        setSelectedVoice(defVoice.name);
        voiceAgent.setVoice(defVoice.name);
      }
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    voiceAgent.setVoice(selectedVoice);
    localStorage.setItem('ikea_agent_name', agentName);
    localStorage.setItem('ikea_language_preference', langPreference);
    localStorage.setItem('ikea_barge_in', bargeIn);
    localStorage.setItem('ikea_gemini_api_key', apiKey);
    localStorage.setItem('ikea_tts_engine', ttsEngine);
    localStorage.setItem('ikea_openai_api_key', openaiApiKey);
    localStorage.setItem('ikea_openai_voice', openaiVoice);
    localStorage.setItem('ikea_elevenlabs_api_key', elevenlabsApiKey);
    localStorage.setItem('ikea_elevenlabs_voice_id', elevenlabsVoiceId);
    voiceAgent.setApiKey(apiKey);
    
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className="tab-content-container">
      <h2 className="section-title">
        <Sparkles size={20} className="text-accent" />
        Agent Configuration & API Settings
      </h2>
      <p className="section-description">
        Configure the LLM engine settings, default voice synthesizers, and system themes.
      </p>

      <form onSubmit={handleSaveSettings}>


        <div className="card">
          <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Volume2 size={18} style={{ color: 'var(--ikea-blue-light)' }} />
            Speech & Voice Options
          </h3>

          <div className="form-group">
            <label className="form-label">Agent Representative Name</label>
            <select
              className="form-input"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            >
              <option value="Sofia">Sofia (Female Voice - Default)</option>
              <option value="Karim">Karim (Male Voice)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Language Mode</label>
            <select
              className="form-input"
              value={langPreference}
              onChange={(e) => setLangPreference(e.target.value)}
            >
              <option value="bilingual">Bilingual (English & Arabic Auto-Detect)</option>
              <option value="english">English Only</option>
              <option value="arabic">Arabic Only</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', marginBottom: '1.25rem' }}>
            <input 
              type="checkbox" 
              id="bargeIn"
              checked={bargeIn} 
              onChange={(e) => setBargeIn(e.target.checked)} 
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--ikea-blue)' }}
            />
            <label htmlFor="bargeIn" className="form-label" style={{ margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600' }}>Enable Voice Barge-in (Interruption)</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                Allows you to speak and interrupt the agent in real time while they are talking.
              </span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Synthesizer Voice (SpeechSynthesis)</label>
            <select
              className="form-input"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              {voices.length === 0 ? (
                <option value="">No English/Arabic voices found on this browser</option>
              ) : (
                voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang}) {voice.localService ? '[Local]' : ''}
                  </option>
                ))
              )}
            </select>
            <p className="form-label" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              The application filters available voices to English and Arabic to sound appropriate for IKEA UAE.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Volume2 size={18} style={{ color: 'var(--ikea-blue-light)' }} />
            Vocal Synthesizer Engine (Text-to-Speech)
          </h3>
          <p className="form-label" style={{ fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Choose between standard local browser text-to-speech or premium human-like AI voice APIs.
          </p>

          <div className="form-group">
            <label className="form-label">TTS Engine</label>
            <select
              className="form-input"
              value={ttsEngine}
              onChange={(e) => setTtsEngine(e.target.value)}
            >
              <option value="browser">Local Browser SpeechSynthesis (Default)</option>
              <option value="openai">OpenAI TTS API (Highly Realistic Human-like)</option>
              <option value="elevenlabs">ElevenLabs TTS API (Ultra Realistic / Emotional)</option>
            </select>
          </div>

          {ttsEngine === 'openai' && (
            <div style={{ marginTop: '1rem', borderLeft: '3px solid var(--ikea-blue)', paddingLeft: '1rem' }}>
              <div className="form-group">
                <label className="form-label">OpenAI API Key</label>
                <input
                  type="password"
                  className="form-input"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  style={{ letterSpacing: openaiApiKey ? '0.2rem' : 'normal' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">OpenAI Voice Name</label>
                <select
                  className="form-input"
                  value={openaiVoice}
                  onChange={(e) => setOpenaiVoice(e.target.value)}
                >
                  <option value="shimmer">Shimmer (Female - Friendly & Conversational)</option>
                  <option value="nova">Nova (Female - Energetic & Clear)</option>
                  <option value="alloy">Alloy (Neutral - Professional)</option>
                  <option value="echo">Echo (Male - Calm)</option>
                  <option value="fable">Fable (Neutral - Narrative)</option>
                  <option value="onyx">Onyx (Male - Deep & Warm)</option>
                </select>
              </div>
            </div>
          )}

          {ttsEngine === 'elevenlabs' && (
            <div style={{ marginTop: '1rem', borderLeft: '3px solid var(--ikea-yellow)', paddingLeft: '1rem' }}>
              <div className="form-group">
                <label className="form-label">ElevenLabs API Key</label>
                <input
                  type="password"
                  className="form-input"
                  value={elevenlabsApiKey}
                  onChange={(e) => setElevenlabsApiKey(e.target.value)}
                  placeholder="Paste ElevenLabs key..."
                  style={{ letterSpacing: elevenlabsApiKey ? '0.2rem' : 'normal' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ElevenLabs Voice ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={elevenlabsVoiceId}
                  onChange={(e) => setElevenlabsVoiceId(e.target.value)}
                  placeholder="21m00Tcm4TlvDq8ikWAM"
                />
                <p className="form-label" style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                  Default is <code>21m00Tcm4TlvDq8ikWAM</code> (Rachel). You can use any multilingual-compatible ElevenLabs Voice ID (custom or pre-made).
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={18} style={{ color: 'var(--ikea-yellow)' }} />
            Gemini Live AI Configuration
          </h3>
          
          <div className="form-group">
            <label className="form-label">Gemini API Key</label>
            <input
              type="password"
              className="form-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API Key here (starts with AIza...)"
              style={{ letterSpacing: apiKey ? '0.2rem' : 'normal' }}
            />
            <p className="form-label" style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
              To enable live AI customer support responses, enter a valid Google Gemini API Key. Leave empty to run the simulator in rule-based NLP local mode.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Globe size={18} style={{ color: 'var(--ikea-blue-light)' }} />
            Environment Preferences
          </h3>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="form-label" style={{ margin: 0 }}>Dark Mode Dashboard</span>
              <p className="form-label" style={{ fontSize: '0.75rem', margin: 0 }}>Toggle between dark theme and light theme.</p>
            </div>
            <div className="toggle-container" onClick={toggleTheme}>
              <div className={`toggle-track ${theme === 'dark' ? 'active' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-accent">
            Save Configurations
          </button>
        </div>

        {savedStatus && (
          <div className="stock-pill in-stock" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}>
            All settings saved successfully! The voice agent is updated.
          </div>
        )}
      </form>
    </div>
  );
}
