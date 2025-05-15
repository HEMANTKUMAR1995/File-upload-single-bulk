import React, { useState } from "react";
import axios from "axios";

const DoctorFilter = () => {
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [viewUrl, setViewUrl] = useState(null); // For embedded viewer URL

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

      const response = await axios.get("http://localhost:5000/doctors", {
        params,
      });
      setDoctors(response.data);
      setViewUrl(null); // Reset viewer on new filter
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
      setViewUrl(data.sasUrl);
    } catch (err) {
      console.error("Failed to get SAS URL:", err);
    }
  };

  const handleCloseViewer = () => {
    setViewUrl(null);
  };

  return (
    <div className="p-6 max-w-full mx-auto text-white bg-gray-900 min-h-screen">
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

      <div className="flex gap-4">
        {/* Table container - takes full width or shrinks when viewer is open */}
        <div
          className={
            viewUrl ? "w-2/3 overflow-x-auto" : "w-full overflow-x-auto"
          }
        >
          {doctors.length > 0 ? (
            <table className="min-w-full table-auto text-left border-collapse border border-gray-700 rounded-lg">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3 border border-gray-600">Doctor ID</th>
                  <th className="p-3 border border-gray-600">Specialty</th>
                  <th className="p-3 border border-gray-600">Location</th>
                  <th className="p-3 border border-gray-600">Document Type</th>
                  <th className="p-3 border border-gray-600">Link</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc, index) => (
                  <tr key={index} className="border-b border-gray-600">
                    <td className="p-3 border border-gray-600">
                      {doc.doctorId}
                    </td>
                    <td className="p-3 border border-gray-600">
                      {doc.specialty}
                    </td>
                    <td className="p-3 border border-gray-600">
                      {doc.location}
                    </td>
                    <td className="p-3 border border-gray-600">
                      {doc.documentType}
                    </td>
                    <td className="p-3 border border-gray-600">
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
          ) : (
            <p>No documents found.</p>
          )}
        </div>

        {/* Viewer container - only visible when viewUrl is set */}
        {viewUrl && (
          <div className="w-1/3 bg-gray-800 rounded-lg p-2 border border-gray-700 relative">
            <button
              onClick={handleCloseViewer}
              className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
            >
              Close
            </button>
            <iframe
              src={viewUrl}
              title="Document Viewer"
              className="w-full h-[600px] rounded"
              frameBorder="0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorFilter;
