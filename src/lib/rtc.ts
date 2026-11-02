// WebRTC for the voice chat — native (react-native-webrtc). The web build uses
// rtc.web.ts with the browser's own WebRTC; both expose the same small API.
import { NativeModules } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import { mediaDevices, MediaStream, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';

export { mediaDevices, RTCPeerConnection, RTCSessionDescription };

/**
 * Native plays the remote track by itself. A WebRTC call defaults to the
 * earpiece like a phone call; 'video' mode routes it to the loudspeaker but
 * still follows headphones and Bluetooth. Returns a cleanup.
 */
export function playRemote(_stream: MediaStream): () => void {
  // Store builds before 1.1.0 (12) lack the native module and get this code by OTA.
  if (!NativeModules.InCallManager) return () => {};
  InCallManager.start({ media: 'video', auto: true });
  return () => InCallManager.stop();
}

/** Live loudness 0..1 of a stream; not available natively (null → the UI animates by state). */
export function levelMeter(_stream: MediaStream): (() => number) | null {
  return null;
}
