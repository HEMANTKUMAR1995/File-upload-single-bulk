import React, { useState } from "react";
import axios from "axios";

const DoctorFilter = () => {
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [viewUrl, setViewUrl] = useState(""); // SAS URL for embedded view
  const [viewFileName, setViewFileName] = useState(""); // To show filename in viewer

  const specialties = [
    "cardiology",
    "dermatology",
    "pediatrics",
    "neurology",
    "ortho",
    "neuro",
    "heart",
  ];
  const locations = ["new-york", "california", "texas", "florida", "illinois"];

  const handleFilter = async () => {
    try {
      const params = {};
      if (specialty) params.specialty = specialty.trim().toLowerCase();
      if (location) params.location = location.trim().toLowerCase();

      console.log("Sending filter:", params);
      const response = await axios.get("http://localhost:5000/doctors", {
        params,
      });
      console.log("Received data:", response.data);
      setDoctors(response.data);
      setViewUrl(""); // Clear viewer when filter changes
      setViewFileName("");
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const handleViewFile = async (doc) => {
    try {
      const { data } = await axios.get("http://localhost:5000/get-url", {
        params: {
          location: doc.location,
          doctorId: doc.doctorId,
          documentType: doc.documentType,
          fileName: decodeURIComponent(doc.blobUrl.split("/").pop()),
        },
      });

      // Check if file is PDF for embedding, otherwise fallback
      if (data.sasUrl.toLowerCase().endsWith(".pdf")) {
        setViewUrl(data.sasUrl);
        setViewFileName(decodeURIComponent(doc.blobUrl.split("/").pop()));
      } else {
        // For non-PDF, just open in new tab or force download
        window.open(data.sasUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to get SAS URL:", err);
    }
  };

  const closeViewer = () => {
    setViewUrl("");
    setViewFileName("");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">Filter Doctors</h2>

      <div className="flex gap-4 mb-4">
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
        >
          <option value="">Select Specialty</option>
          {specialties.map((spec) => (
            <option key={spec} value={spec.toLowerCase()}>
              {spec}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
        >
          <option value="">Select Location</option>
          {locations.map((loc) => (
            <option key={loc} value={loc.toLowerCase()}>
              {loc}
            </option>
          ))}
        </select>

        <button
          onClick={handleFilter}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Filter
        </button>
      </div>

      {doctors.length > 0 && (
        <div className="overflow-x-auto bg-gray-900 p-4 rounded-lg">
          <table className="min-w-full table-auto text-left">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2">Doctor ID</th>
                <th className="p-2">Specialty</th>
                <th className="p-2">Location</th>
                <th className="p-2">Document Type</th>
                <th className="p-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc, index) => (
                <tr key={index} className="border-b border-gray-600">
                  <td className="p-2">{doc.doctorId}</td>
                  <td className="p-2">{doc.specialty}</td>
                  <td className="p-2">{doc.location}</td>
                  <td className="p-2">{doc.documentType}</td>
                  <td className="p-2">
                    <button
                      className="text-blue-400 underline"
                      onClick={() => handleViewFile(doc)}
                    >
                      View File
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Embedded PDF Viewer */}
      {viewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl bg-gray-800 rounded-lg overflow-hidden relative">
            <div className="flex justify-between items-center bg-gray-900 p-3">
              <h3 className="text-white font-semibold truncate max-w-xl">
                Viewing: {viewFileName}
              </h3>
              <button
                onClick={closeViewer}
                className="text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              >
                Close
              </button>
            </div>
            <iframe
              src={viewUrl}
              title="Document Viewer"
              className="w-full h-[80vh]"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorFilter;
