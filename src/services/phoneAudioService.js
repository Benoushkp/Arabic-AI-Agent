class PhoneAudioService {
  constructor() {
    this.ctx = null;
    this.comfortNoiseSource = null;
    this.ringbackInterval = null;
    this.activeOscillators = [];
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate call static / comfort noise
  startComfortNoise() {
    this.init();
    this.stopComfortNoise();

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // Fill with brown/pinkish white noise
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.comfortNoiseSource = this.ctx.createBufferSource();
      this.comfortNoiseSource.buffer = noiseBuffer;
      this.comfortNoiseSource.loop = true;

      // Filter high pitch hiss to sound like phone line (lowpass filter at 1000Hz)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      // Low volume gain
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.008, this.ctx.currentTime); // very subtle comfort noise

      this.comfortNoiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      this.comfortNoiseSource.start();
    } catch (e) {
      console.warn("Could not start comfort noise:", e);
    }
  }

  stopComfortNoise() {
    if (this.comfortNoiseSource) {
      try {
        this.comfortNoiseSource.stop();
      } catch (e) {}
      this.comfortNoiseSource = null;
    }
  }

  // Play standard telephone ringback (440Hz + 480Hz combined)
  startRingbackTone() {
    this.init();
    this.stopRingbackTone();

    const playRing = () => {
      try {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc1.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc2.frequency.setValueAtTime(480, this.ctx.currentTime);
        gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime); // soft ringing volume

        // Mute/fade out at the end of the ring (2 seconds duration)
        gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime + 1.8);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.start();
        osc2.start();

        osc1.stop(this.ctx.currentTime + 2.0);
        osc2.stop(this.ctx.currentTime + 2.0);

        this.activeOscillators.push(osc1, osc2);
      } catch (e) {
        console.warn("Error playing ringback:", e);
      }
    };

    // Play immediately, then repeat every 6 seconds (2s ring, 4s silence)
    playRing();
    this.ringbackInterval = setInterval(playRing, 6000);
  }

  stopRingbackTone() {
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
    this.activeOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.activeOscillators = [];
  }

  // Connected chime
  playConnectionTone() {
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Sweet 2-tone chime: 880Hz then sliding to 1046Hz
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }

  // Hangup beep beep beep
  playDisconnectTone() {
    this.init();
    try {
      // Play 3 rapid beeps at 425Hz (standard European hangup tone)
      const playBeep = (delay) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(425, this.ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime + delay + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.25);
      };

      playBeep(0);
      playBeep(0.35);
      playBeep(0.7);
    } catch (e) {}
  }
}

export const phoneAudio = new PhoneAudioService();
