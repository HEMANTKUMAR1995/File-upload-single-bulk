import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import DragDropModal from "./components/DragDropModal";
import DoctorFilter from "./components/DocotorFilter";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <DragDropModal />
        <div className="bg-gray-950 min-h-screen text-white">
          <h1 className="text-3xl font-bold text-center p-6">
            Doctor File Uploader
          </h1>
          <DoctorFilter />
        </div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
