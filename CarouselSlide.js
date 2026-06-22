import React, { useRef, useEffect } from 'react';

// Renders an image with a headline + subtext overlay using Canvas,
// producing a polished carousel slide combining AI image + text design.
export default function CarouselSlide({ slide, onRendered }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !slide.image) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      // Draw image (cover-fit)
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

      // Dark gradient overlay at bottom for text readability
      const gradient = ctx.createLinearGradient(0, size * 0.45, 0, size);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Slide number badge
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.roundRect(40, 40, 90, 44, 22);
      ctx.fill();
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 26px Arial';
      ctx.fillText(`${slide.slideNumber}/${slide.total}`, 58, 70);

      // Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Arial';
      ctx.textBaseline = 'alphabetic';
      wrapText(ctx, slide.headline, 50, size - 160, size - 100, 64);

      // Subtext
      ctx.font = '32px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      wrapText(ctx, slide.subtext, 50, size - 60, size - 100, 38);

      if (onRendered) onRendered(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = slide.image;
  }, [slide, onRendered]);

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    let curY = y;
    const lines = [];
    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    // Draw from bottom up if it's the headline (anchor to y), else top-down
    const startY = curY - (lines.length - 1) * lineHeight;
    lines.forEach((l, i) => ctx.fillText(l.trim(), x, startY + i * lineHeight));
  }

  return <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 10, display: 'block', background: '#f1f5f9' }} />;
}
