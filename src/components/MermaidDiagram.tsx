import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    primaryTextColor: '#f8fafc',
    background: '#0f172a',
    mainBkg: '#1e293b',
    nodeBorder: '#38bdf8',
    clusterBkg: '#1e293b',
    edgeLabelBackground: '#0f172a',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: '14px',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
});

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        containerRef.current.innerHTML = svg;
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre style="color: #ef4444; padding: 1rem;">Error rendering diagram</pre>`;
        }
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div
      style={{
        margin: '1.5rem 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}
    >
      {title && (
        <div
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--accent-gold)',
          }}
        >
          {title}
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          padding: '1rem',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          overflowX: 'auto',
          display: 'flex',
          justifyContent: 'center',
        }}
      />
    </div>
  );
};
