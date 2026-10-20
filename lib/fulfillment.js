// What happens after a paid Checkout Session: which offer it was, how it is fulfilled, and which calendar to show.
//
// This file runs ONLY on the server (inside the verify-session Function). It is not in public/.
//
// The offer is decided by the Payment Link the session came from (session.payment_link), looked up here.
// It is NOT read from anything the buyer can edit. The Payment Link ids below were read from the Stripe test-mode
// account on Oct 18, 2026 and match each link's metadata (offer, fulfillment, booking_duration_min).
// LIVE holds the live Payment Link ids (filled in Oct 19, 2026).

// Names shown to a buyer after payment. Only offers whose name is already public on the site or in the Stripe
// products are listed; any other offer shows no name.
const LABELS = {
  getting_started: 'Getting Started',
  the_basics_standard: 'The Basics',
  the_basics_founding: 'The Basics, founding-client rate',
  full_playbook: 'The Full Playbook',
  video_podcast_edit: 'Video or Podcast Edit',
  shorts_pack_5: 'Shorts Pack',
  audio_kit_17: 'Phone-First Creator Audio Kit',
};

// unit: what one unit of quantity is called, for the offers sold by quantity (the Payment Link's metadata.unit).
function entry(offer, fulfillment, bookingMinutes, unit = null) {
  return { offer, fulfillment, bookingMinutes, unit, label: LABELS[offer] || null };
}

const TEST = {
  plink_1URtDBR9ZB06h9S6guTEGj0y: entry('getting_started', 'book_60', 60),
  plink_1URtDGR9ZB06h9S6xQn5OsMs: entry('the_basics_standard', 'book_60_kickoff', 60),
  plink_1URtDLR9ZB06h9S6ZLjMJKUA: entry('the_basics_founding', 'book_60_kickoff', 60),
  plink_1URtDQR9ZB06h9S6kFjVlwwr: entry('full_playbook', 'book_60_kickoff', 60),
  plink_1URtDUR9ZB06h9S6XK4zO3BL: entry('working_session_60', 'book_60', 60),
  plink_1URtDZR9ZB06h9S6oiKXqYP5: entry('quick_fix_30', 'book_30', 30),
  plink_1URtDcR9ZB06h9S6jeeGR23q: entry('intake_form_autoreply', 'book_30', 30),
  plink_1URtDyR9ZB06h9S6Wh7OjYIV: entry('booking_page', 'book_30', 30),
  plink_1URtE2R9ZB06h9S6FpETgeSB: entry('email_list_welcome', 'book_30', 30),
  plink_1URtE6R9ZB06h9S6HrIDAxrK: entry('followup_automation', 'book_30', 30),
  plink_1URtE9R9ZB06h9S6tYJNbEEw: entry('one_page_website', 'book_60', 60),
  plink_1URtEDR9ZB06h9S6E93l8sVx: entry('video_podcast_edit', 'upload_no_booking', 0, 'episode'),
  plink_1URtEGR9ZB06h9S6olG84L6G: entry('shorts_pack_5', 'upload_no_booking', 0, 'pack'),
  plink_1URtEKR9ZB06h9S68a7cabC2: entry('audio_kit_17', 'download_instant', 0),
};

// LIVE Payment Links, created in the live Stripe account on Oct 19, 2026 (Managed Payments off on each link).
// Same offers and fulfillment as the TEST table above. Cris approved going live on Oct 19, 2026.
const LIVE = {
  plink_1USJhRR9ZB06h9S6UTujlYhj: entry('getting_started', 'book_60', 60),
  plink_1USJhfR9ZB06h9S6ZB3awpfB: entry('the_basics_standard', 'book_60_kickoff', 60),
  plink_1USJhgR9ZB06h9S6DTLUVrOJ: entry('the_basics_founding', 'book_60_kickoff', 60),
  plink_1USJhQR9ZB06h9S6Jl2kEWod: entry('full_playbook', 'book_60_kickoff', 60),
  plink_1USJhOR9ZB06h9S6ccFDZ34z: entry('working_session_60', 'book_60', 60),
  plink_1USJhNR9ZB06h9S6XBVB3pZT: entry('quick_fix_30', 'book_30', 30),
  plink_1USJhMR9ZB06h9S6gJrwy8Mo: entry('intake_form_autoreply', 'book_30', 30),
  plink_1USJgnR9ZB06h9S6tnIu533G: entry('booking_page', 'book_30', 30),
  plink_1USJgmR9ZB06h9S6ZBNXCC2A: entry('email_list_welcome', 'book_30', 30),
  plink_1USJglR9ZB06h9S6OmArMiWr: entry('followup_automation', 'book_30', 30),
  plink_1USJgjR9ZB06h9S6dt6LKYe6: entry('one_page_website', 'book_60', 60),
  plink_1USJgiR9ZB06h9S6psLQlRQB: entry('video_podcast_edit', 'upload_no_booking', 0, 'episode'),
  plink_1USJghR9ZB06h9S6nbcCorNg: entry('shorts_pack_5', 'upload_no_booking', 0, 'pack'),
  plink_1USJggR9ZB06h9S6ZAGyZPRF: entry('audio_kit_17', 'download_instant', 0),
};

export const PAYMENT_LINKS = { test: TEST, live: LIVE };

// Google Calendar appointment schedules, one per appointment length. Both are the public booking pages.
// An empty string means that schedule has not been provided yet: /booked/ then shows a plain "reply to the email"
// message instead of a calendar. Nothing here is a secret; the page only shows it after a paid session is verified.
//
// 60: supplied by Cris on Oct 18, 2026 as https://calendar.app.google/XLMVYvoEE4LR6TV8A (the short link resolves to
//     this address; the long form with gv=true is the one Google's embed code uses).
// 30: NOT provided yet.
export const CALENDARS = {
  60: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3D7tfS5M2W88yxnSmKBVTPx9b7vikwTjckdjGoFCT7Y0HLT9Iu2GKukFknmG-CWjEAV-CLJtme?gv=true',
  // Oct 20, 2026: Cris's 30-minute short link opens the same schedule as the 60-minute one, and it now books 30-minute slots.
  // Cris chose to use it for both lengths for now. Replace 60 when a separate 60-minute schedule exists.
  30: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3D7tfS5M2W88yxnSmKBVTPx9b7vikwTjckdjGoFCT7Y0HLT9Iu2GKukFknmG-CWjEAV-CLJtme?gv=true',
};

const EMBED_OK = /^https:\/\/calendar\.google\.com\/calendar\/appointments\/schedules\/[A-Za-z0-9_-]+(\?[A-Za-z0-9=&_-]*)?$/;

export function paymentLinkEntry(mode, paymentLinkId) {
  if (typeof paymentLinkId !== 'string') return null;
  const table = PAYMENT_LINKS[mode] || {};
  return Object.prototype.hasOwnProperty.call(table, paymentLinkId) ? table[paymentLinkId] : null;
}

// The calendar for a booking length, or '' if there is none or it does not look like a Google appointment page.
export function calendarFor(minutes) {
  const url = CALENDARS[minutes] || '';
  return EMBED_OK.test(url) ? url : '';
}
