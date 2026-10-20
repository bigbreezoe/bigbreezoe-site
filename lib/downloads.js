// The files a paid download offer unlocks. Server only (read by functions/api/download-kit.js).
//
// The files are not in public/ and not in git: this repo is public. They live in the private Cloudflare KV namespace
// bound as PRIVATE_FILES (bb-private-files), under the keys below. Product sources are kept outside the repo.
// A paid session can only ever unlock the one file listed for its own offer.

export const DOWNLOADS = {
  audio_kit_17: { key: 'audio-kit/phone-first-creator-audio-kit.pdf', name: 'Phone-First-Creator-Audio-Kit.pdf', type: 'application/pdf' },
  three_lane_kit_12: { key: 'products/three-lane-kit-builder-v1.zip', name: 'Big-Breezoe-Three-Lane-Kit-Builder.zip', type: 'application/zip' },
  weekly_os_19: { key: 'products/weekly-os-v1.zip', name: 'Big-Breezoe-Creator-Weekly-Operating-System.zip', type: 'application/zip' },
  descript_prompt_pack_27: { key: 'products/descript-prompt-pack-v1.zip', name: 'Big-Breezoe-Descript-Prompt-Pack.zip', type: 'application/zip' },
  intake_kit_47: { key: 'products/intake-kit-v1.zip', name: 'Big-Breezoe-Client-Intake-Automation-Kit.zip', type: 'application/zip' },
  starter_bundle_59: { key: 'products/starter-bundle-v1.zip', name: 'Big-Breezoe-Creator-Starter-Bundle.zip', type: 'application/zip' },
};

export function downloadFor(offer) {
  return typeof offer === 'string' && Object.prototype.hasOwnProperty.call(DOWNLOADS, offer) ? DOWNLOADS[offer] : null;
}
