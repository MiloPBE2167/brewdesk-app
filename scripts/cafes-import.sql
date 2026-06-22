-- Import quán thật từ data/brewdesk-cafes-template.xlsx (auto-gen).
-- lat/lng đã khôi phục từ lỗi mất dấu thập phân (locale Excel).
-- Chạy trong Supabase SQL Editor (postgres, bỏ qua RLS). An toàn chạy lại.

delete from public.cafes where name in ('CLOUD COFFEE & TEA','Garage Coffee','Cheese Coffee','VIVA RESERVE','Hey Mango! Cafe','Highlands Coffee Trường Sơn','Underhood Kafe','Phúc Long','SOLE SAIGON');

insert into public.cafes
  (name, address, lat, lng, district, has_power_outlets, has_wifi, noise_level, vibe_tags, opening_hours, photo_url)
values
  ('CLOUD COFFEE & TEA', '497/23A Sư Vạn Hạnh, Hòa Hưng, Hồ Chí Minh, Việt Nam', 10.7739044, 106.6677691, 'Q10', true, true, 2, '{"chill","study-friendly","gia-re"}', '{"all":"07:00-22:00"}', null),
  ('Garage Coffee', '816 Sư Vạn Hạnh, Hòa Hưng, Hồ Chí Minh, Việt Nam', 10.7746594, 106.6684095, 'Q10', true, true, 3, '{"study-friendly","chill","view-dep"}', '{"all":"07:00-22:00"}', null),
  ('Cheese Coffee', '154 Đ. Thành Thái, Hòa Hưng, Hồ Chí Minh, Việt Nam', 10.7755621, 106.6641594, 'Q10', true, true, 3, '{"chill","study-friendly","dong-duc","cafe-lam-viec"}', '{"all":"07:00-22:30"}', null),
  ('VIVA RESERVE', '84 Đ. Thành Thái, Hòa Hưng, Hồ Chí Minh, Việt Nam', 10.7723202, 106.6653509, 'Q10', true, true, 3, '{"dong-duc","cafe-lam-viec"}', '{"all":"06:00-23:00"}', null),
  ('Hey Mango! Cafe', 'O3, Trường Sơn, Phường Hoà Hưng, Hòa Hưng, Hồ Chí Minh, Việt Nam', 10.7814722, 106.6630683, 'Q10', false, true, 3, '{"chill","study-friendly","view-dep"}', '{"all":"07:00-22:30"}', null),
  ('Highlands Coffee Trường Sơn', 'G4 G8, Trường Sơn, Cư xá Bắc Hải, Hòa Hưng, Hồ Chí Minh, Việt Nam', 10.7812727, 106.6622746, 'Q10', true, true, 4, '{"study-friendly","cafe-lam-viec"}', '{"all":"06:30-22:00"}', null),
  ('Underhood Kafe', '1A Đ. Đồng Nai, Cư xá Bắc Hải, Hòa Hưng, Hồ Chí Minh 72512, Việt Nam', 10.7786383, 106.6628403, 'Q10', true, true, 3, '{"chill","view-dep","study-friendly","cafe-lam-viec"}', '{"all":"07:00-23:30"}', null),
  ('Phúc Long', '218A Đ. Thành Thái, Cư xá Bắc Hải, Hòa Hưng, Hồ Chí Minh 70000, Việt Nam', 10.7772361, 106.6629376, 'Q10', true, true, 4, '{"cafe-lam-viec","chill"}', '{"all":"07:30–22:30"}', null),
  ('SOLE SAIGON', '8 Nguyễn Tiểu La, Diên Hồng, Hồ Chí Minh, Việt Nam', 10.759974, 106.6672747, 'Q10', true, true, 3, '{"chill","study-friendly","cafe-lam-viec"}', '{"all":"08:00-23:00"}', null);
