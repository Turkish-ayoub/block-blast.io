import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getMuted, setMuted } from '../utils/audio';

export default function SoundToggle() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(getMuted());
  }, []);

  const toggleSound = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    setMutedState(nextMute);
  };

  return (
    <button
      id="sound-toggle-btn"
      onClick={toggleSound}
      className="p-2 rounded-lg bg-slate-800/60 border border-white/10 hover:bg-slate-700/80 hover:border-white/20 transition-all text-slate-300 hover:text-white shadow-md cursor-pointer flex items-center justify-center"
      title={muted ? "Unmute Sound" : "Mute Sound"}
    >
      {muted ? (
        <VolumeX className="w-5 h-5 text-red-400" />
      ) : (
        <Volume2 className="w-5 h-5 text-emerald-400" />
      )}
    </button>
  );
}
