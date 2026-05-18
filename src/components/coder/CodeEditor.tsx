import Editor from "@monaco-editor/react";
import type { CoderFile, ThemePreference } from "../../types";
import { useSessionStore } from "../../stores/sessionStore";
import { useParams } from "react-router-dom";

interface CodeEditorProps {
  file: CoderFile | null;
  theme: ThemePreference;
}

export const CodeEditor = ({ file, theme }: CodeEditorProps) => {
  const { sessionId } = useParams();
  const updateCoderFile = useSessionStore((state) => state.updateCoderFile);

  if (!file) {
    return (
      <div className="coder-placeholder">
        <strong>Describe what you want to build...</strong>
        <span>The generated project opens here. You can edit the code directly!</span>
      </div>
    );
  }

  const handleEditorChange = (value: string | undefined) => {
    if (sessionId && file && value !== undefined) {
      updateCoderFile(sessionId, file.path, value);
    }
  };

  return (
    <Editor
      key={file.path}
      language={file.language}
      value={file.content}
      onChange={handleEditorChange}
      theme={theme === "light" ? "light" : "vs-dark"}
      options={{
        readOnly: false,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        wordWrap: "on",
        scrollBeyondLastLine: false
      }}
    />
  );
};
