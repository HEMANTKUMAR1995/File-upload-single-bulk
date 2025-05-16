import { useDropzone } from "react-dropzone";
import { useState } from "react";
import axios from "axios";

export default function FileUploader() {
  const [filesData, setFilesData] = useState([]);

  const onDrop = async (acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      progress: 0,
      type: "",
      confidence: "",
      isClassified: false,
    }));

    setFilesData((prev) => [...prev, ...newFiles]);

    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded / e.total) * 50);
            setFilesData((prev) =>
              prev.map((file) => ({
                ...file,
                progress: percent,
              }))
            );
          },
        }
      );

      const classifiedFiles = response.data.results;

      setFilesData((prev) =>
        prev.map((file) => {
          const matched = classifiedFiles.find(
            (cf) => cf.originalName === file.name
          );
          return matched
            ? {
                ...file,
                progress: 100,
                type: matched.classification.type,
                confidence: matched.classification.confidence,
                isClassified: true,
              }
            : file;
        })
      );
    } catch (err) {
      console.error("Error uploading/classifying files", err);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
  });

  const allClassified =
    filesData.length > 0 && filesData.every((f) => f.isClassified);

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded-md shadow bg-white">
      <h2 className="text-xl font-semibold mb-4">
        Upload Professional Documents
      </h2>

      <div
        {...getRootProps()}
        className="p-6 border-dashed border-2 text-center rounded cursor-pointer"
      >
        <input {...getInputProps()} />
        <p>Drag and drop files here</p>
        <p className="text-sm text-gray-400 mt-1">
          Accepted file types: .jpg, .pdf, .tiff, .doc, .svg
        </p>
        <button className="mt-2 text-blue-500 underline">
          Choose from Files
        </button>
      </div>

      {/* {filesData.map((file, idx) => (
        <div key={idx} className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-1">
            <span>
              {file.name} - {file.size}
            </span>
            <span>{file.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${file.progress}%` }}
            ></div>
          </div>

          {file.isClassified && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">
                * Document Type
              </label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded p-2"
                value={`${file.type} (${file.confidence})`}
                readOnly
              />
            </div>
          )}
        </div>
      ))} */}
      {filesData.map((file, idx) => (
        <div
          key={idx}
          className="flex items-start gap-4 mt-6 border-t pt-4 relative"
        >
          {/* Remove Button */}
          <button
            onClick={() =>
              setFilesData((prev) => prev.filter((_, i) => i !== idx))
            }
          >
            X
          </button>

          {/* File Info & Progress */}
          <div className="flex-1 pl-6">
            <div className="flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <span role="img" aria-label="file">
                  📄
                </span>
                <span className="text-gray-800">{file.name}</span>
                <span className="text-gray-500">- {file.size}</span>
              </div>
              <span>{file.progress}%</span>
            </div>
            <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${file.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Document Type */}
          {file.isClassified && (
            <div className="w-1/3 ml-4">
              <label className="block text-sm font-medium text-gray-700">
                <span className="text-red-500">*</span> Select Document Type
              </label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded p-2 text-sm"
                value={file.type}
                readOnly
              />
            </div>
          )}
        </div>
      ))}

      <button
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
        disabled={!allClassified}
        onClick={() => alert("Continue to next step")}
      >
        Continue
      </button>
    </div>
  );
}
