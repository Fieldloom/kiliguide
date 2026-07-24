import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'dark' });

const MermaidBlock = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    try {
      mermaid.render(id, chart).then((result) => {
        setSvg(result.svg);
      }).catch((e) => {
        setSvg(`<div style="color:red; font-size:12px;">Failed to render Mermaid diagram: ${e.message}</div>`);
      });
    } catch (e: any) {
      setSvg(`<div style="color:red; font-size:12px;">Mermaid Error: ${e.message}</div>`);
    }
  }, [chart, id]);

  return <div style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12, margin: "16px 0", border: "1px solid rgba(255,255,255,0.1)" }} dangerouslySetInnerHTML={{ __html: svg }} />;
};

export function MarkdownRender({ content }: { content: string }) {
  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: "0 0 12px", lineHeight: 1.75 }}>{children}</p>,
          strong: ({ children }) => <strong style={{ fontWeight: 700, color: "#ffffff" }}>{children}</strong>,
          em: ({ children }) => <em style={{ fontStyle: "italic", color: "#c0c0c0" }}>{children}</em>,
          h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 800, margin: "18px 0 10px", color: "#ffffff", letterSpacing: "-0.02em" }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px", color: "#ffffff" }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 700, margin: "14px 0 6px", color: "#ffffff" }}>{children}</h3>,
          ul: ({ children }) => <ul style={{ margin: "8px 0 12px", paddingLeft: 26, listStyleType: "disc" }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: "8px 0 12px", paddingLeft: 26, listStyleType: "decimal" }}>{children}</ol>,
          li: ({ children }) => <li style={{ lineHeight: 1.75, color: "#ececec", marginBottom: 5, display: "list-item", paddingLeft: 4 }}>{children}</li>,
          code: ({ children, className }: any) => {
            const isBlock = className?.includes("language-");
            const isMermaid = className?.includes("language-mermaid");
            const codeString = String(children).replace(/\n$/, '');

            if (isMermaid) {
              return <MermaidBlock chart={codeString} />;
            }
            if (isBlock) return <pre style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "12px 16px", overflowX: "auto", margin: "10px 0", border: "1px solid rgba(255,255,255,0.05)" }}><code style={{ fontSize: 13, fontFamily: "monospace", color: "#a8ff78" }}>{children}</code></pre>;
            return <code style={{ background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "2px 6px", fontSize: 13, fontFamily: "monospace", color: "#a8ff78" }}>{children}</code>;
          },
          blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid rgba(255,255,255,0.2)", paddingLeft: 14, margin: "10px 0", color: "#a1a1aa", fontStyle: "italic" }}>{children}</blockquote>,
          hr: () => <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "16px 0" }} />,
          a: ({ href, children }) => <a href={href!} target="_blank" rel="noopener noreferrer" style={{ color: "#10b981", textDecoration: "underline" }}>{children}</a>,
          img: ({ src, alt }) => <img src={src} alt={alt} style={{ maxWidth: '100%', borderRadius: 12, marginTop: 16, border: '1px solid rgba(255,255,255,0.1)' }} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
