"use client"

import { useRef, useState } from "react"

interface SpeechRecognitionResultLike {
  transcript: string
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface VoiceInputProps {
  onTranscript: (transcript: string) => void
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null
  }
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

/**
 * Press-and-hold mic circle backed by the browser's Web Speech API, plus an
 * always-visible typed-text fallback — per CLAUDE.md §5, ASR is unreliable
 * (~20% word error rate expected) and rw-RW locale support in the Web
 * Speech API is unverified, so voice is never the only way in (§6: voice is
 * an accelerator, tap/type is primary). This is a throwaway spike per
 * CLAUDE.md §7 ("spike the ASR integration messily first"): it calls the
 * Web Speech API directly client-side, ahead of a more accurate server-side
 * Google STT integration that needs a credential not yet configured — see
 * ASSUMPTIONS.md for what still needs a real-browser manual check.
 *
 * Emits the raw transcript via onTranscript for either path — it does not
 * classify or validate the text itself, so the caller runs the same
 * classify.ts (and, on ambiguous matches, extract-llm.ts) pipeline
 * regardless of which input path produced the string.
 */
export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [typedText, setTypedText] = useState("")
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const supported = getRecognitionConstructor() !== null

  function startListening() {
    const Ctor = getRecognitionConstructor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = "rw-RW"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        onTranscript(transcript)
      }
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function handleTypedSubmit() {
    const trimmed = typedText.trim()
    if (!trimmed) return
    onTranscript(trimmed)
    setTypedText("")
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        disabled={!supported}
        aria-pressed={listening}
        aria-label="Hold to speak"
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={() => listening && stopListening()}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        className="flex h-32 w-32 items-center justify-center rounded-full bg-primary text-dark aria-pressed:animate-pulse aria-pressed:bg-heading disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="h-12 w-12" fill="currentColor" aria-hidden="true">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0h-2a5 5 0 0 1-10 0Z" />
          <rect x="11" y="18" width="2" height="4" />
        </svg>
      </button>

      {/* TODO: Kinyarwanda copy — "speak/hold" isn't in the verified word list yet (ASSUMPTIONS.md) */}
      {!supported && <p className="text-sm text-body">Voice input isn&apos;t supported here — type instead.</p>}

      <div className="flex w-full gap-2">
        <input
          type="text"
          value={typedText}
          onChange={(event) => setTypedText(event.target.value)}
          placeholder="Type instead"
          className="min-h-12 flex-1 rounded-lg bg-lighter p-3 text-heading"
        />
        <button
          type="button"
          onClick={handleTypedSubmit}
          className="min-h-12 rounded-lg bg-primary px-4 font-semibold text-dark"
        >
          Send
        </button>
      </div>
    </div>
  )
}
