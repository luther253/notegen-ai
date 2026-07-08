import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DefaultLayout() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#060810]">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/8 blur-[130px] pointer-events-none" />

      {/* Navigation */}
      <Navbar />

      {/* Page Content */}
      <main className="flex-grow z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
