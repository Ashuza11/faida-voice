import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import VoiceInput from "@/components/VoiceInput"

class FakeSpeechRecognition {
  lang = ""
  interimResults = false
  maxAlternatives = 1
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null
  onerror: (() => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
}

function installCapturingRecognition(): FakeSpeechRecognition[] {
  const instances: FakeSpeechRecognition[] = []
  class CapturingRecognition extends FakeSpeechRecognition {
    constructor() {
      super()
      instances.push(this)
    }
  }
  window.SpeechRecognition = CapturingRecognition as unknown as typeof window.SpeechRecognition
  return instances
}

afterEach(() => {
  delete window.SpeechRecognition
  vi.restoreAllMocks()
})

describe("VoiceInput — unsupported browser", () => {
  it("disables the mic button and shows a fallback notice when Web Speech API is unavailable", () => {
    render(<VoiceInput onTranscript={vi.fn()} />)

    expect(screen.getByRole("button", { name: /hold to speak/i })).toBeDisabled()
    expect(screen.getByText(/voice input isn't supported/i)).toBeInTheDocument()
  })

  it("still submits typed text even without voice support", async () => {
    const onTranscript = vi.fn()
    const user = userEvent.setup()
    render(<VoiceInput onTranscript={onTranscript} />)

    await user.type(screen.getByPlaceholderText(/type instead/i), "umugati kabiri")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onTranscript).toHaveBeenCalledWith("umugati kabiri")
  })

  it("does not submit empty or whitespace-only typed text", async () => {
    const onTranscript = vi.fn()
    const user = userEvent.setup()
    render(<VoiceInput onTranscript={onTranscript} />)

    await user.type(screen.getByPlaceholderText(/type instead/i), "   ")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(onTranscript).not.toHaveBeenCalled()
  })

  it("clears the typed field after a successful submit", async () => {
    const user = userEvent.setup()
    render(<VoiceInput onTranscript={vi.fn()} />)

    const input = screen.getByPlaceholderText(/type instead/i)
    await user.type(input, "amandazi")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(input).toHaveValue("")
  })
})

describe("VoiceInput — supported browser", () => {
  it("reflects listening state on press and release", () => {
    installCapturingRecognition()
    render(<VoiceInput onTranscript={vi.fn()} />)
    const button = screen.getByRole("button", { name: /hold to speak/i })
    expect(button).not.toBeDisabled()

    fireEvent.mouseDown(button)
    expect(button).toHaveAttribute("aria-pressed", "true")

    fireEvent.mouseUp(button)
    expect(button).toHaveAttribute("aria-pressed", "false")
  })

  it("calls start() and stop() on the recognition instance", () => {
    const instances = installCapturingRecognition()
    render(<VoiceInput onTranscript={vi.fn()} />)
    const button = screen.getByRole("button", { name: /hold to speak/i })

    fireEvent.mouseDown(button)
    expect(instances).toHaveLength(1)
    expect(instances[0].start).toHaveBeenCalledOnce()

    fireEvent.mouseUp(button)
    expect(instances[0].stop).toHaveBeenCalledOnce()
  })

  it("forwards the recognized transcript via onTranscript", () => {
    const instances = installCapturingRecognition()

    const onTranscript = vi.fn()
    render(<VoiceInput onTranscript={onTranscript} />)
    fireEvent.mouseDown(screen.getByRole("button", { name: /hold to speak/i }))

    expect(instances).toHaveLength(1)
    instances[0].onresult?.({ results: [[{ transcript: "umugati kabiri" }]] })

    expect(onTranscript).toHaveBeenCalledWith("umugati kabiri")
  })

  it("sets lang to rw-RW on the recognition instance", () => {
    const instances = installCapturingRecognition()

    render(<VoiceInput onTranscript={vi.fn()} />)
    fireEvent.mouseDown(screen.getByRole("button", { name: /hold to speak/i }))

    expect(instances).toHaveLength(1)
    expect(instances[0].lang).toBe("rw-RW")
  })

  it("shows a listening indicator the moment recording starts, not silence", () => {
    installCapturingRecognition()
    render(<VoiceInput onTranscript={vi.fn()} />)

    fireEvent.mouseDown(screen.getByRole("button", { name: /hold to speak/i }))

    expect(screen.getByText(/listening/i)).toBeInTheDocument()
  })

  it("shows a visible message, and does not call onTranscript, when nothing was recognized", async () => {
    const instances = installCapturingRecognition()
    const onTranscript = vi.fn()
    render(<VoiceInput onTranscript={onTranscript} />)

    fireEvent.mouseDown(screen.getByRole("button", { name: /hold to speak/i }))
    instances[0].onresult?.({ results: [] })

    expect(await screen.findByText(/didn't catch that/i)).toBeInTheDocument()
    expect(onTranscript).not.toHaveBeenCalled()
  })

  it("shows a visible message, and does not call onTranscript, when recognition errors", async () => {
    const instances = installCapturingRecognition()
    const onTranscript = vi.fn()
    render(<VoiceInput onTranscript={onTranscript} />)

    fireEvent.mouseDown(screen.getByRole("button", { name: /hold to speak/i }))
    instances[0].onerror?.()

    expect(await screen.findByText(/couldn't hear you/i)).toBeInTheDocument()
    expect(onTranscript).not.toHaveBeenCalled()
  })
})
