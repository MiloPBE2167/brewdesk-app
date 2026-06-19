// RLS 2-user test — chạy qua PUBLISHABLE key (RLS được áp), KHÔNG dùng SQL Editor
// (SQL Editor chạy quyền postgres = bypass RLS, test ở đó luôn pass = vô nghĩa).
//
// Setup tay trước khi chạy (xem .env.rls-test.example):
//   - 2 user confirmed trên Dashboard (Auth > Add user, tick Auto Confirm)
//   - >=1 café seed qua SQL Editor (script tự fetch cafe_id)
//   - copy .env.rls-test.example -> .env.rls-test, điền email/password
//
// Chạy:  node scripts/rls-test.mjs
//
// Re-runnable: mỗi lần chạy reset checkin active của 2 user về checked-out trước khi test.
// Khẳng định dựa trên row-id + active-filter nên rows lịch sử không làm sai kết quả.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ── load env (không dùng dotenv dep) ────────────────────────────────────────
function loadEnv(path) {
  let txt;
  try { txt = readFileSync(path, 'utf8'); } catch { return {}; }
  const out = {};
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const env = { ...loadEnv('.env.local'), ...loadEnv('.env.rls-test') };

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const A = { email: env.RLS_TEST_USER_A_EMAIL, password: env.RLS_TEST_USER_A_PASSWORD };
const B = { email: env.RLS_TEST_USER_B_EMAIL, password: env.RLS_TEST_USER_B_PASSWORD };

for (const [k, v] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: KEY,
  RLS_TEST_USER_A_PASSWORD: A.password, RLS_TEST_USER_B_PASSWORD: B.password })) {
  if (!v) { console.error(`✗ thiếu env: ${k} (xem .env.rls-test.example)`); process.exit(1); }
}

// ── test harness ─────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function ok(name, cond, detail = '') {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); fail++; }
}
const newClient = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const isRlsError = (e) => !!e && (e.code === '42501' || /row-level security|violates row-level/i.test(e.message || ''));

async function signIn(creds) {
  const c = newClient();
  const { data, error } = await c.auth.signInWithPassword(creds);
  if (error) { console.error(`✗ đăng nhập ${creds.email} thất bại: ${error.message}`); process.exit(1); }
  return { client: c, uid: data.user.id };
}

async function main() {
  console.log(`\nRLS test → ${URL}\n`);
  const a = await signIn(A);
  const b = await signIn(B);
  const anon = newClient();
  console.log(`signed in: A=${a.uid.slice(0, 8)}… B=${b.uid.slice(0, 8)}…\n`);

  // reset trạng thái active từ lần chạy trước
  for (const u of [a, b]) {
    await u.client.from('checkins').update({ checked_out_at: new Date().toISOString() })
      .is('checked_out_at', null).eq('user_id', u.uid);
  }

  // ── profiles ──────────────────────────────────────────────────────────────
  console.log('profiles:');
  {
    const { error } = await a.client.from('profiles')
      .upsert({ id: a.uid, display_name: 'User A' }, { onConflict: 'id' });
    ok('A tạo/sửa profile của chính mình', !error, error?.message);
    await b.client.from('profiles').upsert({ id: b.uid, display_name: 'User B' }, { onConflict: 'id' });

    const r2 = await a.client.from('profiles').insert({ id: b.uid, display_name: 'hijack' });
    ok('A KHÔNG tạo được profile mang id của B (deny)', isRlsError(r2.error), r2.error?.code || 'không có lỗi');

    const r3 = await a.client.from('profiles').select('id');
    const ids = (r3.data || []).map((x) => x.id);
    ok('A (authenticated) đọc được cả profile A và B', ids.includes(a.uid) && ids.includes(b.uid),
      `thấy ${ids.length} dòng`);

    const r4 = await anon.from('profiles').select('id');
    ok('anon KHÔNG đọc được profiles (0 dòng)', (r4.data || []).length === 0, `thấy ${(r4.data || []).length} dòng`);
  }

  // ── cafes ─────────────────────────────────────────────────────────────────
  console.log('\ncafes:');
  let cafeId;
  {
    const r1 = await anon.from('cafes').select('id').limit(1);
    cafeId = r1.data?.[0]?.id;
    ok('anon đọc được cafes (public read)', !!cafeId,
      cafeId ? '' : 'CHƯA seed café nào — insert 1 dòng qua SQL Editor rồi chạy lại');
    if (!cafeId) { summary(); return; }

    const r2 = await a.client.from('cafes')
      .insert({ name: 'x', address: 'x', lat: 0, lng: 0 });
    ok('A KHÔNG ghi được cafes (admin-only, deny)', isRlsError(r2.error), r2.error?.code || 'không có lỗi');
  }

  // ── checkins ────────────────────────────────────────────────────────────────
  console.log('\ncheckins:');
  {
    const r1 = await a.client.from('checkins').insert({ user_id: a.uid, cafe_id: cafeId }).select('id').single();
    ok('A check-in cho chính mình', !r1.error && !!r1.data, r1.error?.message);
    const idA = r1.data?.id;

    const r2 = await a.client.from('checkins').insert({ user_id: b.uid, cafe_id: cafeId });
    ok('A KHÔNG check-in hộ B được (deny)', isRlsError(r2.error), r2.error?.code || 'không có lỗi');

    const r3 = await b.client.from('checkins').insert({ user_id: b.uid, cafe_id: cafeId }).select('id').single();
    ok('B check-in cho chính mình (cùng café)', !r3.error && !!r3.data, r3.error?.message);
    const idB = r3.data?.id;

    // cả 2 đang active cùng café → thấy nhau (query "ai đang ở đây")
    const activeAtCafe = (c) => c.from('checkins').select('id')
      .eq('cafe_id', cafeId).is('checked_out_at', null);
    const rA = await activeAtCafe(a.client);
    const idsA = (rA.data || []).map((x) => x.id);
    ok('A thấy check-in của B ở café chung (same active cafe)', idsA.includes(idA) && idsA.includes(idB),
      `active ids: ${idsA.length}`);
    const rB = await activeAtCafe(b.client);
    const idsB = (rB.data || []).map((x) => x.id);
    ok('B thấy check-in của A ở café chung', idsB.includes(idA) && idsB.includes(idB), `active ids: ${idsB.length}`);

    // A không sửa được checkin của B
    const r6 = await a.client.from('checkins').update({ checked_out_at: new Date().toISOString() })
      .eq('id', idB).select('id');
    ok('A KHÔNG sửa được check-in của B (0 dòng)', (r6.data || []).length === 0, `sửa ${(r6.data || []).length} dòng`);
    const bStill = await b.client.from('checkins').select('checked_out_at').eq('id', idB).single();
    ok('  → check-in của B vẫn còn active', bStill.data?.checked_out_at === null);

    // A checkout chính mình → A hết active
    const r8 = await a.client.from('checkins').update({ checked_out_at: new Date().toISOString() })
      .eq('id', idA).select('id');
    ok('A checkout được chính mình', (r8.data || []).length === 1);

    // A đã hết active ở café → KHÔNG còn thấy check-in của B nữa
    const rAfter = await a.client.from('checkins').select('id, user_id');
    const seen = rAfter.data || [];
    ok('A hết active → không còn thấy check-in của B', !seen.some((x) => x.id === idB),
      `vẫn thấy ${seen.filter((x) => x.user_id === b.uid).length} dòng của B`);
    ok('  → A vẫn thấy check-in của chính mình', seen.some((x) => x.id === idA));
  }

  summary();
}

function summary() {
  console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ CÓ LỖI'} — ${pass} pass, ${fail} fail\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('crash:', e); process.exit(1); });
