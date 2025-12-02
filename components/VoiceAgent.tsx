import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AgentState, AUDIO_CONFIG } from '../types';
import { createAudioBlob, base64Decode, pcmToAudioBuffer } from '../utils/audioUtils';
import { getSystemInstruction } from '../services/knowledgeBase';
import AudioVisualizer from './AudioVisualizer';
import { Mic, X, Radio } from 'lucide-react';

const VoiceAgent: React.FC = () => {
  const [state, setState] = useState<AgentState>(AgentState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE_OUTPUT
      });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.5;
    }
  }, []);

  const connectToGemini = async () => {
    try {
      setState(AgentState.CONNECTING);
      setError(null);
      initAudio();

      if (!process.env.API_KEY) {
        throw new Error("API Key not found.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: AUDIO_CONFIG.SAMPLE_RATE_INPUT,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
        } 
      });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = await getSystemInstruction();

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setState(AgentState.LISTENING);
            
            if (!audioContextRef.current) return;
            
            const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_CONFIG.SAMPLE_RATE_INPUT });
            const source = inputContext.createMediaStreamSource(stream);
            const processor = inputContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const blob = createAudioBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: blob });
              });
            };

            source.connect(processor);
            processor.connect(inputContext.destination);

            inputSourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
               setState(AgentState.SPEAKING);
               
               const ctx = audioContextRef.current;
               const audioBuffer = pcmToAudioBuffer(
                 base64Decode(base64Audio), 
                 ctx, 
                 AUDIO_CONFIG.SAMPLE_RATE_OUTPUT
               );
               
               const now = ctx.currentTime;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
               
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               
               if (analyserRef.current) {
                 source.connect(analyserRef.current);
                 analyserRef.current.connect(ctx.destination);
               } else {
                 source.connect(ctx.destination);
               }
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               
               source.onended = () => {
                  if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
                    setState(AgentState.LISTENING);
                  }
               };
               
               audioQueueRef.current.push(source);
            }
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            disconnect();
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
            setError("Verbindung getrennt.");
            disconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Connection Failed");
      setState(AgentState.ERROR);
    }
  };

  const disconnect = () => {
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    
    audioQueueRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
    
    setState(AgentState.DISCONNECTED);
  };

  return (
    <div className="relative w-full bg-brand-dark border border-brand-border rounded-lg shadow-2xl overflow-hidden flex flex-col items-center">
      
      {/* Header / Logo Area */}
      <div className="w-full p-8 flex flex-col items-center justify-center border-b border-brand-gray bg-black/50">
        {/* Approximating the Gold Serif Logo */}
        <h1 className="font-serif text-5xl tracking-widest text-gold-gradient font-bold text-center">
          ANY EVER
        </h1>
        <p className="mt-2 text-brand-gold/60 text-[10px] tracking-[0.4em] uppercase font-sans">
          enjoy.audio
        </p>
      </div>

      {/* Main Visualizer Area */}
      <div className="relative w-full h-64 bg-black">
        <AudioVisualizer state={state} analyserNode={analyserRef.current} />
        
        {/* Floating Status Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-brand-gray/80 rounded-full border border-white/5 backdrop-blur-md">
           <div className={`w-1.5 h-1.5 rounded-full ${
             state === AgentState.LISTENING ? 'bg-brand-blue animate-pulse' :
             state === AgentState.SPEAKING ? 'bg-brand-gold animate-pulse' :
             'bg-brand-muted'
           }`}></div>
           <span className="text-[10px] uppercase font-bold tracking-widest text-brand-muted">
             {state === AgentState.DISCONNECTED ? 'Ready' : state === AgentState.SPEAKING ? 'Speaking' : 'Listening'}
           </span>
        </div>
      </div>

      {/* Control Footer */}
      <div className="w-full p-8 bg-brand-dark border-t border-brand-gray flex flex-col items-center gap-6">
        
        {error && (
          <div className="text-red-500 text-xs font-mono bg-red-950/30 px-4 py-2 rounded border border-red-900/50">
            {error}
          </div>
        )}

        {state === AgentState.DISCONNECTED || state === AgentState.ERROR ? (
          <button
            onClick={connectToGemini}
            className="group relative flex items-center justify-center w-16 h-16 rounded-full border border-brand-gold/30 hover:border-brand-gold bg-brand-black hover:bg-brand-gold/10 transition-all duration-500"
          >
             {/* Decorative Ring */}
             <div className="absolute inset-0 rounded-full border border-brand-gold/10 scale-125 group-hover:scale-110 transition-transform duration-700"></div>
             <Mic className="w-6 h-6 text-brand-gold" />
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="group relative flex items-center justify-center w-16 h-16 rounded-full border border-brand-blue/30 hover:border-brand-blue bg-brand-black hover:bg-brand-blue/10 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-full border border-brand-blue/20 scale-125 animate-pulse-slow"></div>
            <X className="w-6 h-6 text-brand-blue" />
          </button>
        )}

        <div className="text-center">
            <p className="text-brand-muted text-sm font-light">
              {state === AgentState.DISCONNECTED 
                ? "Sprechen Sie mit unserem AI Agenten." 
                : "Höre zu..."}
            </p>
            <p className="text-brand-border text-[10px] mt-2 uppercase tracking-widest">
              Powered by Gemini Live
            </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;