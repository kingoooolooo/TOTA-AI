import { useEffect, useMemo, useRef, useState } from "react";
import { WebContainer, type FileSystemTree, type WebContainerProcess } from "@webcontainer/api";
import { Maximize2, Minimize2 } from "lucide-react";
import type { CoderFile } from "../../types";

interface PreviewPanelProps {
  files: CoderFile[];
  onConsole: (line: string) => void;
}

const makeStaticPreview = (files: CoderFile[]): string => {
  const htmlFile = files.find((file) => file.path.endsWith("index.html") || file.path.endsWith(".html"));
  const cssContent = files.filter((file) => file.path.endsWith(".css")).map((file) => file.content).join("\n");
  
  // Build workspace map for browser-side Babel compilation
  const workspaceFilesMap = files.reduce((acc, file) => {
    acc[file.path] = file.content;
    return acc;
  }, {} as Record<string, string>);

  // Escape < and > inside JSON string to prevent premature script tag closure in browser HTML parser
  const escapedWorkspaceJson = JSON.stringify(workspaceFilesMap)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  const hasTailwind = files.some(
    (f) => f.content.includes("tailwindcss") || f.content.includes("tailwind") || f.path.includes("tailwind")
  );

  const cdnScripts = `
  <!-- React, ReactDOM and Babel Standalone for live client-side transpilation -->
  <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js" crossorigin></script>
  ${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ""}
  `;

  const loaderScript = `
  <script>
    // Workspace files (escaped for HTML safety)
    window.__WORKSPACE_FILES__ = ${escapedWorkspaceJson};
    
    // Redirect console logs to workspace console panel
    const _log = console.log;
    const _error = console.error;
    
    function sendLogToParent(type, message) {
      window.parent.postMessage({
        type: 'CONSOLE_LOG',
        payload: '[' + type + '] ' + message
      }, '*');
    }
    
    console.log = function(...args) {
      _log.apply(console, args);
      sendLogToParent('INFO', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };
    
    console.error = function(...args) {
      _error.apply(console, args);
      sendLogToParent('ERROR', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    window.onerror = function(message, source, lineno, colno, error) {
      console.error(message + " (" + lineno + ":" + colno + ")");
    };
    
    const files = window.__WORKSPACE_FILES__;
    const modules = {};
    
    function requireModule(path) {
      const cleanPath = path.replace(/^\\.\\/?/, '').replace(/^\\.\\.\\/?/, '');
      
      if (cleanPath === 'react') return window.React;
      if (cleanPath === 'react-dom' || cleanPath === 'react-dom/client') {
        return {
          createRoot: (el) => ({
            render: (component) => {
              const root = window.ReactDOM.createRoot(el);
              root.render(component);
            }
          }),
          render: (component, el) => {
            window.ReactDOM.render(component, el);
          }
        };
      }
      
      if (cleanPath.startsWith('lucide-react')) {
        return new Proxy({}, {
          get: (target, prop) => {
            return function(props) { 
              return window.React.createElement('span', { 
                style: { display: 'inline-flex', alignItems: 'center', fontSize: '12px', opacity: 0.8 },
                ...props
              }, '[' + prop + ']'); 
            };
          }
        });
      }
      
      let foundPath = Object.keys(files).find(p => p.endsWith(cleanPath));
      if (!foundPath) {
        const baseName = cleanPath.split('/').pop();
        foundPath = Object.keys(files).find(p => p.split('/').pop().replace(/\\.(tsx|ts|jsx|js)$/, '') === baseName);
      }
      
      if (!foundPath) {
        throw new Error("Module not found: " + path);
      }
      
      if (modules[foundPath]) return modules[foundPath].exports;
      
      const module = { exports: {} };
      modules[foundPath] = module;
      
      const content = files[foundPath];
      
      if (/\\.(js|jsx|ts|tsx)$/.test(foundPath)) {
        try {
          const transpiled = Babel.transform(content, {
            presets: [
              ['env', { modules: 'commonjs' }],
              'react',
              ['typescript', { isTSX: true, allExtensions: true }]
            ],
            filename: foundPath
          }).code;
          
          const fn = new Function('require', 'module', 'exports', 'React', 'ReactDOM', transpiled);
          fn(requireModule, module, module.exports, window.React, window.ReactDOM);
        } catch (e) {
          console.error("Compile error in " + foundPath + ": " + e.message);
          throw e;
        }
      }
      
      return module.exports;
    }
    
    try {
      const entryPoints = [
        'src/main.tsx',
        'src/index.tsx',
        'src/App.tsx',
        'src/index.js',
        'src/App.js',
        'App.tsx'
      ];
      
      let mainFile = entryPoints.find(p => files[p]);
      if (!mainFile) {
        mainFile = Object.keys(files).find(p => /\\.(tsx|ts|jsx|js)$/.test(p));
      }
      
      if (mainFile) {
        requireModule('./' + mainFile);
      } else {
        document.getElementById('root').innerHTML = '<div style="padding:20px;color:#ef4444;">No entry script file found.</div>';
      }
    } catch(err) {
      document.getElementById('root').innerHTML = '<div style="padding:20px;color:#ef4444;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;"><h3>Preview Error</h3><pre>' + err.message + '</pre></div>';
    }
  </script>
  `;

  if (htmlFile) {
    let content = htmlFile.content;
    
    // Inject CSS
    if (cssContent) {
      const styleTag = `<style>\n${cssContent}\n</style>`;
      if (content.includes("</head>")) {
        content = content.replace("</head>", `${styleTag}\n</head>`);
      } else {
        content = styleTag + content;
      }
    }
    
    // Inject CDN Scripts
    if (content.includes("</head>")) {
      content = content.replace("</head>", `${cdnScripts}\n</head>`);
    } else {
      content = cdnScripts + content;
    }

    // Strip out all local script tags (like /src/main.tsx or main.js) to avoid duplicate module crashes
    content = content.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match) => {
      // Keep CDN scripts and our own injected loader script
      if (match.includes("unpkg.com") || match.includes("cdn.tailwindcss.com") || match.includes("window.__WORKSPACE_FILES__")) {
        return match;
      }
      // Keep other external script tags if they load from http/https
      if (match.includes("src=\"http") || match.includes("src='http") || match.includes("src=\"//") || match.includes("src='//")) {
        return match;
      }
      // Remove all local/relative workspace scripts
      return "";
    });

    // Inject our compiler loader
    if (content.includes("</body>")) {
      content = content.replace("</body>", `${loaderScript}\n</body>`);
    } else {
      content = content + loaderScript;
    }

    return content;
  }

  // Fallback default template if no index.html is provided
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ayan AI Preview</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #1a1a1a;
    }
    ${cssContent}
  </style>
  ${cdnScripts}
