"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: "tsx" | "ts" | "js" | "bash" | "json" | "go" | "yaml";
  filename?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = "tsx",
  filename,
  className,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      {filename && (
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-foreground/15" />
            <span className="size-2 rounded-full bg-foreground/15" />
            <span className="size-2 rounded-full bg-foreground/15" />
            <span className="ml-2 font-mono">{filename}</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted/60">
            {language}
          </span>
        </div>
      )}
      <button
        onClick={onCopy}
        aria-label="Copy code"
        className={cn(
          "absolute right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 backdrop-blur px-2.5 py-1 text-xs text-muted hover:text-foreground hover:bg-background/90 transition-colors",
          filename ? "top-[0.65rem]" : "top-3",
        )}
      >
        {copied ? (
          <Check className="size-3" strokeWidth={2.5} />
        ) : (
          <Copy className="size-3" strokeWidth={1.5} />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-5 text-[13px] leading-6 font-mono text-foreground/90">
        <code>
          <HighlightedCode
            code={code}
            language={language}
            showLineNumbers={showLineNumbers}
          />
        </code>
      </pre>
    </div>
  );
}

interface Token {
  text: string;
  color: string;
}

const COLOR = {
  keyword: "#a78bfa",
  string: "#86efac",
  number: "#fda4af",
  function: "#7dd3fc",
  comment: "#64748b",
  prop: "#ff8a4c",
  operator: "#94a3b8",
  tag: "#6ee7b7",
  plain: "#d4d4d8",
};

function tokenize(code: string, language: string): Token[][] {
  const lines = code.split("\n");
  return lines.map((line) => {
    if (language === "bash" || language === "yaml") {
      if (line.trim().startsWith("#")) {
        return [{ text: line, color: COLOR.comment }];
      }
      if (language === "bash" && /^\s*(npm|pnpm|yarn|cd|export|docker|curl|cp|sudo)\b/.test(line)) {
        const m = line.match(/^(\s*\S+)(\s.*)?$/);
        if (m) {
          return [
            { text: m[1], color: COLOR.keyword },
            { text: m[2] ?? "", color: COLOR.plain },
          ];
        }
      }
      if (language === "yaml") {
        return yamlLine(line);
      }
      return [{ text: line, color: COLOR.plain }];
    }
    if (language === "json") {
      return jsonLine(line);
    }
    if (language === "go") {
      return goLine(line);
    }
    return jsLine(line);
  });
}

function jsLine(line: string): Token[] {
  if (line.trim().startsWith("//")) {
    return [{ text: line, color: COLOR.comment }];
  }
  const tokens: Token[] = [];
  const regex =
    /(\/\/.*$|("[^"]*"|'[^']*'|`[^`]*`)|(\b(?:import|from|const|let|var|function|return|if|else|new|await|async|export|default|class|extends|for|of|in|typeof|instanceof|true|false|null|undefined|this|void)\b)|(\b[A-Z][a-zA-Z0-9_]*\b)|(\b\d+\b)|([\w.@$-]+)(?=\s*\())/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, m.index), color: COLOR.plain });
    }
    if (m[1]) tokens.push({ text: m[1], color: COLOR.comment });
    else if (m[2]) tokens.push({ text: m[2], color: COLOR.string });
    else if (m[3]) tokens.push({ text: m[3], color: COLOR.keyword });
    else if (m[4]) tokens.push({ text: m[4], color: COLOR.prop });
    else if (m[5]) tokens.push({ text: m[5], color: COLOR.number });
    else if (m[6]) tokens.push({ text: m[6], color: COLOR.function });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), color: COLOR.plain });
  }
  return tokens;
}

function jsonLine(line: string): Token[] {
  const tokens: Token[] = [];
  const regex =
    /("[^"]*"\s*:)|("[^"]*")|(\btrue\b|\bfalse\b|\bnull\b)|(-?\b\d+\b)|([{}()\[\],])/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, m.index), color: COLOR.plain });
    }
    if (m[1]) tokens.push({ text: m[1], color: COLOR.prop });
    else if (m[2]) tokens.push({ text: m[2], color: COLOR.string });
    else if (m[3]) tokens.push({ text: m[3], color: COLOR.keyword });
    else if (m[4]) tokens.push({ text: m[4], color: COLOR.number });
    else if (m[5]) tokens.push({ text: m[5], color: COLOR.operator });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), color: COLOR.plain });
  }
  return tokens;
}

function yamlLine(line: string): Token[] {
  const tokens: Token[] = [];
  const m = line.match(/^(\s*-?\s*)([A-Za-z_][\w-]*)?(\s*:\s*)(.*)$/);
  if (m) {
    if (m[1]) tokens.push({ text: m[1], color: COLOR.plain });
    if (m[2]) tokens.push({ text: m[2], color: COLOR.prop });
    if (m[3]) tokens.push({ text: m[3], color: COLOR.plain });
    if (m[4]) {
      if (m[4].startsWith("#")) tokens.push({ text: m[4], color: COLOR.comment });
      else if (/^["'].*["']$/.test(m[4])) tokens.push({ text: m[4], color: COLOR.string });
      else if (/^\d/.test(m[4])) tokens.push({ text: m[4], color: COLOR.number });
      else tokens.push({ text: m[4], color: COLOR.string });
    }
    return tokens;
  }
  return [{ text: line, color: COLOR.plain }];
}

function goLine(line: string): Token[] {
  if (line.trim().startsWith("//")) {
    return [{ text: line, color: COLOR.comment }];
  }
  const tokens: Token[] = [];
  const regex =
    /(\/\/.*$|("[^"]*"|`[^`]*`)|(\b(?:package|import|func|var|const|type|struct|interface|return|if|else|for|range|map|chan|go|defer|select|case|default|switch|break|continue|nil|true|false)\b)|(\b[A-Z][a-zA-Z0-9_]*\b)|(\b\d+\b)|([\w.]+)(?=\s*\())/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, m.index), color: COLOR.plain });
    }
    if (m[1]) tokens.push({ text: m[1], color: COLOR.comment });
    else if (m[2]) tokens.push({ text: m[2], color: COLOR.string });
    else if (m[3]) tokens.push({ text: m[3], color: COLOR.keyword });
    else if (m[4]) tokens.push({ text: m[4], color: COLOR.prop });
    else if (m[5]) tokens.push({ text: m[5], color: COLOR.number });
    else if (m[6]) tokens.push({ text: m[6], color: COLOR.function });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), color: COLOR.plain });
  }
  return tokens;
}

function HighlightedCode({
  code,
  language,
  showLineNumbers,
}: {
  code: string;
  language: string;
  showLineNumbers: boolean;
}) {
  const lines = tokenize(code, language);
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className="table-row">
          {showLineNumbers && (
            <span className="table-cell pr-4 text-right text-muted/30 select-none w-8 align-top">
              {i + 1}
            </span>
          )}
          <span className="table-cell whitespace-pre align-top">
            {line.length === 0 ? (
              <span>{"\u00A0"}</span>
            ) : (
              line.map((token, j) => (
                <span key={j} style={{ color: token.color }}>
                  {token.text}
                </span>
              ))
            )}
          </span>
        </div>
      ))}
    </>
  );
}
