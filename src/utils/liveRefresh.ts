// Keeps a page's numbers fresh without a manual reload.
//  1. Supabase realtime: any insert/update/delete on the listed tables triggers a (debounced) reload.
//  2. Fallbacks: reload when the tab regains focus, and every `pollMs` while it is visible - this covers
//     the case where realtime isn't enabled for a table yet.
// Call from a component's setup; it cleans up after itself when the component unmounts, and stops
// as soon as the user signs out (see stop()).
import { onMounted, onBeforeUnmount } from 'vue';
import { supabase } from '../supabaseClient';

export function useLiveRefresh(
  reload: () => void | Promise<void>,
  tables: string[],
  options: { debounceMs?: number; pollMs?: number } = {},
) {
  const { debounceMs = 600, pollMs = 60000 } = options;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let poll: ReturnType<typeof setInterval> | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let authSubscription: { unsubscribe: () => void } | null = null;
  let stopped = false;

  const schedule = () => {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { void reload(); }, debounceMs);
  };
  const onVisible = () => { if (document.visibilityState === 'visible') schedule(); };

  // Logout signs out first and only then leaves the page, so for a moment the page is still mounted
  // without a session. A reload in that gap (the click on Logout refocuses the window, which
  // schedules one) ran every query as a signed-out visitor: about 40 refused requests (401 / 42501)
  // on the Genealogy page. Stopping on SIGNED_OUT closes that gap.
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (timer) clearTimeout(timer);
    if (poll) clearInterval(poll);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', schedule);
    if (channel) void supabase.removeChannel(channel);
    channel = null;
    authSubscription?.unsubscribe();
    authSubscription = null;
  };

  onMounted(() => {
    try {
      let ch = supabase.channel(`live-${Math.random().toString(36).slice(2)}`);
      for (const table of tables) {
        ch = ch.on('postgres_changes', { event: '*', schema: 'public', table }, schedule);
      }
      channel = ch.subscribe();
    } catch (e) {
      console.warn('Realtime unavailable, using polling only:', e);
    }
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', schedule);
    poll = setInterval(() => { if (document.visibilityState === 'visible') schedule(); }, pollMs);
    authSubscription = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') stop();
    }).data.subscription;
  });

  onBeforeUnmount(stop);
}