</head>
<body>
  <div id="root"></div>
  ${loaderScript}
</body>
</html>`;
};

const mountTreeFromFiles = (files: CoderFile[]): FileSystemTree => {
  const tree: FileSystemTree = {};

  files.forEach((file) => {
    const parts = file.path.split("/").filter(Boolean);
    let cursor = tree;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        cursor[part] = { file: { contents: file.content } };
        return;
      }

      if (!cursor[part] || !("directory" in cursor[part])) {
        cursor[part] = { directory: {} };
      }
      cursor = cursor[part].directory ?? {};
    });
  });

  return tree;
};

const getRunCommand = (files: CoderFile[]): string[] => {
  const packageFile = files.find((file) => file.path === "package.json");
  if (!packageFile) return [];

  try {
    const pkg = JSON.parse(packageFile.content) as { scripts?: Record<string, string> };
    if (pkg.scripts?.dev) return ["npm", "run", "dev", "--", "--host", "0.0.0.0"];
    if (pkg.scripts?.start) return ["npm", "start"];
  } catch {
    return [];
  }

  return [];
};

export const PreviewPanel = ({ files, onConsole }: PreviewPanelProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Preview will appear here");
  const containerRef = useRef<WebContainer | null>(null);
  const processRef = useRef<WebContainerProcess | null>(null);
  const staticPreview = useMemo(() => makeStaticPreview(files), [files]);

  useEffect(() => {
    let cancelled = false;

    const runPreview = async (): Promise<void> => {
      setPreviewUrl(null);

      if (files.length === 0) {
        setStatus("Preview will appear here");
        return;
      }

      const runCommand = getRunCommand(files);
      if (runCommand.length === 0 || !window.crossOriginIsolated) {
        setStatus(window.crossOriginIsolated ? "Static preview" : "Static preview: WebContainers need COOP/COEP");
        setPreviewUrl(null);
        return;
      }

      try {
        setStatus("Starting environment...");
        if (!containerRef.current) {
          containerRef.current = await WebContainer.boot();
          containerRef.current.on("server-ready", (_port, url) => {
            if (!cancelled) {
              setPreviewUrl(url);
              setStatus("Preview running");
            }
          });
        }

        await containerRef.current.mount(mountTreeFromFiles(files));
        processRef.current?.kill();

        setStatus("Installing dependencies...");
        const install = await containerRef.current.spawn("npm", ["install"]);
        install.output.pipeTo(
          new WritableStream({
            write(data: string) {
              onConsole(data);
            }
          })
        );
        const installExit = await install.exit;
        if (installExit !== 0) {
          setStatus("Install failed. Check console.");
          return;
        }

        setStatus("Launching preview...");
        const [command, ...args] = runCommand;
        processRef.current = await containerRef.current.spawn(command, args);
        processRef.current.output.pipeTo(
          new WritableStream({
            write(data: string) {
              onConsole(data);
            }
          })
        );
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Preview crashed");
      }
    };

    void runPreview();
    return () => {
      cancelled = true;
    };
  }, [files, onConsole]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerElementRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerElementRef.current) return;
    
    if (!document.fullscreenElement) {
      containerElementRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Fullscreen error:", err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (files.length === 0) {
    return (
      <div className="preview-placeholder">
        <strong>{status}</strong>
        <span>Generated apps render here after the coding agent responds.</span>
      </div>
    );
  }

  return (
    <div ref={containerElementRef} className="preview-container relative w-full h-full flex flex-col" style={{ height: "100%", width: "100%", position: "relative" }}>
      <div className="absolute top-3 right-3 z-10 flex gap-2" style={{ position: "absolute", top: "12px", right: "12px", zIndex: 50 }}>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center justify-center p-2 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700/50 hover:bg-slate-800 text-slate-200 hover:text-white transition-all shadow-lg hover:scale-105 active:scale-95"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
          style={{ 
            width: "36px", 
            height: "36px", 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(51, 65, 85, 0.5)",
            borderRadius: "8px",
            color: "#e2e8f0",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
          }}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <iframe
        className="preview-frame w-full h-full border-none flex-grow"
        title={previewUrl ? "Live preview" : "Static preview"}
        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-scripts allow-same-origin allow-downloads allow-top-navigation allow-fullscreen"
        src={previewUrl || undefined}
        srcDoc={!previewUrl ? staticPreview : undefined}
        style={{ width: "100%", height: "100%", border: "none", background: "#ffffff" }}
      />
    </div>
  );
};
