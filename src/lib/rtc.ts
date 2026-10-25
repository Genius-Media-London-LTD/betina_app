// WebRTC for the voice chat — native (react-native-webrtc). The web build uses
// rtc.web.ts with the browser's own WebRTC; both expose the same small API.
import { mediaDevices, MediaStream, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';

export { mediaDevices, RTCPeerConnection, RTCSessionDescription };

/** Native plays the remote track by itself. Returns a cleanup. */
export function playRemote(_stream: MediaStream): () => void {
  return () => {};
}

/** Live loudness 0..1 of a stream; not available natively (null → the UI animates by state). */
export function levelMeter(_stream: MediaStream): (() => number) | null {
  return null;
}
