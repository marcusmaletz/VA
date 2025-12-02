import { Blob } from '@google/genai';

// Convert Float32Array from AudioContext to PCM Int16 Array for Gemini
export function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

// Base64 Encode
export function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 Decode
export function base64Decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Create a Blob object compatible with Gemini Live API
export function createAudioBlob(data: Float32Array): Blob {
  const int16 = float32ToInt16(data);
  const uint8 = new Uint8Array(int16.buffer);
  return {
    data: base64Encode(uint8),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Convert PCM data received from Gemini back to AudioBuffer
export function pcmToAudioBuffer(
  pcmData: Uint8Array,
  audioContext: AudioContext,
  sampleRate: number = 24000
): AudioBuffer {
  const dataInt16 = new Int16Array(pcmData.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}