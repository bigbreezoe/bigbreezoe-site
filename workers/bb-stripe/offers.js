// Which Stripe payment link is which offer. Payment link IDs are not secrets.
// TEST links (acct in test mode, created Oct 2026). When live links are made, add their IDs here too.
// "minutes" is the booking length shown after payment. null = no booking (upload or download).
export const OFFERS = {
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
