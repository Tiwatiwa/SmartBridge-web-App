import React, { useState, useEffect } from "react";
import { StorageFile } from "../types";
import { apiFetch } from "../utils/api";
import { UploadCloud, FileText, Trash2, Calendar, HardDrive, AlertCircle } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../utils/firebase";

export default function FileUploadSection() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/files");
      setFiles(res.files || []);
    } catch (err: any) {
      setError("Failed to retrieve uploaded files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      // 1. Create unique storage reference for file
      const uniqueFileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `uploads/${uniqueFileName}`);

      // 2. Upload raw file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file);

      // 3. Obtain secure download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 4. Register file details to backend JSON DB
      await apiFetch("/api/files/upload", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          filePath: downloadURL,
          fileSize: file.size
        })
      });

      fetchFiles();
    } catch (err: any) {
      setError(err.message || "File upload to Firebase Storage failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file permanently?")) return;
    try {
      await apiFetch(`/api/files/${fileId}`, {
        method: "DELETE"
      });
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      setError("Failed to delete the selected file.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8" id="file_upload_section">
      {/* Tab/Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Business File Manager</h2>
        <p className="text-zinc-600 mt-1">
          Upload certificates, store permits, business inventories, or custom product photos safely.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm" id="upload_error_bar">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Upload Stage Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition relative ${
          dragActive
            ? "border-blue-600 bg-blue-50/50"
            : "border-zinc-200 bg-white hover:border-zinc-300"
        }`}
        id="drag_drop_container"
      >
        <input
          type="file"
          id="file_input"
          className="hidden"
          onChange={handleFileInput}
          disabled={uploading}
        />
        <label
          htmlFor="file_input"
          className="cursor-pointer flex flex-col items-center group"
          id="file_input_label"
        >
          <div className="p-4 bg-zinc-100 rounded-full text-zinc-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition mb-4">
            <UploadCloud className="w-10 h-10" />
          </div>
          <span className="text-lg font-semibold text-zinc-800 group-hover:text-blue-600 transition">
            {uploading ? "Uploading files, please wait..." : "Drag and drop your file here"}
          </span>
          <span className="text-xs text-zinc-500 mt-1">
            or click to browse files from your computer (Max 10MB)
          </span>
        </label>
      </div>

      {/* Uploaded Files Table list */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden" id="uploaded_files_card">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900">All Files ({files.length})</h3>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500" id="files_loading_state">
            Retrieving file storage listings...
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2" id="files_empty_state">
            <FileText className="w-12 h-12 mx-auto text-zinc-300 mb-2" />
            <p className="font-medium text-zinc-700">No documents or files uploaded yet</p>
            <p className="text-xs text-zinc-500">Items uploaded in this area will automatically sync with your merchant inventory selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" id="files_table_wrapper">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Upload Date</th>
                  <th className="px-6 py-4">Reference URL</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-zinc-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-zinc-800 truncate max-w-xs" title={file.fileName}>
                          {file.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-mono text-xs tabular-nums">
                      {formatBytes(file.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={file.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-blue-600 hover:underline hover:text-blue-700 truncate block max-w-xs"
                      >
                        {file.filePath}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
