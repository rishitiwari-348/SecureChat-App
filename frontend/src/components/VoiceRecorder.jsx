import { useCallback, useEffect, useRef, useState } from "react";
import { MicIcon, PauseIcon, PlayIcon, SquareIcon, Trash2Icon, UploadIcon } from "lucide-react";

const MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm",
];

const formatDuration = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

function VoiceRecorder({ onComplete, onCancel, onRecordingStart, onRecordingStop }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const audioUrlRef = useRef(null);
  const cancelledRef = useRef(false);
  const sessionRef = useRef(0);
  const activityStartedRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recording, setRecording] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const notifyRecordingStart = useCallback(() => {
    if (activityStartedRef.current) return;
    activityStartedRef.current = true;
    onRecordingStart?.();
  }, [onRecordingStart]);

  const notifyRecordingStop = useCallback(() => {
    if (!activityStartedRef.current) return;
    activityStartedRef.current = false;
    onRecordingStop?.();
  }, [onRecordingStop]);

  useEffect(() => {
    let mounted = true;
    const sessionId = ++sessionRef.current;

    const startRecording = async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("Voice recording is not supported by this browser.");
        return;
      }

      const mimeType = MIME_TYPE_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        setError("This browser does not support a compatible voice format.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        streamRef.current = stream;
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        cancelledRef.current = false;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onerror = () => {
          notifyRecordingStop();
          if (sessionRef.current === sessionId) setError("Recording failed. Please try again.");
        };
        recorder.onstop = () => {
          notifyRecordingStop();
          if (sessionRef.current !== sessionId) return;
          stopTracks();
          if (cancelledRef.current) return;
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          if (!blob.size) {
            setError("The recording was empty. Please record again.");
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          audioUrlRef.current = previewUrl;
          setRecording({ blob, mimeType: recorder.mimeType.split(";")[0], previewUrl });
        };

        recorder.start(250);
        notifyRecordingStart();
        setIsRecording(true);
        setError("");
        intervalRef.current = window.setInterval(() => setDuration((value) => value + 1), 1000);
      } catch (recordingError) {
        setError(recordingError?.name === "NotAllowedError" ? "Microphone permission was denied." : "Unable to access the microphone.");
        stopTracks();
      }
    };

    startRecording();
    return () => {
      mounted = false;
      if (sessionRef.current === sessionId) sessionRef.current += 1;
      cancelledRef.current = true;
      notifyRecordingStop();
      window.clearInterval(intervalRef.current);
      if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
      stopTracks();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, [notifyRecordingStart, notifyRecordingStop, stopTracks]);

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "inactive") return;
    mediaRecorderRef.current?.stop();
    notifyRecordingStop();
    window.clearInterval(intervalRef.current);
    setIsRecording(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.pause();
      notifyRecordingStop();
      window.clearInterval(intervalRef.current);
      setIsPaused(true);
    } else if (recorder?.state === "paused") {
      recorder.resume();
      notifyRecordingStart();
      intervalRef.current = window.setInterval(() => setDuration((value) => value + 1), 1000);
      setIsPaused(false);
    }
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    notifyRecordingStop();
    window.clearInterval(intervalRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    stopTracks();
    onCancel();
  };

  const useRecording = () => {
    if (!recording?.blob.size || duration <= 0) {
      setError("The recording is too short to send.");
      return;
    }
    onComplete({ ...recording, duration });
  };

  return (
    <div className="mb-3 rounded-[1.25rem] border border-white/[0.08] bg-white/[0.04] p-3">
      {error ? <p className="mb-2 text-sm text-rose-300" role="alert">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <MicIcon className={`size-4 ${isRecording && !isPaused ? "animate-pulse text-rose-300" : ""}`} />
          <span>{formatDuration(duration)}</span>
        </div>

        {isRecording ? (
          <>
            <button type="button" onClick={stopRecording} className="rounded-xl bg-slate-800 p-2 text-white" aria-label="Stop recording"><SquareIcon className="size-4" /></button>
            <button type="button" onClick={togglePause} className="rounded-xl bg-slate-800 p-2 text-white" aria-label={isPaused ? "Resume recording" : "Pause recording"}>{isPaused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}</button>
          </>
        ) : null}

        {recording ? (
          <>
            <audio controls preload="metadata" className="h-9 min-w-48 flex-1" src={recording.previewUrl} />
            <button type="button" onClick={useRecording} className="rounded-xl bg-cyan-500/90 p-2 text-white" aria-label="Use voice recording"><UploadIcon className="size-4" /></button>
          </>
        ) : null}

        <button type="button" onClick={cancelRecording} className="rounded-xl bg-slate-800 p-2 text-white" aria-label="Cancel voice recording"><Trash2Icon className="size-4" /></button>
      </div>
    </div>
  );
}

export default VoiceRecorder;
