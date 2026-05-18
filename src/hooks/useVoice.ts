import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { transcribeAudio } from "../services/asrService";
import { synthesizeSpeech } from "../services/ttsService";
import { useSettingsStore } from "../stores/settingsStore";

interface UseVoiceResult {
  recording: boolean;
  speakingMessageId: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  speak: (messageId: string, text: string) => Promise<void>;
  stopSpeaking: () => void;
}

export const useVoice = (onTranscript?: (text: string) => void): UseVoiceResult => {
  const { settings } = useSettingsStore();
  const [recording, setRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!settings.mimoApiKey?.trim()) {
      toast.error("Please add your MiMo API key in Settings");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        void transcribeAudio(blob, settings.mimoApiKey, settings.asrLanguage, settings.mimoBaseUrl)
          .then((text) => {
            if (!text) {
              toast.error("Could not understand audio, please try again");
              return;
            }
            onTranscript?.(text);
          })
          .catch((err) => toast.error(err instanceof Error ? err.message : "ASR failed"));
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      timeoutRef.current = window.setTimeout(stopRecording, settings.maxRecordingDuration * 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  }, [
    onTranscript,
    settings.asrLanguage,
    settings.maxRecordingDuration,
    settings.mimoApiKey,
    settings.mimoBaseUrl,
    stopRecording
  ]);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeakingMessageId(null);
  }, []);

  const speak = useCallback(
    async (messageId: string, text: string) => {
      if (!settings.mimoApiKey?.trim()) {
        toast.error("Please add your MiMo API key in Settings");
        return;
      }

      stopSpeaking();
      try {
        if (text.length > 4096) {
          toast.message("TTS will read the first 4096 characters");
        }
        const url = await synthesizeSpeech(text, settings.mimoApiKey, settings.ttsVoice, settings.mimoBaseUrl);
        const audio = new Audio(url);
        audioRef.current = audio;
        setSpeakingMessageId(messageId);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeakingMessageId(null);
        };
        await audio.play();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "TTS failed");
        setSpeakingMessageId(null);
      }
    },
    [settings.mimoApiKey, settings.mimoBaseUrl, settings.ttsVoice, stopSpeaking]
  );

  return {
    recording,
    speakingMessageId,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking
  };
};
