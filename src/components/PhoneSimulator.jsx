import React, { useState, useEffect, useRef } from 'react';
import { voiceAgent } from '../services/voiceAgentService';
import { phoneAudio } from '../services/phoneAudioService';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, RefreshCw, Send, HelpCircle } from 'lucide-react';

export default function PhoneSimulator({ onCallFinished }) {
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected
  const [phoneNumber, setPhoneNumber] = useState('800-IKEA');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [transcript, setTranscript] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const animationRef = useRef(null);

  const callStateRef = useRef(callState);
  const isMutedRef = useRef(isMuted);
  const prevCallStateRef = useRef(callState);

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    if (callState === 'calling' || callState === 'ringing') {
      phoneAudio.startRingbackTone();
    } else if (callState === 'connected') {
      phoneAudio.stopRingbackTone();
      phoneAudio.playConnectionTone();
      phoneAudio.startComfortNoise();
    } else if (callState === 'idle') {
      phoneAudio.stopRingbackTone();
      phoneAudio.stopComfortNoise();
      if (prevCallStateRef.current !== 'idle') {
        phoneAudio.playDisconnectTone();
      }
    }
    prevCallStateRef.current = callState;
  }, [callState]);

  // Quick Scenarios for testing
  const scenarios = [
    { label: "Hej! (Greet)", text: "Hello, Hej! Can you help me today?" },
    { label: "Track Order", text: "Track my order 429 801 324" },
    { label: "Check Stock", text: "Do you have the BILLY bookcase in stock?" },
    { label: "Return Policy", text: "What is your refund policy for opened items?" },
    { label: "Exchange Item", text: "Can I exchange my bookcase for a different size?" },
    { label: "Delivery Rates", text: "How much does home delivery cost in UAE?" },
    { label: "Assembly Cost", text: "What is the price of assembly for a wardrobe?" },
    { label: "Store Hours", text: "What are the opening hours of Dubai Festival City store?" },
    { label: "File Complaint", text: "I want to lodge a complaint about a late delivery." },
    { label: "IKEA Family", text: "Can you explain the IKEA Family membership program?" }
  ];

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Duration Timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // Waveform Visualizer Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const drawWave = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      // Select wave characteristics based on speaking state
      let numWaves = 3;
      let amplitude = 2; // idle baseline
      let frequency = 0.04;
      let speed = 0.08;

      if (isThinking) {
        amplitude = 5;
        frequency = 0.08;
        speed = 0.12;
      } else if (agentSpeaking) {
        amplitude = 18;
        frequency = 0.06;
        speed = 0.15;
      } else if (userSpeaking) {
        // Gentle ripple to show active listening state
        amplitude = 6;
        frequency = 0.04;
        speed = 0.08;
      } else if (callState === 'ringing') {
        amplitude = 8;
        frequency = 0.03;
        speed = 0.05;
      }

      ctx.lineWidth = 2;

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        const waveOffset = i * (Math.PI / 4);
        
        // Multi-color waves with transparency
        if (i === 0) {
          ctx.strokeStyle = agentSpeaking ? 'rgba(0, 81, 186, 0.8)' : 'rgba(255, 218, 26, 0.8)'; // IKEA Blue or IKEA Yellow
        } else if (i === 1) {
          ctx.strokeStyle = agentSpeaking ? 'rgba(30, 111, 217, 0.4)' : 'rgba(255, 255, 255, 0.3)';
        } else {
          ctx.strokeStyle = 'rgba(0, 81, 186, 0.2)';
        }

        for (let x = 0; x < width; x++) {
          // Sine wave formula: y = sin(x * freq + phase) * amp
          const y = centerY + Math.sin(x * frequency + phase + waveOffset) * amplitude * Math.sin(x * Math.PI / width);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += speed;
      animationRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => cancelAnimationFrame(animationRef.current);
  }, [agentSpeaking, userSpeaking, callState]);

  // Format Duration timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Dial a digit
  const pressDigit = (digit) => {
    if (callState === 'idle') {
      // Limit size
      if (phoneNumber.length < 15) {
        setPhoneNumber(prev => prev === '800-IKEA' ? digit : prev + digit);
      }
    }
  };

  // Start Call Sequence
  const startCall = () => {
    if (callState !== 'idle') return;
    
    setCallState('calling');
    setTranscript([]);
    voiceAgent.resetHistory();

    // 1. Simulate Connection ringing
    setTimeout(() => {
      setCallState('ringing');
      
      // Ring sound simulation or delay
      setTimeout(() => {
        setCallState('connected');
        
        // Trigger initial Agent greeting
        agentReply("hello");
      }, 1500);

    }, 1000);
  };

  // End Call Sequence
  const endCall = () => {
    voiceAgent.stopSpeaking();
    voiceAgent.stopListening();
    voiceAgent.resetHistory();
    setCallState('idle');
    setAgentSpeaking(false);
    setUserSpeaking(false);
    
    // Save call log to analytics
    if (transcript.length > 0) {
      onCallFinished({
        number: phoneNumber === '800-IKEA' ? '+971 800 4532' : phoneNumber,
        duration: formatTime(callDuration),
        transcript: transcript,
        time: 'Just now'
      });
    }
  };

  // Handle Voice Agent Audio Output
  const agentReply = async (customText = null) => {
    setAgentSpeaking(true);
    setUserSpeaking(false);
    voiceAgent.stopListening();
    
    // Get custom configured Prompt and Knowledge Base
    const systemPrompt = localStorage.getItem('ikea_system_prompt') || '';
    const kbStores = JSON.parse(localStorage.getItem('ikea_kb_stores')) || [];
    const kbCatalog = JSON.parse(localStorage.getItem('ikea_kb_catalog')) || [];
    const kbFaqs = JSON.parse(localStorage.getItem('ikea_kb_faqs')) || [];
    
    const kbData = { stores: kbStores, catalog: kbCatalog, faqs: kbFaqs };
    const agentName = localStorage.getItem('ikea_agent_name') || 'Sofia';

    let replyText = "";

    if (customText === "hello") {
      const langPref = localStorage.getItem('ikea_language_preference') || 'bilingual';
      if (langPref === 'english') {
        replyText = "Hello! Welcome to IKEA UAE. How may I help you today?";
      } else if (langPref === 'arabic') {
        replyText = "يا هلا بك في ايكيا الإمارات، شلون أقدر أساعدك اليوم؟";
      } else {
        replyText = "Hello! Welcome to IKEA UAE. يا هلا بك في ايكيا الإمارات، شلون أقدر أساعدك اليوم؟";
      }
    } else {
      setIsThinking(true);
      try {
        // Ask service for response (simulated or Gemini AI)
        replyText = await voiceAgent.getResponse(customText, systemPrompt, kbData, transcript);
      } catch (err) {
        console.error("Error fetching reply:", err);
        replyText = "I'm sorry, I encountered an issue. Let me confirm that for you.";
      } finally {
        setIsThinking(false);
      }
    }

    // Append to transcript
    setTranscript(prev => [...prev, { sender: 'agent', text: replyText }]);

    // Play text-to-speech
    if (isSpeakerOn) {
      voiceAgent.speak(
        replyText,
        () => {
          setAgentSpeaking(true);
          // If barge-in is enabled, start listening as soon as speaking begins
          const bargeIn = localStorage.getItem('ikea_barge_in') !== 'false';
          if (bargeIn && !isMutedRef.current && callStateRef.current === 'connected') {
            listenToUser();
          }
        }, // onStart
        () => {
          setAgentSpeaking(false);
          // If barge-in is disabled, restart listening now that agent has finished speaking
          const bargeIn = localStorage.getItem('ikea_barge_in') !== 'false';
          if (!bargeIn && !isMutedRef.current && callStateRef.current === 'connected') {
            listenToUser();
          }
        }, // onEnd
        () => {
          // Boundary callback to simulate speech vibration amplitude spikes
          setAgentSpeaking(true);
        }
      );
    } else {
      voiceAgent.isThinking = false;
      setTimeout(() => {
        setAgentSpeaking(false);
        if (!isMutedRef.current && callStateRef.current === 'connected') {
          listenToUser();
        }
      }, 2000);
    }
  };

  // Speech-to-Text Listener
  const listenToUser = () => {
    const bargeIn = localStorage.getItem('ikea_barge_in') !== 'false';
    if (
      callStateRef.current !== 'connected' || 
      (!bargeIn && voiceAgent.isSpeaking) || 
      voiceAgent.isThinking || 
      isMutedRef.current
    ) return;
    
    setUserSpeaking(true);
    voiceAgent.startListening(
      (speechText) => {
        // Discard recognized speech if we are already thinking
        if (
          voiceAgent.isThinking || 
          callStateRef.current !== 'connected'
        ) {
          console.log("Ignored microphone speech input during thinking cycle:", speechText);
          setUserSpeaking(false);
          return;
        }

        // Handle voice barge-in interruption
        if (voiceAgent.isSpeaking) {
          console.log("User interrupted agent speaking with:", speechText);
          voiceAgent.stopSpeaking();
          setAgentSpeaking(false);
        }

        // Speech recognized
        setUserSpeaking(false);
        setTranscript(prev => [...prev, { sender: 'user', text: speechText }]);
        // Feed text to agent response
        agentReply(speechText);
      },
      (error) => {
        // Speech recognition error or silence
        setUserSpeaking(false);
        console.warn("STT error/no speech detected:", error);
        
        // Auto-restart listening if call is still active
        setTimeout(() => {
          const bargeIn = localStorage.getItem('ikea_barge_in') !== 'false';
          const shouldListen = callStateRef.current === 'connected' && 
                               (!voiceAgent.isSpeaking || bargeIn) && 
                               !voiceAgent.isThinking && 
                               !isMutedRef.current && 
                               !voiceAgent.isListening;
          if (shouldListen) {
            listenToUser();
          }
        }, 300);
      },
      () => {
        // Finished listening session
        setUserSpeaking(false);
        
        // Auto-restart listening on clean close
        setTimeout(() => {
          const bargeIn = localStorage.getItem('ikea_barge_in') !== 'false';
          const currentAgentSpeaking = voiceAgent.activeUtterance !== null || voiceAgent.isSpeaking;
          const shouldListen = callStateRef.current === 'connected' && 
                               (!currentAgentSpeaking || bargeIn) && 
                               !voiceAgent.isThinking && 
                               !isMutedRef.current && 
                               !voiceAgent.isListening;
          if (shouldListen) {
            listenToUser();
          }
        }, 400);
      }
    );
  };

  // Submit Text Input manually (Keyboard option or scenario button click)
  const submitText = (e) => {
    e.preventDefault();
    if (!userInput.trim() || callState !== 'connected') return;

    voiceAgent.stopSpeaking();
    voiceAgent.stopListening();
    
    const textToSend = userInput;
    setUserInput('');
    setTranscript(prev => [...prev, { sender: 'user', text: textToSend }]);
    
    agentReply(textToSend);
  };

  // Scenario hotkey click
  const triggerScenario = (scenarioText) => {
    if (callState !== 'connected') {
      // Auto-start call first
      setCallState('calling');
      setTranscript([]);
      setTimeout(() => {
        setCallState('ringing');
        setTimeout(() => {
          setCallState('connected');
          // Add greeting, then send scenario
          const langPref = localStorage.getItem('ikea_language_preference') || 'bilingual';
          let welcomeGreeting = 'Hello! Welcome to IKEA UAE. يا هلا بك في ايكيا الإمارات، شلون أقدر أساعدك اليوم؟';
          if (langPref === 'english') {
            welcomeGreeting = 'Hello! Welcome to IKEA UAE. How may I help you today?';
          } else if (langPref === 'arabic') {
            welcomeGreeting = 'يا هلا بك في ايكيا الإمارات، شلون أقدر أساعدك اليوم؟';
          }
          setTranscript([{ sender: 'agent', text: welcomeGreeting }]);
          setTimeout(() => {
            setTranscript(prev => [...prev, { sender: 'user', text: scenarioText }]);
            agentReply(scenarioText);
          }, 1500);
        }, 1200);
      }, 800);
    } else {
      voiceAgent.stopSpeaking();
      voiceAgent.stopListening();
      setTranscript(prev => [...prev, { sender: 'user', text: scenarioText }]);
      agentReply(scenarioText);
    }
  };

  return (
    <div className="phone-panel">
      <div className="phone-header">
        <span className="logo-badge">IKEA</span>
        <h2 className="dashboard-title" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>AI Support Helpline</h2>
        <span className="form-label" style={{ fontSize: '0.7rem', margin: 0 }}>Dubai • Abu Dhabi • Sharjah</span>
      </div>

      {/* Smartphone mockup */}
      <div className="ikea-handset-container">
        <div className="phone-notch" />
        <div className="phone-screen">
          
          {/* Active Call UI */}
          {callState !== 'idle' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Call Status Head */}
              <div className="call-status-box">
                <div className={`agent-avatar ${callState === 'ringing' ? 'ringing' : ''} ${agentSpeaking ? 'talking' : ''}`}>
                  {localStorage.getItem('ikea_agent_name')?.slice(0,1) || 'S'}
                </div>
                <div className="phone-number-display">{phoneNumber}</div>
                <div className="call-state-text">
                  {callState === 'calling' && 'Connecting...'}
                  {callState === 'ringing' && 'Ringing...'}
                  {callState === 'connected' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.72rem', height: '1.2rem' }}>
                      {isMuted ? (
                        <span style={{ color: 'var(--status-error)' }}>Muted</span>
                      ) : isThinking ? (
                        <span className="pulse-text" style={{ color: 'var(--ikea-yellow)', fontWeight: '500' }}>{localStorage.getItem('ikea_agent_name') || 'Sofia'} is thinking...</span>
                      ) : agentSpeaking ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#60a5fa', fontWeight: '500' }}>
                          {localStorage.getItem('ikea_barge_in') !== 'false' && userSpeaking && <span className="listening-dot" />}
                          {localStorage.getItem('ikea_agent_name') || 'Sofia'} is speaking...
                        </span>
                      ) : userSpeaking ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#34d399', fontWeight: '500' }}>
                          <span className="listening-dot" /> Listening...
                        </span>
                      ) : (
                        <span>Connected</span>
                      )}
                    </div>
                  )}
                </div>
                {callState === 'connected' && (
                  <div className="call-timer">{formatTime(callDuration)}</div>
                )}
              </div>

              {/* Scrolling transcript screen */}
              <div className="phone-transcript-area">
                {transcript.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center', padding: '0 1rem' }}>
                    {callState === 'connected' ? 'Initializing sound connection...' : 'Calling UAE support lines...'}
                  </div>
                ) : (
                  transcript.map((msg, idx) => (
                    <div key={idx} className={`phone-bubble ${msg.sender === 'agent' ? 'agent' : 'user'}`}>
                      {msg.text}
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Waveform Visualizer */}
              <div className="waveform-container">
                <canvas ref={canvasRef} className="waveform-canvas" width="200" height="60" />
              </div>

              {/* Call Control Center */}
              <div style={{ marginTop: 'auto' }}>
                <div className="call-controls-row">
                  <button 
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (!isMuted) voiceAgent.stopListening();
                    }} 
                    className={`control-icon-btn ${isMuted ? 'active' : ''}`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  
                  <button 
                    onClick={endCall} 
                    className="call-action-btn end"
                    title="End Call"
                  >
                    <PhoneOff size={20} />
                  </button>
                  
                  <button 
                    onClick={() => {
                      setIsSpeakerOn(!isSpeakerOn);
                      if (isSpeakerOn) voiceAgent.stopSpeaking();
                    }} 
                    className={`control-icon-btn ${!isSpeakerOn ? 'active' : ''}`}
                    title={isSpeakerOn ? "Turn off Speaker" : "Turn on Speaker"}
                  >
                    {isSpeakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>

                {/* Optional manual text input for developer testing */}
                {callState === 'connected' && (
                  <form onSubmit={submitText} style={{ display: 'flex', gap: '0.25rem', marginTop: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '18px', padding: '0.25rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type response..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        height: 'auto'
                      }}
                    />
                    <button type="submit" className="control-icon-btn" style={{ width: '28px', height: '28px', background: 'var(--ikea-blue)', border: 'none', borderRadius: '50%' }}>
                      <Send size={12} />
                    </button>
                  </form>
                )}
              </div>

            </div>
          ) : (
            // Dialer UI / Lockscreen
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <span className="stock-pill in-stock" style={{ margin: 0, padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>
                  Helpline Status: Available
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#fff', marginTop: '1rem', fontFamily: 'var(--font-display)' }}>
                  {phoneNumber}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                  IKEA Customer Relations UAE
                </div>
              </div>

              {/* Number buttons grid */}
              <div className="dialpad-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                  <button 
                    key={digit} 
                    onClick={() => pressDigit(digit)} 
                    className="dial-btn"
                  >
                    {digit}
                    <span>
                      {digit === '1' && ' '}
                      {digit === '2' && 'ABC'}
                      {digit === '3' && 'DEF'}
                      {digit === '4' && 'GHI'}
                      {digit === '5' && 'JKL'}
                      {digit === '6' && 'MNO'}
                      {digit === '7' && 'PQRS'}
                      {digit === '8' && 'TUV'}
                      {digit === '9' && 'WXYZ'}
                      {digit === '0' && '+'}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  onClick={startCall} 
                  className="call-action-btn start"
                  title="Call IKEA UAE"
                >
                  <Phone size={20} />
                </button>
                {phoneNumber !== '800-IKEA' && (
                  <button 
                    onClick={() => setPhoneNumber('800-IKEA')} 
                    className="btn-secondary" 
                    style={{ margin: '0 auto', padding: '0.15rem 0.5rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem', height: 'auto', borderRadius: '4px' }}
                  >
                    <RefreshCw size={10} /> Clear Dial
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Quick scenario buttons for testing */}
      <div className="quick-inquiry-box">
        <h3 className="quick-inquiry-title">
          <HelpCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          Quick-Click Inquiries
        </h3>
        <div className="inquiry-tags-grid">
          {scenarios.map((scenario, index) => (
            <button 
              key={index} 
              className="inquiry-tag"
              onClick={() => triggerScenario(scenario.text)}
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
