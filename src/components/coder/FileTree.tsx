import { FileCode2, Folder } from "lucide-react";
import type { CoderFile } from "../../types";

interface FileTreeProps {
  files: CoderFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export const FileTree = ({ files, selectedPath, onSelect }: FileTreeProps) => {
  if (files.length === 0) {
    return <div className="coder-empty">Files will appear here</div>;
  }

  const folders = new Set(files.map((file) => file.path.split("/").slice(0, -1).join("/")).filter(Boolean));

  return (
    <div className="file-tree">
      {[...folders].map((folder) => (
        <div key={folder} className="file-tree__folder">
          <Folder size={15} />
          {folder}
        </div>
      ))}
      {files.map((file) => (
        <button
          key={file.path}
          type="button"
          className={selectedPath === file.path ? "active" : ""}
          onClick={() => onSelect(file.path)}
        >
          <FileCode2 size={15} />
          <span>{file.path}</span>
        </button>
      ))}
    </div>
  );
};
