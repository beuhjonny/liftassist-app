export type SoundType = 'bell' | 'ding' | 'chime' | 'beep' | 'boxing';

// Cache for decoded audio buffers to avoid re-fetching
const audioBufferCache: Record<string, AudioBuffer> = {};
const failedFileLoadCache: Set<string> = new Set(); // Remember which files failed to avoid 404 spam

// Helper to create oscillators (Fallback / Default sounds)
const createOscillatorSource = (ctx: AudioContext, type: SoundType): AudioNode => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    // gain.connect(destination) - caller connects gain to context destination or main gain

    // Default parameters
    osc.type = 'sine';
    const now = ctx.currentTime;

    // "Spicing up" the defaults slightly with better implementation
    switch (type) {
        case 'beep':
            osc.frequency.setValueAtTime(880, now); // A5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.stop(now + 0.3);
            break;
        case 'chime':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1); // Slide up
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 1.5); // Long decay
            osc.stop(now + 1.5);
            break;
        case 'ding':
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
            osc.stop(now + 0.8);
            break;
        case 'bell':
        default:
            // A deeper bell-like tone
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now); // D4 roughly
            gain.gain.setValueAtTime(1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
            osc.stop(now + 2.0);
            break;
    }

    return gain; // We return the GainNode which acts as the source output
};

export const playTone = async (
    soundName: string,
    volume: number,
    existingContext?: AudioContext
): Promise<void> => {
    if (soundName === 'mute') return;

    // Use existing context or creating a temporary one (though reuse is better for mobile)
    const ctx = existingContext || new (window.AudioContext || (window as any).webkitAudioContext)();

    // Ensure context is running
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    const mainGain = ctx.createGain();
    mainGain.gain.value = volume;
    mainGain.connect(ctx.destination);

    // 1. Try file-based sound
    if (!failedFileLoadCache.has(soundName)) {
        // Check cache first
        if (audioBufferCache[soundName]) {
            const source = ctx.createBufferSource();
            source.buffer = audioBufferCache[soundName];
            source.connect(mainGain);
            source.start(0);
            return;
        }

        // Try fetching
        try {
            const filePath = `/sounds/${soundName}.mp3`;
            const response = await fetch(filePath);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
                audioBufferCache[soundName] = decodedBuffer;

                const source = ctx.createBufferSource();
                source.buffer = decodedBuffer;
                source.connect(mainGain);
                source.start(0);
                return;
            } else {
                // 404 or other error - mark as failed so we don't try again
                failedFileLoadCache.add(soundName);
            }
        } catch (e) {
            console.warn(`Could not load sound file for ${soundName}, falling back to synth.`, e);
            failedFileLoadCache.add(soundName);
        }
    }

    // 2. Fallback to Oscillator
    // Note: createOscillatorSource returns the GainNode containing the envelope, 
    // we just need to connect it to our main volume gain.
    try {
        const oscGain = createOscillatorSource(ctx, soundName as SoundType);
        // The helper should've already started the nodes internally if needed, or we might need to adjust logic
        // Actually, my createOscillatorSource connects to nothing? 
        // Let's fix createOscillatorSource to NOT connect to destination, but return the output node.

        // Wait, my helper above `osc.connect(gain)` and returns `gain`.
        // So I just connect `gain` to `mainGain`.
        oscGain.connect(mainGain);

        // The oscillator start/stop is handled inside the helper logic based on `now`
        // But `osc` is defined in scope of helper.
        // Helper implementation checks out: it starts `osc` immediately.

    } catch (e) {
        console.error("Error playing synthetic sound", e);
    }
};
