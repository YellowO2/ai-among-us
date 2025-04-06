// Simplified sound utility functions for game audio

// Sound types - reduced to essential sounds
type SoundType = "background" | "click" | "win" | "lose";

// Map of sound types to their file paths with recommended free sounds
const SOUNDS: Record<SoundType, string> = {
  // Background music: Upbeat 8-bit style game loop
  // Source: https://pixabay.com/music/video-games-8-bit-dreamscape-142093/
  background: "/sounds/background-loop.mp3",

  // Click: UI click sound for buttons
  // Source: https://mixkit.co/free-sound-effects/click/
  click: "/sounds/click.mp3",

  // Win: Victory fanfare
  // Source: https://pixabay.com/sound-effects/success-fanfare-trumpets-6185/
  win: "/sounds/win.mp3",

  // Lose: Game over sound
  // Source: https://pixabay.com/sound-effects/negative-beeps-6008/
  lose: "/sounds/lose.mp3",
};

// Sound instances cache
const soundInstances: Record<string, HTMLAudioElement> = {};

// Sound settings (persisted in localStorage)
const DEFAULT_SETTINGS = {
  masterVolume: 0.5,
  musicVolume: 0.1,
  sfxVolume: 0.8,
  muted: false, // Already set to false by default, keeping it here for clarity
};

// Load settings from localStorage or use defaults
export const getSoundSettings = () => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  const savedSettings = localStorage.getItem("sound-settings");
  return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
};

// Save settings to localStorage
export const saveSoundSettings = (settings: typeof DEFAULT_SETTINGS) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("sound-settings", JSON.stringify(settings));

  // Apply settings to existing instances
  Object.values(soundInstances).forEach((audio) => {
    audio.volume = settings.muted
      ? 0
      : audio.dataset.type === "background"
      ? settings.masterVolume * settings.musicVolume
      : settings.masterVolume * settings.sfxVolume;
  });
};

// Play a sound effect
export const playSound = (
  type: SoundType,
  loop = false
): HTMLAudioElement | undefined => {
  if (typeof window === "undefined") return;

  try {
    const settings = getSoundSettings();
    if (settings.muted && type !== "background") return;

    // Create or get sound instance
    let sound = soundInstances[type];
    if (!sound) {
      sound = new Audio(SOUNDS[type]);
      sound.dataset.type = type;
      soundInstances[type] = sound;
    }

    // Set volume based on type and settings
    const volume =
      type === "background"
        ? settings.masterVolume * settings.musicVolume
        : settings.masterVolume * settings.sfxVolume;

    sound.volume = settings.muted ? 0 : volume;
    sound.loop = loop;

    // Reset sound if it's already playing
    if (!sound.paused) {
      sound.currentTime = 0;
    } else {
      sound.play().catch((err) => console.error("Failed to play sound:", err));
    }

    return sound;
  } catch (error) {
    console.error("Error playing sound:", error);
    return;
  }
};

// Stop a specific sound
export const stopSound = (type: SoundType) => {
  const sound = soundInstances[type];
  if (sound) {
    sound.pause();
    sound.currentTime = 0;
  }
};

// Play background music (loops and persists)
let bgMusic: HTMLAudioElement | undefined;
let bgMusicInitialized = false;

export const playBackgroundMusic = () => {
  // Check if background music is already initialized
  if (bgMusicInitialized) return;

  // Mark as initialized to prevent multiple instances
  bgMusicInitialized = true;

  const settings = getSoundSettings();
  if (!settings.muted) {
    try {
      bgMusic = new Audio(SOUNDS.background);
      bgMusic.loop = true;
      bgMusic.setAttribute("data-type", "background");
      bgMusic.volume = settings.masterVolume * settings.musicVolume;

      // Store in instances cache
      soundInstances.background = bgMusic;

      // Play and handle any errors
      bgMusic.play().catch((err) => {
        console.error("Failed to play background music:", err);
        bgMusicInitialized = false; // Reset flag if playback fails
      });
    } catch (error) {
      console.error("Error setting up background music:", error);
      bgMusicInitialized = false;
    }
  }
};

// Stop background music
export const stopBackgroundMusic = () => {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
    bgMusicInitialized = false;
  }
};

// Toggle mute for all sounds
export const toggleMute = () => {
  const settings = getSoundSettings();
  settings.muted = !settings.muted;
  saveSoundSettings(settings);

  // Handle background music specifically when toggling mute
  if (bgMusic) {
    if (settings.muted) {
      bgMusic.volume = 0;
    } else {
      bgMusic.volume = settings.masterVolume * settings.musicVolume;

      // If background music was initialized but paused, restart it
      if (bgMusicInitialized && bgMusic.paused) {
        bgMusic
          .play()
          .catch((err) =>
            console.error("Failed to resume background music:", err)
          );
      }
    }
  }

  // Handle other sound instances
  Object.values(soundInstances).forEach((audio) => {
    if (audio.dataset.type !== "background") {
      audio.volume = settings.muted
        ? 0
        : audio.dataset.type === "background"
        ? settings.masterVolume * settings.musicVolume
        : settings.masterVolume * settings.sfxVolume;
    }
  });

  return settings.muted;
};

// Add debug function to test sound loading
export const testSoundLoading = () => {
  if (typeof window === "undefined") return;

  Object.entries(SOUNDS).forEach(([type, path]) => {
    console.log(`Testing sound: ${type} at path: ${path}`);
    fetch(path)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log(`✅ Sound file found at ${path}`);
        return response.blob();
      })
      .catch((error) => {
        console.error(
          `❌ Sound file error for ${type}: ${error}. Check that file exists at public${path}`
        );
      });
  });
};
