// Keeps a page's numbers fresh without a manual reload.
//  1. Supabase realtime: any insert/update/delete on the listed tables triggers a (debounced) reload.
//  2. Fallbacks: reload when the tab regains focus, and every `pollMs` while it is visible - this covers
//     the case where realtime isn't enabled for a table yet.
// Call from a component's setup; it cleans up after itself when the component unmounts.
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

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { void reload(); }, debounceMs);
  };
  const onVisible = () => { if (document.visibilityState === 'visible') schedule(); };

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
  });

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
    if (poll) clearInterval(poll);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', schedule);
    if (channel) void supabase.removeChannel(channel);
  });
}
