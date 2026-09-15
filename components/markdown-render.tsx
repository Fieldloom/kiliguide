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

  return <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 12, margin: "10px 0", border: "1px solid rgba(255,255,255,0.1)", overflowX: "auto" }} dangerouslySetInnerHTML={{ __html: svg }} />;
};

export function MarkdownRender({ content }: { content: string }) {
  return (
    <div className="md-body text-xs sm:text-sm md:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-zinc-200 m-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
          h1: ({ children }) => <h1 className="text-base sm:text-lg font-extrabold mt-3 mb-1.5 text-white tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm sm:text-base font-bold mt-2.5 mb-1 text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs sm:text-sm font-bold mt-2 mb-1 text-white">{children}</h3>,
          ul: ({ children }) => <ul className="my-1.5 pl-4 sm:pl-5 list-disc space-y-1 text-zinc-200">{children}</ul>,
          ol: ({ children }) => <ol className="my-1.5 pl-4 sm:pl-5 list-decimal space-y-1 text-zinc-200">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed text-zinc-200 pl-0.5">{children}</li>,
          code: ({ children, className }: any) => {
            const isBlock = className?.includes("language-");
            const isMermaid = className?.includes("language-mermaid");
            const codeString = String(children).replace(/\n$/, '');

            if (isMermaid) {
              return <MermaidBlock chart={codeString} />;
            }
            if (isBlock) return <pre className="bg-black/40 rounded-xl p-3 my-2 overflow-x-auto border border-white/10 text-xs font-mono text-emerald-400">{children}</pre>;
            return <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-emerald-400">{children}</code>;
          },
          blockquote: ({ children }) => <blockquote className="border-l-2 border-emerald-500/50 pl-3 my-2 text-zinc-400 italic">{children}</blockquote>,
          hr: () => <hr className="border-none border-t border-white/10 my-2.5" />,
          a: ({ href, children }) => <a href={href!} target="_blank" rel="noopener noreferrer" className="text-[#19c37d] underline hover:text-emerald-300 font-medium">{children}</a>,
          img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full rounded-xl mt-2.5 border border-white/10" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
