import type { Localized } from '../i18n/ui';

export type RegionId =
  | 'hokkaido'
  | 'tohoku'
  | 'kanto'
  | 'chubu'
  | 'kinki'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu';

export interface Region {
  id: RegionId;
  name: Localized;
}

export interface Prefecture {
  id: string; // URL に使うスラッグ
  name: Localized;
  region: RegionId;
}

export const regions: Region[] = [
  { id: 'hokkaido', name: { ja: '北海道', en: 'Hokkaido' } },
  { id: 'tohoku', name: { ja: '東北', en: 'Tohoku' } },
  { id: 'kanto', name: { ja: '関東', en: 'Kanto' } },
  { id: 'chubu', name: { ja: '中部', en: 'Chubu' } },
  { id: 'kinki', name: { ja: '近畿', en: 'Kansai' } },
  { id: 'chugoku', name: { ja: '中国', en: 'Chugoku' } },
  { id: 'shikoku', name: { ja: '四国', en: 'Shikoku' } },
  { id: 'kyushu', name: { ja: '九州・沖縄', en: 'Kyushu & Okinawa' } },
];

export const prefectures: Prefecture[] = [
  { id: 'hokkaido', name: { ja: '北海道', en: 'Hokkaido' }, region: 'hokkaido' },
  { id: 'aomori', name: { ja: '青森県', en: 'Aomori' }, region: 'tohoku' },
  { id: 'iwate', name: { ja: '岩手県', en: 'Iwate' }, region: 'tohoku' },
  { id: 'miyagi', name: { ja: '宮城県', en: 'Miyagi' }, region: 'tohoku' },
  { id: 'akita', name: { ja: '秋田県', en: 'Akita' }, region: 'tohoku' },
  { id: 'yamagata', name: { ja: '山形県', en: 'Yamagata' }, region: 'tohoku' },
  { id: 'fukushima', name: { ja: '福島県', en: 'Fukushima' }, region: 'tohoku' },
  { id: 'ibaraki', name: { ja: '茨城県', en: 'Ibaraki' }, region: 'kanto' },
  { id: 'tochigi', name: { ja: '栃木県', en: 'Tochigi' }, region: 'kanto' },
  { id: 'gunma', name: { ja: '群馬県', en: 'Gunma' }, region: 'kanto' },
  { id: 'saitama', name: { ja: '埼玉県', en: 'Saitama' }, region: 'kanto' },
  { id: 'chiba', name: { ja: '千葉県', en: 'Chiba' }, region: 'kanto' },
  { id: 'tokyo', name: { ja: '東京都', en: 'Tokyo' }, region: 'kanto' },
  { id: 'kanagawa', name: { ja: '神奈川県', en: 'Kanagawa' }, region: 'kanto' },
  { id: 'niigata', name: { ja: '新潟県', en: 'Niigata' }, region: 'chubu' },
  { id: 'toyama', name: { ja: '富山県', en: 'Toyama' }, region: 'chubu' },
  { id: 'ishikawa', name: { ja: '石川県', en: 'Ishikawa' }, region: 'chubu' },
  { id: 'fukui', name: { ja: '福井県', en: 'Fukui' }, region: 'chubu' },
  { id: 'yamanashi', name: { ja: '山梨県', en: 'Yamanashi' }, region: 'chubu' },
  { id: 'nagano', name: { ja: '長野県', en: 'Nagano' }, region: 'chubu' },
  { id: 'gifu', name: { ja: '岐阜県', en: 'Gifu' }, region: 'chubu' },
  { id: 'shizuoka', name: { ja: '静岡県', en: 'Shizuoka' }, region: 'chubu' },
  { id: 'aichi', name: { ja: '愛知県', en: 'Aichi' }, region: 'chubu' },
  { id: 'mie', name: { ja: '三重県', en: 'Mie' }, region: 'kinki' },
  { id: 'shiga', name: { ja: '滋賀県', en: 'Shiga' }, region: 'kinki' },
  { id: 'kyoto', name: { ja: '京都府', en: 'Kyoto' }, region: 'kinki' },
  { id: 'osaka', name: { ja: '大阪府', en: 'Osaka' }, region: 'kinki' },
  { id: 'hyogo', name: { ja: '兵庫県', en: 'Hyogo' }, region: 'kinki' },
  { id: 'nara', name: { ja: '奈良県', en: 'Nara' }, region: 'kinki' },
  { id: 'wakayama', name: { ja: '和歌山県', en: 'Wakayama' }, region: 'kinki' },
  { id: 'tottori', name: { ja: '鳥取県', en: 'Tottori' }, region: 'chugoku' },
  { id: 'shimane', name: { ja: '島根県', en: 'Shimane' }, region: 'chugoku' },
  { id: 'okayama', name: { ja: '岡山県', en: 'Okayama' }, region: 'chugoku' },
  { id: 'hiroshima', name: { ja: '広島県', en: 'Hiroshima' }, region: 'chugoku' },
  { id: 'yamaguchi', name: { ja: '山口県', en: 'Yamaguchi' }, region: 'chugoku' },
  { id: 'tokushima', name: { ja: '徳島県', en: 'Tokushima' }, region: 'shikoku' },
  { id: 'kagawa', name: { ja: '香川県', en: 'Kagawa' }, region: 'shikoku' },
  { id: 'ehime', name: { ja: '愛媛県', en: 'Ehime' }, region: 'shikoku' },
  { id: 'kochi', name: { ja: '高知県', en: 'Kochi' }, region: 'shikoku' },
  { id: 'fukuoka', name: { ja: '福岡県', en: 'Fukuoka' }, region: 'kyushu' },
  { id: 'saga', name: { ja: '佐賀県', en: 'Saga' }, region: 'kyushu' },
  { id: 'nagasaki', name: { ja: '長崎県', en: 'Nagasaki' }, region: 'kyushu' },
  { id: 'kumamoto', name: { ja: '熊本県', en: 'Kumamoto' }, region: 'kyushu' },
  { id: 'oita', name: { ja: '大分県', en: 'Oita' }, region: 'kyushu' },
  { id: 'miyazaki', name: { ja: '宮崎県', en: 'Miyazaki' }, region: 'kyushu' },
  { id: 'kagoshima', name: { ja: '鹿児島県', en: 'Kagoshima' }, region: 'kyushu' },
  { id: 'okinawa', name: { ja: '沖縄県', en: 'Okinawa' }, region: 'kyushu' },
];

export function getPrefecture(id: string): Prefecture {
  const pref = prefectures.find((p) => p.id === id);
  if (!pref) throw new Error(`Unknown prefecture: ${id}`);
  return pref;
}
