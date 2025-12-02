import React, { useEffect, useRef } from 'react';
import { AgentState } from '../types';

interface AudioVisualizerProps {
  state: AgentState;
  analyserNode: AnalyserNode | null;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state, analyserNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0); // FIXED: Initialized with 0

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const dataArray = new Uint8Array(analyserNode ? analyserNode.frequencyBinCount : 0);

    const draw = () => {
      if (!ctx || !canvas) return;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Idle State
      if (state === AgentState.DISCONNECTED || state === AgentState.CONNECTING) {
        ctx.beginPath();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
      } 
      // Active State
      else if (analyserNode) {
        analyserNode.getByteTimeDomainData(dataArray);
        
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#009fe3'; // ANY EVER Blue
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 159, 227, 0.4)';

        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * centerY;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, centerY);
        ctx.stroke();
        
        // Reset shadow for next frame
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [state, analyserNode]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default AudioVisualizer;