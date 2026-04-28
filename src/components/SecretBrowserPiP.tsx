import React, { useState, useRef } from 'react';
import { X, Settings, Monitor, Wifi, Bluetooth, Battery, Lock, Bell, Youtube, Instagram, ExternalLink } from 'lucide-react';

interface SecretBrowserPiPProps {
  onClose: () => void;
}

export default function SecretBrowserPiP({ onClose }: SecretBrowserPiPProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 650, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('general');

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('.no-drag')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    
    if (containerRef.current) {
       containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      let nextX = e.clientX - dragOffset.x;
      let nextY = e.clientY - dragOffset.y;
      
      // bounds
      nextX = Math.max(0, Math.min(nextX, window.innerWidth - 100));
      nextY = Math.max(0, Math.min(nextY, window.innerHeight - 50));
      
      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (containerRef.current) {
       containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const openStealthPopup = (url: string) => {
    window.open(
      url,
      'StealthWindow_' + Math.random(),
      'width=400,height=700,menubar=no,toolbar=no,location=no,status=no,personalbar=no,scrollbars=yes,resizable=yes'
    );
  };

  const tabs = [
    { id: 'network', icon: <Wifi className="w-4 h-4" />, label: 'Wi-Fi' },
    { id: 'bluetooth', icon: <Bluetooth className="w-4 h-4" />, label: 'Bluetooth' },
    { id: 'notifications', icon: <Bell className="w-4 h-4" />, label: 'Notifications' },
    { id: 'general', icon: <Settings className="w-4 h-4" />, label: 'General' },
    { id: 'appearance', icon: <Monitor className="w-4 h-4" />, label: 'Appearance' },
    { id: 'privacy', icon: <Lock className="w-4 h-4" />, label: 'Privacy & Security' },
    { id: 'battery', icon: <Battery className="w-4 h-4" />, label: 'Battery' },
  ];

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        touchAction: 'none'
      }}
      className="bg-gray-100 rounded-xl shadow-2xl border border-gray-300 w-[600px] h-[450px] flex overflow-hidden font-sans group select-none"
    >
        {/* Sidebar */}
        <div className="w-[200px] bg-gray-100/80 backdrop-blur border-r border-gray-200 flex flex-col h-full cursor-move relative">
            <div className="h-12 flex items-center px-4 gap-2 no-drag">
                <div className="flex gap-1.5">
                    <button onPointerDown={(e) => { e.stopPropagation(); onClose(); }} className="w-3 h-3 rounded-full bg-red-400 border border-red-500/50 cursor-pointer hover:bg-red-500 transition-colors flex items-center justify-center group/btn pointer-events-auto">
                        <X className="w-2 h-2 text-red-900 opacity-0 group-hover/btn:opacity-100 pointer-events-none" />
                    </button>
                    <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500/50"></div>
                </div>
            </div>
            
            <div className="px-2 py-2 flex flex-col gap-0.5 mt-2 no-drag flex-1 overflow-y-auto">
                <div className="text-xs font-bold text-gray-500 px-2 py-1 mb-1">System Settings</div>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeTab === tab.id ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                        <div className={`p-1 rounded ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'} flex-shrink-0`}>
                            {tab.icon}
                        </div>
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white h-full flex flex-col cursor-auto relative no-drag">
           <div className="h-12 border-b border-gray-100 flex items-center justify-between px-6 font-bold text-gray-800">
               <span>{tabs.find(t => t.id === activeTab)?.label || 'Settings'}</span>
               <button onPointerDown={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
                   <X className="w-4 h-4" />
               </button>
           </div>
           
           <div className="flex-1 p-8 overflow-y-auto">
              <div className="flex flex-col items-center mb-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-inner">
                      {tabs.find(t => t.id === activeTab)?.icon}
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800">{tabs.find(t => t.id === activeTab)?.label} Settings</h2>
                  <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">Configure system preferences, system diagnostics and advanced hardware telemetry configurations.</p>
              </div>

              {activeTab === 'general' && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                          <div>
                              <div className="font-medium text-sm text-gray-800">System Telemetry Log</div>
                              <div className="text-xs text-gray-400">View detailed system logs in standard viewer</div>
                          </div>
                          <div className="text-xs text-gray-400">v1.2.4</div>
                      </div>
                      
                      {/* Social Media Hidden Links */}
                      <button 
                        onClick={() => openStealthPopup('https://www.instagram.com/')}
                        className="px-4 py-3 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 hover:opacity-100 opacity-60 transition-all text-left group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[1px] opacity-20 group-hover:opacity-100 transition-opacity">
                                  <div className="w-full h-full bg-white rounded-[3px] flex items-center justify-center">
                                      <Instagram className="w-4 h-4 text-pink-600" />
                                  </div>
                              </div>
                              <div>
                                  <div className="font-medium text-sm text-gray-700 group-hover:text-pink-600 transition-colors">Visual Process Check</div>
                                  <div className="text-xs text-gray-400 group-hover:text-gray-500">instagram.com connection test</div>
                              </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-pink-500" />
                      </button>

                      <button 
                        onClick={() => openStealthPopup('https://www.youtube.com/')}
                        className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 hover:opacity-100 opacity-60 transition-all text-left group"
                      >
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                                  <Youtube className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                  <div className="font-medium text-sm text-gray-700 group-hover:text-red-600 transition-colors">Media Stream Diagnostic</div>
                                  <div className="text-xs text-gray-400 group-hover:text-gray-500">youtube.com media throughput</div>
                              </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-red-500" />
                      </button>
                  </div>
              )}
              
              {activeTab !== 'general' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg h-32 flex flex-col items-center justify-center text-gray-400 text-sm">
                      <Settings className="w-6 h-6 mb-2 opacity-50" />
                      No configurable options available
                  </div>
              )}
           </div>
        </div>
    </div>
  );
}

