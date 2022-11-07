import { Route, Routes, useLocation } from "react-router-dom";

import Main from "./pages/MainPage";
import Add from "./pages/AddPage";
import Oauth from "./pages/OauthPage";
import React from "react";
import Log from "./pages/LogPage";
import MergeReady from "./pages/MergeReadyPage";
import Header from "./components/common/header/Header";
import SideBar from "./components/common/sidebar/SideBar";
import "./App.css";
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import Popper from 'popper.js';

function App() {
  const location = useLocation();

  return (
    <>
      <Header />
      <div className="App">
        <SideBar />
        <Routes location={location}>
          <Route path="/main" element={<Main />} />
          <Route path="/add" element={<Add />} />
          <Route path="/oauth" element={<Oauth />} />
          <Route path="/log" element={<Log />} />
          <Route path="/merge" element={<MergeReady />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
