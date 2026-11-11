# A Real-Time Asynchronous Speech Pipeline Architecture for Inbound Telephonic Voice Agents Using Pipecat (CS4 Major Project)

## Project Overview

Mia is an autonomous, real-time AI receptionist built for telephony environments. When a caller dials the Twilio phone number, they connect directly to **Mia**, the virtual receptionist for Bright Smiles Dental clinic.

The primary engineering focus of this project is delivering **ultra-low response latency (<1.5s total round-trip)**, **natural conversational turn-taking with barge-in support**, and **lifelike speech synthesis** over standard telephone networks.

---

## Technical Stack

| Layer | Technology | Details |
|---|---|---|
| **Pipeline Framework** | [Pipecat](https://github.com/pipecat-ai/pipecat) (v1.10.0) | Asynchronous, frame-based audio processing pipeline |
| **Speech-to-Text (STT)** | Deepgram Nova-2 | High-accuracy streaming transcription via European endpoint |
| **Language Model (LLM)** | OpenAI `gpt-4o-mini` | Low-latency instruction following, system prompt conditioning |
| **Text-to-Speech (TTS)** | Deepgram Aura (`aura-athena-en`) | Fast streaming neural audio synthesis |
| **Voice Activity Detection** | Silero VAD (ONNX) | Real-time speech frame classification & pause analysis |
| **Telephony Transport** | Twilio Media Streams | Bidirectional 8 kHz μ-law audio over WebSockets |
| **Browser Transport** | SmallWebRTC | Local testing interface via FastAPI |
| **Runtime & Hosting** | Python 3.12 / Azure Container Apps | Containerized always-on microservice |

---

## Architecture

The system uses a unified pipeline structure supporting multiple transports:

```
[Audio Input] 
      │
      ▼
[Silero VAD] 
      │
      ▼
[Deepgram STT] 
      │
      ▼
[User Context Aggregator] 
      │
      ▼
[OpenAI LLM (gpt-4o-mini)] 
      │
      ▼
[Deepgram Aura TTS] 
      │
      ▼
[Audio Output Transport] 
      │
      ▼
[Assistant Aggregator]
```

### Key Architectural Highlights:

1. **Dual Transport in One Application (`bot.py`):**
   - **Local WebRTC:** `python bot.py` (accessible at `http://localhost:7860/client`).
   - **Twilio Telephony:** `python bot.py -t twilio` (handles inbound phone calls).
2. **Deterministic Time-Aware Greeting:**
   - Spoken immediately on call connection via `TTSSpeakFrame`.
   - Bypasses LLM round-trip on call initiation, removing initial latency.
   - Computes local clinic time (`Europe/London`) in Python to greet callers appropriately ("Good morning", "Good afternoon", "Good evening") and check current clinic open/closed status accurately.
3. **Optimized VAD Model Pool:**
   - Silero VAD requires ONNX inference session initialization (~220–380ms).
   - Pre-warms instances in a worker thread pool on container startup (`VAD_POOL_SIZE=2`) so incoming calls get immediate zero-latency audio processing.
4. **Resilient Call Management:**
   - Automatic silence detection (`SILENCE_HANGUP_SECS=22`).
   - Hard conversation watchdog timeout (`MAX_CALL_SECS=330`).
   - Graceful pipeline error recovery with conversational apologies.

---

## Pipecat Implementation Reference (v1.8.1+)

The application is built on the current Pipecat architecture standards:

| Component | Modern Implementation | Architectural Purpose |
|---|---|---|
| **Pipeline Runner** | `PipelineWorker` + `WorkerRunner` | Replaces deprecated PipelineTask / PipelineRunner |
| **Conversation Context** | `LLMContext` | Manages message history and dynamic turns |
| **Context Aggregation** | `LLMContextAggregatorPair` | Decouples user input buffering from assistant speech capture |
| **Turn Taking & VAD** | `LLMUserAggregatorParams(vad_analyzer=...)` | Integrates Silero VAD with user idle timeout and barge-in |
| **Transport Initialization**| `create_transport(runner_args, transport_params)` | Auto-wires Twilio serializer, TwiML generation, and WebSocket routes |

> **Note on Barge-In Configuration:**
> The Silero VAD analyzer is intentionally passed to `LLMUserAggregatorParams` rather than `TransportParams`. Configuring it at the aggregator level enables responsive caller interruptions (barge-in).

---

## Environment Setup & Configuration

Create a `.env` file in the project root based on `.env.example`:

```bash
# AI & Telephony Keys
DEEPGRAM_API_KEY=your_deepgram_key
OPENAI_API_KEY=your_openai_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Voice Configuration
TTS_PROVIDER=deepgram
DEEPGRAM_VOICE=aura-athena-en
DEEPGRAM_HOST=api.eu.deepgram.com

# Latency & Timeouts
VAD_STOP_SECS=0.2
STT_ENDPOINTING_MS=150
SILENCE_HANGUP_SECS=22
MAX_CALL_SECS=330
```

---

## Running the Application

### 1. Local Browser Testing (SmallWebRTC)
```bash
python bot.py
```
Open `http://localhost:7860/client` in Chrome or Edge to test voice synthesis, transcription, and conversational flow via microphone.

### 2. Live Telephony (Twilio Inbound)
```bash
python bot.py -t twilio --host 0.0.0.0 --port 8080 --proxy <your-public-fqdn>
```
Point your Twilio phone number's inbound voice webhook to:
`https://<your-public-domain>/` (HTTP POST).

---

## References & Documentation

- [Pipecat Framework Documentation](https://docs.pipecat.ai)
- [Deepgram Streaming Speech API](https://developers.deepgram.com)
- [Twilio Voice Media Streams](https://www.twilio.com/docs/voice/media-streams)
- [OpenAI Realtime & Chat Completions](https://platform.openai.com/docs)
