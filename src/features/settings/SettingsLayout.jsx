import React from 'react';
import { Outlet } from 'react-router-dom';

export default function SettingsLayout() {
  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto pb-10">
      <Outlet />
    </div>
  );
}
