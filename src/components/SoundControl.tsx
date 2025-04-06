import { useState, useEffect } from "react";
import {
  getSoundSettings,
  saveSoundSettings,
  toggleMute,
} from "@/lib/soundUtils";

export default function SoundControl() {
  const [settings, setSettings] = useState(getSoundSettings());
  const [showControls, setShowControls] = useState(false);

  // Ensure we load the settings on component mount
  useEffect(() => {
    const currentSettings = getSoundSettings();
    setSettings(currentSettings);
  }, []);

  // Save settings when they change
  const updateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    saveSoundSettings(newSettings);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    const isMuted = toggleMute();
    setSettings({ ...settings, muted: isMuted });
  };

  return (
    <div className="relative">
      {/* Sound icon button - show the appropriate icon based on mute state */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
        aria-label="Sound settings"
        title="Sound settings"
      >
        {settings.muted ? (
          // Muted icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
          </svg>
        ) : (
          // Unmuted icon (default)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.44 12l-1.72-1.72a.75.75 0 00-1.06 1.06l1.72 1.72-1.72 1.72a.75.75 0 101.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06l-1.72-1.72 1.72-1.72a.75.75 0 10-1.06-1.06l-1.72 1.72z" />
          </svg>
        )}
      </button>

      {/* Sound control panel */}
      {showControls && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Sound Settings</h3>
            <button
              onClick={handleMuteToggle}
              className={`px-3 py-1 rounded-md text-sm ${
                settings.muted ? "bg-gray-700" : "bg-blue-600"
              }`}
            >
              {settings.muted ? "Unmute" : "Mute"}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Master Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.masterVolume}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    masterVolume: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Music Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.musicVolume}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    musicVolume: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Effects Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.sfxVolume}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    sfxVolume: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
