// Which Stripe payment link is which offer. Payment link IDs are not secrets.
// TEST links (created Oct 19, 2026, test account no longer visible) and LIVE links (created Oct 19, 2026,
// acct_1UFwi4R9ZB06h9S6, Managed Payments off per link). Keep both so test runs still resolve.
// "minutes" is the booking length shown after payment. null = no booking (upload or download).
export const OFFERS = {
  // LIVE
  plink_1USJggR9ZB06h9S6ZAGyZPRF: { offer: 'audio_kit_17', kind: 'download', minutes: null },
  plink_1USJghR9ZB06h9S6nbcCorNg: { offer: 'shorts_pack_5', kind: 'upload', minutes: null },
  plink_1USJgiR9ZB06h9S6psLQlRQB: { offer: 'video_podcast_edit', kind: 'upload', minutes: null },
  plink_1USJgjR9ZB06h9S6dt6LKYe6: { offer: 'one_page_website', kind: 'book', minutes: 60 },
  plink_1USJglR9ZB06h9S6OmArMiWr: { offer: 'followup_automation', kind: 'book', minutes: 30 },
  plink_1USJgmR9ZB06h9S6ZBNXCC2A: { offer: 'email_list_welcome', kind: 'book', minutes: 30 },
  plink_1USJgnR9ZB06h9S6tnIu533G: { offer: 'booking_page', kind: 'book', minutes: 30 },
  plink_1USJhMR9ZB06h9S6gJrwy8Mo: { offer: 'intake_form_autoreply', kind: 'book', minutes: 30 },
  plink_1USJhNR9ZB06h9S6XBVB3pZT: { offer: 'quick_fix_30', kind: 'book', minutes: 30 },
  plink_1USJhOR9ZB06h9S6ccFDZ34z: { offer: 'working_session_60', kind: 'book', minutes: 60 },
  plink_1USJhQR9ZB06h9S6Jl2kEWod: { offer: 'full_playbook', kind: 'book', minutes: 60 },
  plink_1USJhgR9ZB06h9S6DTLUVrOJ: { offer: 'the_basics_founding', kind: 'book', minutes: 60 },
  plink_1USJhfR9ZB06h9S6ZB3awpfB: { offer: 'the_basics_standard', kind: 'book', minutes: 60 },
  plink_1USJhRR9ZB06h9S6UTujlYhj: { offer: 'getting_started', kind: 'book', minutes: 60 },
  // TEST
  plink_1URtEKR9ZB06h9S68a7cabC2: { offer: 'audio_kit_17', kind: 'download', minutes: null },
  plink_1URtEGR9ZB06h9S6olG84L6G: { offer: 'shorts_pack_5', kind: 'upload', minutes: null },
  plink_1URtEDR9ZB06h9S6E93l8sVx: { offer: 'video_podcast_edit', kind: 'upload', minutes: null },
  plink_1URtE9R9ZB06h9S6tYJNbEEw: { offer: 'one_page_website', kind: 'book', minutes: 60 },
  plink_1URtE6R9ZB06h9S6HrIDAxrK: { offer: 'followup_automation', kind: 'book', minutes: 30 },
  plink_1URtE2R9ZB06h9S6FpETgeSB: { offer: 'email_list_welcome', kind: 'book', minutes: 30 },
  plink_1URtDyR9ZB06h9S6Wh7OjYIV: { offer: 'booking_page', kind: 'book', minutes: 30 },
  plink_1URtDcR9ZB06h9S6jeeGR23q: { offer: 'intake_form_autoreply', kind: 'book', minutes: 30 },
  plink_1URtDZR9ZB06h9S6oiKXqYP5: { offer: 'quick_fix_30', kind: 'book', minutes: 30 },
  plink_1URtDUR9ZB06h9S6XK4zO3BL: { offer: 'working_session_60', kind: 'book', minutes: 60 },
  plink_1URtDQR9ZB06h9S6kFjVlwwr: { offer: 'full_playbook', kind: 'book', minutes: 60 },
  plink_1URtDLR9ZB06h9S6ZLjMJKUA: { offer: 'the_basics_founding', kind: 'book', minutes: 60 },
  plink_1URtDGR9ZB06h9S6xQn5OsMs: { offer: 'the_basics_standard', kind: 'book', minutes: 60 },
  plink_1URtDBR9ZB06h9S6guTEGj0y: { offer: 'getting_started', kind: 'book', minutes: 60 }
};
