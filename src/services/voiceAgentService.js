// IKEA UAE Customer Support AI Voice Agent Service

class VoiceAgentService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.activeUtterance = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.isThinking = false;
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('ikea_gemini_api_key') || '';
    this.voiceName = localStorage.getItem('ikea_voice_name') || '';
    this.voiceLang = 'en-US';
    this.history = [];
    
    this.setupSpeechRecognition();
  }

  // Set API Key dynamically at runtime
  setApiKey(key) {
    this.apiKey = key;
  }

  // Clear conversation history
  resetHistory() {
    this.history = [];
  }

  // Initialize browser speech recognition
  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = this.voiceLang;
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
  }

  setApiKey(key) {
    // API Key is inlined statically in constructor.
  }

  setVoice(name) {
    this.voiceName = name;
    localStorage.setItem('ikea_voice_name', name);
    // Find language associated with the voice
    const voices = this.synthesis.getVoices();
    const selectedVoice = voices.find(v => v.name === name);
    if (selectedVoice) {
      this.voiceLang = selectedVoice.lang;
      if (this.recognition) {
        this.recognition.lang = selectedVoice.lang;
      }
    }
  }

  getAvailableVoices() {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices().filter(voice => 
      voice.lang.startsWith('en') || voice.lang.startsWith('ar')
    );
  }

  // Start listening to the microphone
  startListening(onResult, onError, onEnd) {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser.');
      return;
    }

    const bargeIn = localStorage.getItem('ikea_barge_in') !== 'false';
    if ((!bargeIn && this.isSpeaking) || this.isThinking) {
      console.log('Refusing to start listening: isSpeaking =', this.isSpeaking, 'isThinking =', this.isThinking, 'bargeIn =', bargeIn);
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Safe catch
      }
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn("SpeechRecognition start caught (already starting/running):", e);
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch (e) {
        console.warn("Error aborting recognition:", e);
      }
      this.isListening = false;
    }
  }

  // Helper to split text by language clauses (Arabic vs English)
  splitTextByLanguage(text) {
    const langPref = localStorage.getItem('ikea_language_preference') || 'bilingual';
    
    if (langPref === 'arabic') {
      return [{ text: text.trim(), isArabic: true }];
    }
    if (langPref === 'english') {
      return [{ text: text.trim(), isArabic: false }];
    }

    const clauses = text.split(/([.!?\n]+)/);
    const segments = [];
    
    let currentSegment = "";
    let currentIsArabic = null;

    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      if (!clause) continue;

      // If it's just punctuation, append it to the active segment
      if (/^[.!?\n\s]+$/.test(clause)) {
        if (currentSegment) {
          currentSegment += clause;
        }
        continue;
      }

      const isArabic = /[\u0600-\u06FF]/.test(clause);
      
      if (currentIsArabic === null) {
        currentIsArabic = isArabic;
        currentSegment = clause;
      } else if (currentIsArabic === isArabic) {
        currentSegment += clause;
      } else {
        segments.push({ text: currentSegment.trim(), isArabic: currentIsArabic });
        currentIsArabic = isArabic;
        currentSegment = clause;
      }
    }

    if (currentSegment && currentSegment.trim()) {
      segments.push({ text: currentSegment.trim(), isArabic: currentIsArabic });
    }

    return segments.filter(s => s.text.length > 0);
  }

  // Speak text using SpeechSynthesis
  speak(text, onStart, onEnd, onBoundary) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported.');
      onEnd();
      return;
    }

    this.stopSpeaking();
    const bargeIn = localStorage.getItem('ikea_barge_in') !== 'false';
    if (!bargeIn) {
      this.stopListening();
    }
    this.isSpeaking = true;
    this.isThinking = false;

    // Text cleaning for vocalization (e.g. remove markdown, replace item names, say "Hej" correctly)
    let speakableText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/AED/gi, ' Dirhams')
      .replace(/Hej/gi, 'Hey');

    const segments = this.splitTextByLanguage(speakableText);
    if (segments.length === 0) {
      onEnd();
      return;
    }

    // Failsafe timeout to prevent speech synthesis from getting stuck (Chrome TTS bug workaround)
    const textDurationEstimate = (speakableText.length * 150) + 4000; // 150ms per character + 4s buffer
    this.failsafeTimeout = setTimeout(() => {
      console.warn("SpeechSynthesis failsafe triggered. Forcing speech end to prevent lockup.");
      this.stopSpeaking();
      onEnd();
    }, textDurationEstimate);

    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(v => v.name === this.voiceName);

    segments.forEach((segment, index) => {
      const utterance = new SpeechSynthesisUtterance(segment.text);
      
      let selectedVoice = null;
      if (segment.isArabic) {
        // Find a female Arabic voice first (preferring Laila, Mariam, Hoda, Zeina)
        const arVoices = voices.filter(v => v.lang.startsWith('ar'));
        selectedVoice = arVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes('laila') || 
                 name.includes('mariam') || 
                 name.includes('hoda') || 
                 name.includes('zeina') || 
                 name.includes('female');
        }) || arVoices.find(v => {
          const name = v.name.toLowerCase();
          return !name.includes('maged') && !name.includes('tarik') && !name.includes('tarif');
        }) || arVoices[0];
      } else {
        // Find preferred or fallback English voice
        selectedVoice = preferredVoice || 
                        voices.find(v => v.lang.startsWith('en-GB')) || 
                        voices.find(v => v.lang.startsWith('en-US')) ||
                        voices.find(v => v.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }

      // Configure rate and pitch
      if (segment.text.includes("understand your frustration") || 
          segment.text.includes("sorry this happened") || 
          segment.text.includes("assist you") ||
          segment.text.includes("resolve this") ||
          segment.text.includes("أتفهم") || 
          segment.text.includes("آسف") ||
          segment.text.includes("أبذل قصارى جهدي")) {
        utterance.rate = 0.86;
      } else {
        utterance.rate = 1.0;
      }
      utterance.pitch = selectedVoice?.lang.startsWith('ar') ? 1.0 : 1.05;

      // Handle callbacks
      if (index === 0) {
        utterance.onstart = () => {
          this.activeUtterance = utterance;
          this.isSpeaking = true;
          onStart();
        };
      } else {
        utterance.onstart = () => {
          this.activeUtterance = utterance;
          this.isSpeaking = true;
        };
      }

      if (index === segments.length - 1) {
        utterance.onend = () => {
          if (this.failsafeTimeout) {
            clearTimeout(this.failsafeTimeout);
            this.failsafeTimeout = null;
          }
          this.activeUtterance = null;
          this.isSpeaking = false;
          onEnd();
        };
        utterance.onerror = (e) => {
          console.error('Speech synthesis error in final segment:', e);
          if (this.failsafeTimeout) {
            clearTimeout(this.failsafeTimeout);
            this.failsafeTimeout = null;
          }
          this.activeUtterance = null;
          this.isSpeaking = false;
          onEnd();
        };
      } else {
        utterance.onerror = (e) => {
          console.error('Speech synthesis error in intermediate segment:', e);
        };
      }

      // Syllable / word animations boundary callback
      if (onBoundary) {
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            onBoundary();
          }
        };
      }

      this.synthesis.speak(utterance);
    });
  }

  // Cancel any active speech
  stopSpeaking() {
    if (this.failsafeTimeout) {
      clearTimeout(this.failsafeTimeout);
      this.failsafeTimeout = null;
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.activeUtterance = null;
    this.isSpeaking = false;
    this.isThinking = false;
  }

  // Helper to detect if customer sounds upset, frustrated, or disappointed
  detectFrustration(text) {
    const frustrationKeywords = [
      'upset', 'frustrated', 'disappointed', 'angry', 'terrible', 'bad service', 
      'waiting', 'delayed', 'delay', 'wrong item', 'damaged', 'broken', 'complaint', 
      'worst', 'hate', 'scam', 'late', 'annoyed', 'horrible', 'waste of time',
      'غاضب', 'سيء', 'مشكلة', 'تأخير', 'خراب', 'مكسور', 'تأخر', 'حزين', 'ضايق'
    ];
    return frustrationKeywords.some(keyword => text.includes(keyword));
  }

  // Respond to user input (Hybrid Model)
  async getResponse(userInput, systemPrompt, knowledgeBaseData, chatHistory) {
    this.isThinking = true;
    // Standardize text
    const text = userInput.trim().toLowerCase();
    
    // Add to local history
    this.history.push({ role: 'user', content: userInput });

    // Scenario 1: Gemini API Mode (if Key is configured)
    if (this.apiKey) {
      try {
        const responseText = await this.callGemini(userInput, systemPrompt, knowledgeBaseData, chatHistory);
        this.history.push({ role: 'model', content: responseText });
        return responseText;
      } catch (error) {
        console.error("Gemini API call failed, falling back to simulated mode.", error);
        // Fall through to simulated mode if API fails
      }
    }

    // Scenario 2: Simulated Local Mode
    const simulatedResponse = this.generateSimulatedReply(text, knowledgeBaseData);
    this.history.push({ role: 'model', content: simulatedResponse });
    return simulatedResponse;
  }

  // Call the live Gemini API
  async callGemini(userInput, systemPrompt, knowledgeBaseData, chatHistory) {
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    
    // Inject language preference rules directly into the system instructions
    const langPref = localStorage.getItem('ikea_language_preference') || 'bilingual';
    let languageRule = "";
    if (langPref === 'english') {
      languageRule = "\nCRITICAL LANGUAGE RULE: Speak ENTIRELY in English. Do NOT greet or respond in Arabic under any circumstances.";
    } else if (langPref === 'arabic') {
      languageRule = "\nCRITICAL LANGUAGE RULE: Speak ENTIRELY in Arabic (Modern Standard / Gulf Arabic). Do NOT greet or respond in English under any circumstances.";
    }

    // Inject knowledge base directly into the system instructions
    const fullSystemPrompt = `${systemPrompt}${languageRule}\n\n=== IKEA UAE KNOWLEDGE BASE ===\n${JSON.stringify(knowledgeBaseData, null, 2)}`;
    
    // Format contents history for Gemini API
    const contents = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    // Append current user input if not already in history
    contents.push({
      role: 'user',
      parts: [{ text: userInput }]
    });

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: fullSystemPrompt }]
      },
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 250,
        topP: 0.95
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch Gemini response');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  // Rule-based NLP replies for Simulated Mode
  generateSimulatedReply(text, kb) {
    const reply = this.getSimulatedResponseRaw(text, kb);
    const isFrustrated = this.detectFrustration(text);
    if (isFrustrated) {
      // If the response already contains empathy or complaint handling, do not prepend extra empathy
      if (reply.includes("sorry this happened") || reply.includes("lodge a complaint") || 
          reply.includes("متأسف") || reply.includes("شكوى") || 
          reply.includes("understand your frustration")) {
        return reply;
      }

      const hasArabic = /[\u0600-\u06FF]/.test(text);
      const hasEnglish = /[a-zA-Z]/.test(text);
      const isMixed = hasArabic && hasEnglish;
      const isArabicOnly = hasArabic && !hasEnglish;
      
      let empathyPrefix = "";
      if (isArabicOnly) {
        empathyPrefix = "والله جداً متأسف على هالشي، ولا تشيل هم، أنا هنا عشان أساعدك وبنسوي كل اللي نقدر عليه عشان نحل الموضوع سوا. ";
      } else if (isMixed) {
        empathyPrefix = "I completely understand your frustration, and I'm really sorry this happened. وبسوي كل اللي أقدر عليه عشان أساعدك وأحل المشكلة. ";
      } else {
        empathyPrefix = "I completely understand your frustration, and I'm really sorry this happened. I'd like to help you resolve this. ";
      }
      return empathyPrefix + reply;
    }
    return reply;
  }

  getSimulatedResponseRaw(text, kb) {
    const langPref = localStorage.getItem('ikea_language_preference') || 'bilingual';
    
    let hasArabic = /[\u0600-\u06FF]/.test(text);
    let hasEnglish = /[a-zA-Z]/.test(text);

    if (langPref === 'english') {
      hasArabic = false;
      hasEnglish = true;
    } else if (langPref === 'arabic') {
      hasArabic = true;
      hasEnglish = false;
    }

    const isMixed = hasArabic && hasEnglish;
    const isArabicOnly = hasArabic && !hasEnglish;

    // Helper keywords check
    // 1. Complaints query (evaluated first to prioritize issue resolution)
    const isComplaintQuery = text.includes('complaint') || text.includes('complain') || text.includes('unhappy') || text.includes('dissatisfied') || text.includes('poor service') || text.includes('bad service') || text.includes('rude') || text.includes('faulty') || text.includes('mistake') || text.includes('delay') || text.includes('late') || text.includes('damaged') || text.includes('broken') ||
                            text.includes('شكوى') || text.includes('أشتكي') || text.includes('غير راض') || text.includes('سيء') || text.includes('تالف') || text.includes('مكسور') || text.includes('غلط') || text.includes('خطأ') || text.includes('مشكلة') || text.includes('تأخير') || text.includes('تأخر');

    // 2. Exchanges query (isolated from returns)
    const isExchangeQuery = text.includes('exchange') || text.includes('swap') || text.includes('replace') ||
                            text.includes('استبدال') || text.includes('تبديل');

    // 3. Returns query (excluding exchanges)
    const isReturnQuery = (text.includes('return') || text.includes('refund') || text.includes('bring back') || text.includes('receipt') || text.includes('opened') ||
                          text.includes('استرجاع') || text.includes('استرداد') || text.includes('فاتورة') || text.includes('إرجاع')) && !isExchangeQuery;

    // 4. Order tracking query (avoid matching plain delivery charge questions)
    const isOrderQuery = text.includes('track') || text.includes('order number') || text.includes('where is my order') || text.includes('status of') || text.includes('order status') || text.includes('pax') || text.includes('wardrobe') || (text.includes('order') && !text.includes('cost') && !text.includes('fee') && !text.includes('charge')) ||
                         text.includes('تتبع') || text.includes('أين طلبي') || text.includes('حالة الطلب') || text.includes('رقم الطلب');

    // 5. Delivery questions
    const isDeliveryQuery = text.includes('shipping') || text.includes('delivery fee') || text.includes('delivery cost') || text.includes('delivery rate') || text.includes('delivery charge') || text.includes('cost of delivery') || text.includes('free delivery') || text.includes('how much is delivery') ||
                            text.includes('رسوم توصيل') || text.includes('سعر توصيل') || text.includes('توصيل مجاني') || (text.includes('توصيل') && (text.includes('سعر') || text.includes('كم') || text.includes('رسوم')));

    // 6. Assembly services query
    const isAssemblyQuery = text.includes('assembly') || text.includes('install') || text.includes('assemble') || text.includes('build') ||
                            text.includes('تركيب') || text.includes('تجميع');

    // 7. Store details / hours query
    const isHoursQuery = text.includes('store') || text.includes('hours') || text.includes('time') || text.includes('location') || text.includes('address') || text.includes('where is') || text.includes('open') || text.includes('dubai') || text.includes('jebel ali') || text.includes('festival city') || text.includes('abu dhabi') || text.includes('yas island') || text.includes('ras al khaimah') || text.includes('rak') ||
                         text.includes('متجر') || text.includes('أوقات') || text.includes('ساعات') || text.includes('عنوان') || text.includes('موقع') || text.includes('مفتوح') || text.includes('دبي') || text.includes('أبوظبي') || text.includes('رأس الخيمة');

    // 8. Stock / product availability query
    const isStockQuery = text.includes('stock') || text.includes('product') || text.includes('avail') || text.includes('have') || text.includes('buy') || text.includes('billy') || text.includes('kallax') || text.includes('malm') || text.includes('poang') ||
                         text.includes('مخزون') || text.includes('متوفر') || text.includes('شراء') || text.includes('بيلي') || text.includes('مالم') || text.includes('كالاكس') || text.includes('بوانغ') || text.includes('منتج');

    // 9. IKEA Family Program
    const isFamilyQuery = text.includes('family') || text.includes('member') || text.includes('loyalty') || text.includes('card') || text.includes('discount') ||
                          text.includes('عائلة') || text.includes('عضو') || text.includes('خصم') || text.includes('بطاقة');

    const isClosingQuery = text.includes('thanks') || text.includes('thank you') || text.includes('bye') || text.includes('goodbye') || text.includes('shukran') || text.includes('شكرا') || text.includes('مع السلامة');

    // 1. Complaints
    // Check if the user has already lodged a complaint in this call session
    const hasAlreadyOfferedHelp = this.history.some(msg => 
      msg.role === 'model' && (msg.content.includes("I'd like to help resolve this") || msg.content.includes("أبشر بعزك") || msg.content.includes("أخدمك"))
    );

    if (isComplaintQuery) {
      // Escalation trigger: if this is a follow-up complaint or they explicitly ask to connect/transfer
      if (hasAlreadyOfferedHelp || text.includes('specialist') || text.includes('agent') || text.includes('human') || text.includes('manager') || text.includes('connect') || text.includes('transfer') || text.includes('تحدث') || text.includes('مشرف') || text.includes('شخص') || text.includes('تحويل')) {
        if (isArabicOnly) {
          return "أبشر بعزك، الحين بحولك للمختص عشان يتابع الموضوع معك ويخلصه لك بنفسه.";
        } else if (isMixed) {
          return "أبشر بعزك. I'm going to connect you with a specialist who can take care of this personally.";
        } else {
          return "I completely understand. I'm going to connect you with a specialist who can take care of this personally.";
        }
      }

      if (isArabicOnly) {
        return "ولا يهمك، واضح لي إنك تبي تقدم شكوى على اللي صار. أنا وايد متأسف على هالشي وأفهمك تماماً. الحين بساعدك، ممكن بس تقولي شو اللي صار بالضبط عشان أقدر أخدمك؟";
      } else if (isMixed) {
        return "I understand you would like to lodge a complaint. أنا وايد متأسف على هالشي. I completely understand. الحين بساعدك. Could you please share the details of your issue?";
      } else {
        return "I understand you would like to lodge a complaint regarding your experience. I'm really sorry this happened. I completely understand. I'd like to help resolve this. Could you please share the details of your issue?";
      }
    }

    // 2. Returns query (90 days standard, 120 days for Family)
    if (isReturnQuery) {
      if (isArabicOnly) {
        return "فهمت إنك تسأل عن سياسة الاسترجاع. الموضوع وايد سهل، بخصوص الاسترجاع تقدر ترجع المنتجات خلال 90 يوم إذا كانت مغلفة وبحالتها الأصلية ومعاك الفاتورة. وأعضاء عائلة ايكيا لهم 120 يوم. تبي أدليك على أقرب فرع لك؟";
      } else if (isMixed) {
        return "I see you are asking about returns. تقدر ترجع المنتجات خلال 90 يوم إذا مغلفة وبحالتها ومعاك الفاتورة، ولأعضاء عائلة ايكيا 120 يوم. Would you like me to find the nearest store for you؟";
      } else {
        return "I see you are asking about returns. You can return unopened products in their original packaging within 90 days of purchase with the receipt. IKEA Family members enjoy an extended window of 120 days. Would you like me to find the nearest store for you?";
      }
    }

    // 3. Exchanges query
    if (isExchangeQuery) {
      if (isArabicOnly) {
        return "تمام، تبي تسوي استبدال للمنتج. تقدر تستبدل المنتجات خلال 90 يوم إذا كانت مغلفة وبحالتها ومعاك الفاتورة، ولأعضاء عائلة ايكيا معاهم 120 يوم. تحب تشوف مواقع فروعنا؟";
      } else if (isMixed) {
        return "I understand you want to exchange a product. تقدر تستبدل المنتجات خلال 90 يوم إذا مغلفة وبحالتها ومعاك الفاتورة، ولأعضاء عائلة ايكيا 120 يوم. Would you like to check store locations?";
      } else {
        return "I understand you want to exchange a product. You can exchange products within 90 days of purchase (120 days for IKEA Family members) if they are unopened and you have the receipt. Would you like me to check store locations for you?";
      }
    }

    // 4. Order tracking query
    if (isOrderQuery) {
      let orderMatch = text.match(/\b\d{9}\b/) || text.match(/\b\d{3}\s?\d{3}\s?\d{3}\b/);
      let orderNum = null;
      if (orderMatch) {
        orderNum = orderMatch[0].replace(/\s/g, '');
      } else {
        // Search user history for a previously stated 9-digit order number in this call session
        const previousUserMsgs = this.history.filter(h => h.role === 'user');
        for (let i = previousUserMsgs.length - 1; i >= 0; i--) {
          const prevText = previousUserMsgs[i].content.toLowerCase();
          const match = prevText.match(/\b\d{9}\b/) || prevText.match(/\b\d{3}\s?\d{3}\s?\d{3}\b/);
          if (match) {
            orderNum = match[0].replace(/\s/g, '');
            break;
          }
        }
      }

      if (isArabicOnly) {
        if (orderNum) {
          const formattedOrderNum = `${orderNum.slice(0, 3)} ${orderNum.slice(3, 6)} ${orderNum.slice(6)}`;
          return `أبشر، الحين أتبع لك طلبك. رقم الطلب المتأكد منه هو ${formattedOrderNum}. حالة الطلب الحين هي: مجدول للتوصيل والتركيب بكرة في دبي بين 10 الصبح و 10 بالليل. في أي شي ثاني أقدر أساعدك فيه يا خوي؟`;
        } else {
          return "أبشر بعزك، أكيد أقدر أساعدك تتبع طلبك. بس عطني رقم الطلب المكون من 9 أرقام عشان أشوفه لك؟";
        }
      } else if (isMixed) {
        if (orderNum) {
          const formattedOrderNum = `${orderNum.slice(0, 3)} ${orderNum.slice(3, 6)} ${orderNum.slice(6)}`;
          return `I understand you'd like to track your order. Confirming order number ${formattedOrderNum}. حالة الطلب الحين هي: مجدول للتوصيل بكرة. Is there anything else I can assist you with today؟`;
        } else {
          return "I understand you'd like to track your order. هل يمكنني الحصول على رقم الطلب الخاص بك المكون من 9 digits؟";
        }
      } else {
        if (orderNum) {
          const formattedOrderNum = `${orderNum.slice(0, 3)} ${orderNum.slice(3, 6)} ${orderNum.slice(6)}`;
          return `I understand you want to track your order. Confirming order number ${formattedOrderNum}. The status of your order is: scheduled for delivery tomorrow between 10 AM and 10 PM. Is there anything else I can assist you with today?`;
        } else {
          return "I understand you want to track your order. Could you please share your 9-digit order number?";
        }
      }
    }

    // 5. Stock / product availability query (with strict uncertainty checks)
    if (isStockQuery) {
      let productEn = "";
      let productAr = "";
      let detailsEn = "";
      let detailsAr = "";

      if (text.includes('billy') || text.includes('بيلي')) {
        productEn = "BILLY Bookcase";
        productAr = "مكتبة بيلي";
        detailsEn = "We have 45 units available in Dubai Festival City, 12 in Jebel Ali, and 28 in Yas Island. It's fully in stock.";
        detailsAr = "عندنا 45 حبة متوفرة في دبي فستيفال سيتي، و 12 في جبل علي، و 28 في جزيرة ياس. المخزون متوفر وممتاز.";
      } else if (text.includes('malm') || text.includes('مالم')) {
        productEn = "MALM chest of drawers";
        productAr = "خزانة مالم";
        detailsEn = "We have 14 units at Jebel Ali and 5 in Ras Al Khaimah, but Dubai Festival City is currently out of stock. We expect a new shipment next Tuesday.";
        detailsAr = "عندنا 14 حبة في جبل علي و 5 في رأس الخيمة، بس للأسف مخلصة الحين في دبي فستيفال سيتي. الشحنة اليديدة بتوصل الثلاثاء الجاي.";
      } else if (text.includes('kallax') || text.includes('كالاكس')) {
        productEn = "KALLAX unit";
        productAr = "خزانة كالاكس";
        detailsEn = "We have plenty in stock. There are 35 units at Dubai Festival City, 18 in Jebel Ali, and 22 on Yas Island.";
        detailsAr = "المخزون متوفر وكافي، فيه 35 حبة في فستيفال سيتي، و 18 في جبل علي، و 22 في جزيرة ياس.";
      } else if (text.includes('poang') || text.includes('بوانغ')) {
        productEn = "POÄNG Armchair";
        productAr = "كرسي بوانغ بذراعين";
        detailsEn = "We have 24 units in Dubai Festival City, 31 in Jebel Ali, and 19 in Yas Island. It's fully in stock.";
        detailsAr = "عندنا 24 حبة متوفرة في دبي فستيفال سيتي، و 31 في جبل علي، و 19 في جزيرة ياس. مخزونها ممتاز جداً.";
      } else {
        // Strict uncertainty check: never invent stock levels
        if (isArabicOnly) return "أشوف إنك تسأل عن توفر المنتج، لحظة بس أشوف لك وأتأكد.";
        if (isMixed) return "I see you are asking about product availability. Let me check that. خلني أشوف لك وأتأكد.";
        return "I see you are asking about product availability. Let me confirm that for you.";
      }

      if (isArabicOnly) {
        return `تمام، تبي تتأكد من توفر المنتج. خلني أشوف لك ${productAr}. نعم، ${detailsAr} تحب أسوي لك طلب استلام من المعرض (كليك آند كولكت)؟`;
      } else if (isMixed) {
        return `I see you are asking about product availability. Let me check the stock for ${productEn}. عندنا ${detailsAr} Would you like me to help you book a Click and Collect order for pickup؟`;
      } else {
        return `I see you are asking about product availability. Let me check stock for the ${productEn}. Yes. ${detailsEn} Would you like me to help you book a Click and Collect order for it?`;
      }
    }

    // 6. Store details / hours query
    if (isHoursQuery) {
      if (isArabicOnly) {
        return "فهمت إنك تبي تعرف مواقعنا وأوقات عمل الفروع. فروعنا في دبي فستيفال سيتي، وجبل علي، وجزيرة ياس، ورأس الخيمة أوقات عملها الحين تختلف: دبي فستيفال سيتي يفتح من 10 الصبح لـ 11 بالليل (وإلى 12 بالليل في الويكند)، وجبل علي والياس أوقاتهم مشابهة. أي فرع ودك تزوره عشان أعطيك وقته بالضبط؟";
      } else if (isMixed) {
        return "I understand you are asking for store locations and opening hours. فروعنا في دبي فستيفال سيتي، وجبل علي، والياس تفتح من 10 الصبح لـ 11 بالليل. Which store are you visiting؟";
      } else {
        return "I understand you are asking for store locations and opening hours. Our stores in Dubai Festival City, Jebel Ali, Yas Island Abu Dhabi, and Ras Al Khaimah are open daily. Which store location would you like details for?";
      }
    }

    // 7. Assembly services query (starts from 99)
    if (isAssemblyQuery) {
      if (isArabicOnly) {
        return "أشوف إنك تسأل عن خدمات التركيب. موضوع التركيب سهل، يبدأ من 99 درهم. وعندنا باقات توصيل وتركيب بـ 144 درهم للطلبات اللي تحت 950 درهم، وبـ 99 درهم للطلبات الكبيرة فوق 950 درهم. تحب أشوف لك رسوم تركيب منتج معين؟";
      } else if (isMixed) {
        return "I understand you have a question about assembly services. Assembly starts at AED 99. وعندنا باقة توصيل وتركيب بـ 144 درهم. هل ترغب في أن أتحقق من رسوم تركيب منتج معين؟";
      } else {
        return "I understand you have a question about assembly services. Assembly charges start at AED 99. We offer combined delivery & assembly packages starting at AED 144. Would you like me to confirm the assembly fee for a specific item?";
      }
    }

    // 8. Delivery services query
    if (isDeliveryQuery) {
      if (isArabicOnly) {
        return "تبي تستفسر عن رسوم التوصيل، التوصيل عندنا للإكسسوارات يبدأ من 10 دراهم ويكون مجاني لو طلبك فوق 250 درهم. وللأثاث يبدأ من 45 درهم ويكون مجاني لو طلبك فوق 950 درهم. في أي شي ثاني ودك تستفسر عنه؟";
      } else if (isMixed) {
        return "I see you have a question about delivery rates. التوصيل للإكسسوارات من 10 دراهم (مجاني فوق 250)، وللأثاث من 45 درهم (مجاني فوق 950). Does that make sense؟";
      } else {
        return "I see you have a question about delivery rates. Home delivery for accessories starts from AED 10 (free above AED 250) and furniture starts from AED 45 (free above AED 950). Is there anything else I can clarify?";
      }
    }

    // 9. IKEA Family Program
    if (isFamilyQuery) {
      if (isArabicOnly) {
        return "تسأل عن عضوية عائلة ايكيا. الاشتراك مجاني بالكامل يا خوي، ويعطيك خصومات حصرية، وفترة استرجاع 120 يوم، وقهوة أو شاي مجاني بالمعرض. تحب أسجل لك الحين؟";
      } else if (isMixed) {
        return "I understand you are asking about our IKEA Family membership. الاشتراك مجاني بالكامل ويعطيك خصومات حصرية وفترة استرجاع 120 يوم. Would you like to sign up?";
      } else {
        return "I understand you are asking about our IKEA Family membership. Membership in our IKEA Family program is completely free. It provides exclusive discounts, 120-day return windows, and free hot drinks. Would you like to sign up?";
      }
    }

    // 10. Arabic Greetings / Input
    if (isArabicOnly) {
      return "يا هلا بك في ايكيا الإمارات. تسلم يا خوي على تواصلك معنا، ويسعدني وايد أخدمك. كيف أقدر أساعدك اليوم؟";
    }

    // 11. Mixed Input Default Greetings / Catch-alls
    if (isMixed) {
      return "Hej! Welcome to IKEA UAE. يا هلا بك، شلون أقدر أساعدك اليوم؟ How can I help you today?";
    }

    const isNoQuery = text === 'no' || text.startsWith('no ') || text.includes('no thank') || text.includes('nothing') || text.includes('la shukran') || text.includes('لا شكرا') || text.includes('لا ') || text === 'لا' || text.includes('that\'s all') || text.includes('that\'s it') || text.includes('that is all');

    const lastAgentMessage = this.history.length > 0 ? [...this.history].reverse().find(msg => msg.role === 'model') : null;
    const lastAgentText = lastAgentMessage ? lastAgentMessage.content : '';

    const wasAskedIfAnythingElse = lastAgentText.includes("Is there anything else I can help you with today?") || 
                                   lastAgentText.includes("أقدر أساعدك فيه") || 
                                   lastAgentText.includes("Is there anything else I can assist you with today?");

    // 12. No Query
    if (isNoQuery && wasAskedIfAnythingElse) {
      if (isArabicOnly) {
        return "تسلم يا خوي ومشكور وايد على اتصالك بايكيا الإمارات، وإن شاء الله أكون فدتك اليوم. أتمنى لك يوم سعيد وحياك الله بأي وقت، مع السلامة!";
      } else if (isMixed) {
        return "شكراً لك. Thank you warmly for calling IKEA UAE. Wish you a wonderful day! Hej då!";
      } else {
        return "Thank you warmly for calling IKEA UAE. I wish you a wonderful day! Hej då!";
      }
    }

    // 13. Closings / Thanks (Confirm issue resolved, ask "Is there anything else...")
    if (isClosingQuery || isNoQuery) {
      if (isArabicOnly) {
        return "بس حاب أتأكد أول شي إن موضوعك انحل بالكامل. في أي شي ثاني أقدر أساعدك فيه اليوم؟";
      } else if (isMixed) {
        return "I want to confirm that your issue has been resolved. في أي شي ثاني أقدر أساعدك فيه اليوم؟ Is there anything else I can help you with today?";
      } else {
        return "I want to confirm that your issue has been resolved. Is there anything else I can help you with today?";
      }
    }

    // 13. English / Default Catch-alls (Uncertainty fallback)
    return "Let me confirm that for you.";
  }
}

export const voiceAgent = new VoiceAgentService();
