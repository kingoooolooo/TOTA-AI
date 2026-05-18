interface ConsolePanelProps {
  lines: string[];
}

export const ConsolePanel = ({ lines }: ConsolePanelProps) => (
  <div className="console-panel">
    {lines.length === 0 ? (
      <span className="console-panel__empty">Console output will appear here</span>
    ) : (
      lines.map((line, index) => <pre key={`${line}-${index}`}>{line}</pre>)
    )}
  </div>
);
