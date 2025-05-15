import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

const UploadMode = {
  SINGLE: "single",
  BULK: "bulk",
};

const specialties = [
  "cardiology",
  "dermatology",
  "neurology",
  "pediatrics",
  "radiology",
];

const locations = ["new york", "california", "texas", "florida", "illinois"];

const documentTypes = ["type1", "type2", "type3", "type4", "type5"];

const DragDropModal = () => {
  const [mode, setMode] = useState(null);
  const [files, setFiles] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  // Instead of one documentType, track a documentType per file:
  const [fileDocumentTypes, setFileDocumentTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onDrop = (acceptedFiles) => {
    setFiles(acceptedFiles);
    // Initialize each new file with empty document type selection
    setFileDocumentTypes(new Array(acceptedFiles.length).fill(""));
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleDocumentTypeChange = (index, value) => {
    const updatedTypes = [...fileDocumentTypes];
    updatedTypes[index] = value;
    setFileDocumentTypes(updatedTypes);
  };

  const handleUpload = async () => {
    if (!files.length || !doctorId || !specialty || !location) {
      alert("Please fill all fields and upload files.");
      return;
    }

    // Ensure each file has a documentType selected
    for (let i = 0; i < fileDocumentTypes.length; i++) {
      if (!fileDocumentTypes[i]) {
        alert(`Please select document type for file: ${files[i].name}`);
        return;
      }
    }

    try {
      const uploads = files.map((file, idx) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("doctorId", doctorId);
        formData.append("specialty", specialty);
        formData.append(
          "location",
          location.toLowerCase().replace(/\s+/g, "-")
        );
        formData.append("documentType", fileDocumentTypes[idx]);

        return axios.post("http://localhost:5000/upload", formData);
      });

      await Promise.all(uploads);
      alert("Files uploaded successfully!");
      setFiles([]);
      setFileDocumentTypes([]);
      setIsModalOpen(false);
      setDoctorId("");
      setSpecialty("");
      setLocation("");
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
    }
  };

  const openModal = (uploadMode) => {
    setMode(uploadMode);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Doctor File Uploader</h1>

      <div className="flex gap-4">
        <button
          onClick={() => openModal(UploadMode.SINGLE)}
          className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-800"
        >
          Single Upload
        </button>
        <button
          onClick={() => openModal(UploadMode.BULK)}
          className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-800"
        >
          Bulk Upload
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-lg shadow-lg p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-lg"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">
              {mode === UploadMode.SINGLE ? "Single Upload" : "Bulk Upload"}
            </h2>

            <div className="space-y-2 mb-4">
              <input
                type="text"
                placeholder="Doctor ID"
                className="w-full p-2 border rounded"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              />

              <select
                className="w-full p-2 border rounded"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">Select Specialty</option>
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec.charAt(0).toUpperCase() + spec.slice(1)}
                  </option>
                ))}
              </select>

              <select
                className="w-full p-2 border rounded"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc.charAt(0).toUpperCase() + loc.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div
              {...getRootProps()}
              className="border-dashed border-2 p-8 rounded text-center cursor-pointer text-gray-600 mb-4"
            >
              <input {...getInputProps()} />
              <p>
                Drag & drop{" "}
                {mode === UploadMode.SINGLE ? "a file" : "multiple files"} here
              </p>
            </div>

            <ul className="mb-4 text-sm text-gray-700 max-h-40 overflow-y-auto">
              {files.map((file, idx) => (
                <li key={idx} className="mb-2 flex items-center gap-4">
                  <span>{file.name}</span>
                  <select
                    className="p-1 border rounded text-black"
                    value={fileDocumentTypes[idx] || ""}
                    onChange={(e) =>
                      handleDocumentTypeChange(idx, e.target.value)
                    }
                  >
                    <option value="">Select Document Type</option>
                    {documentTypes.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt.charAt(0).toUpperCase() + dt.slice(1)}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpload}
              className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700"
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropModal;
