import type { Localized } from '../i18n/ui';

export interface Shop {
  name: Localized;
  /** Google マップの place_id（https://developers.google.com/maps/documentation/places/web-service/place-id で検索） */
  placeId: string;
  /** 自分で書いたおすすめコメント（Google の口コミは転載しない） */
  comment: Localized;
}

export interface AffiliateLink {
  label: Localized;
  url: string;
}

export interface Gourmet {
  id: string; // URL に使うスラッグ
  prefecture: string; // prefectures.ts の id
  name: Localized;
  /** 英語表記の補足（読み方など） */
  romaji: string;
  emoji: string;
  summary: Localized;
  body: Record<keyof Localized, string[]>;
  howToEat: Record<keyof Localized, string[]>;
  priceRange: Localized;
  /** Google マップで検索するキーワード（店舗データがない場合の地図表示に使用） */
  mapQuery: string;
  shops: Shop[];
  affiliate: AffiliateLink[];
}

export const gourmets: Gourmet[] = [
  // ---- 北海道 ----
  {
    id: 'soup-curry',
    prefecture: 'hokkaido',
    name: { ja: 'スープカレー', en: 'Soup Curry' },
    romaji: 'Sūpu karē',
    emoji: '🍛',
    summary: {
      ja: '札幌生まれの、さらっとしたスパイシーなスープに大きな具材がごろっと入ったカレー。',
      en: 'A Sapporo-born curry with a light, spicy broth and big chunks of vegetables and meat.',
    },
    body: {
      ja: [
        '札幌発祥のご当地カレーで、とろみのないスープ状のルーが特徴です。',
        '素揚げした野菜や骨付きチキンなど、具材が大きくごろっと入っているのが定番。スープの種類や辛さを選べるお店が多く、自分好みにカスタマイズできます。',
      ],
      en: [
        'Born in Sapporo, soup curry is known for its thin, broth-like curry instead of a thick roux.',
        'It usually comes with large pieces of fried vegetables and a bone-in chicken leg. Many shops let you choose the soup base and spice level, so you can make it your own.',
      ],
    },
    howToEat: {
      ja: ['ご飯をスプーンですくって、スープに浸して食べるのが一般的です。', '辛さは段階で選べることが多いので、初めてなら控えめがおすすめ。'],
      en: [
        'Scoop some rice with your spoon and dip it into the soup.',
        'Most shops let you pick a spice level — start mild if it is your first time.',
      ],
    },
    priceRange: { ja: '1,200〜1,800円', en: '¥1,200–1,800' },
    mapQuery: 'スープカレー 札幌',
    shops: [],
    affiliate: [],
  },
  {
    id: 'jingisukan',
    prefecture: 'hokkaido',
    name: { ja: 'ジンギスカン', en: 'Jingisukan (Grilled Lamb)' },
    romaji: 'Jingisukan',
    emoji: '🐑',
    summary: {
      ja: 'ドーム型の鉄鍋で羊肉と野菜を焼く、北海道を代表する郷土料理。',
      en: "Hokkaido's signature dish: lamb and vegetables grilled on a dome-shaped iron pan.",
    },
    body: {
      ja: [
        '中央が盛り上がった専用の鍋で、ラムやマトンを焼いて食べる北海道の定番料理です。',
        '肉の脂が鍋のふちに流れ、もやしや玉ねぎなどの野菜にうま味が染み込みます。地元では家庭やお花見、バーベキューでも親しまれています。',
      ],
      en: [
        'Lamb or mutton is grilled on a special dome-shaped pan, a classic across Hokkaido.',
        'The meat juices run down to the edge of the pan, flavoring the bean sprouts and onions below. Locals enjoy it at home, at cherry-blossom parties and at barbecues.',
      ],
    },
    howToEat: {
      ja: ['肉は鍋の頂上、野菜はふちに置いて焼くのが基本です。', '服ににおいが付きやすいので、お店で貸してくれるエプロンを使いましょう。'],
      en: [
        'Put the meat on top of the dome and the vegetables around the edge.',
        'The smoke can stick to your clothes — use the apron most restaurants provide.',
      ],
    },
    priceRange: { ja: '1,500〜3,000円', en: '¥1,500–3,000' },
    mapQuery: 'ジンギスカン 札幌',
    shops: [],
    affiliate: [],
  },

  // ---- 静岡県 ----
  {
    id: 'fujinomiya-yakisoba',
    prefecture: 'shizuoka',
    name: { ja: '富士宮やきそば', en: 'Fujinomiya Yakisoba' },
    romaji: 'Fujinomiya yakisoba',
    emoji: '🍜',
    summary: {
      ja: 'コシの強い独特の麺と、肉かす・だし粉が決め手の、B級グルメの代表格。',
      en: 'Chewy noodles topped with crispy pork bits and fish powder — a legend of Japanese B-gourmet.',
    },
    body: {
      ja: [
        '富士山のふもと、富士宮市のご当地焼きそばです。水分の少ない独特の蒸し麺を使い、強いコシともちっとした食感が特徴です。',
        'ラードを搾った後の「肉かす」と、イワシやサバの「だし粉」をかけるのがお約束。B-1グランプリで優勝したことで全国的に有名になりました。',
      ],
      en: [
        'This yakisoba comes from Fujinomiya City at the foot of Mt. Fuji. It uses special low-moisture steamed noodles that are firm and chewy.',
        'It is finished with "nikukasu" (crispy bits left after rendering pork fat) and "dashiko" (sardine or mackerel powder). Winning the B-1 Grand Prix made it famous nationwide.',
      ],
    },
    howToEat: {
      ja: ['仕上げのだし粉はたっぷりかけるのが地元流。', '富士山観光とセットで立ち寄るのがおすすめです。'],
      en: [
        'Locals sprinkle plenty of dashiko powder on top.',
        'A perfect stop on a trip to see Mt. Fuji.',
      ],
    },
    priceRange: { ja: '500〜900円', en: '¥500–900' },
    mapQuery: '富士宮やきそば 富士宮市',
    shops: [],
    affiliate: [],
  },
  {
    id: 'shizuoka-oden',
    prefecture: 'shizuoka',
    name: { ja: '静岡おでん', en: 'Shizuoka Oden' },
    romaji: 'Shizuoka oden',
    emoji: '🍢',
    summary: {
      ja: '真っ黒なスープと黒はんぺん、仕上げのだし粉と青のりが特徴の駄菓子屋グルメ。',
      en: 'Oden simmered in a dark broth, with black fish cakes and a sprinkle of fish powder and seaweed.',
    },
    body: {
      ja: [
        '牛すじなどからとった濃い色のスープで煮込む、静岡市のご当地おでんです。',
        'すべての具を串に刺すのが特徴で、イワシやサバを使った灰色の「黒はんぺん」が欠かせません。駄菓子屋や居酒屋で気軽に楽しめます。',
      ],
      en: [
        'Shizuoka City’s local oden is simmered in a dark broth made with beef tendon and soy sauce.',
        'Every ingredient is served on a skewer, and the grey "kuro hanpen" fish cake made from sardines or mackerel is a must. You can find it at old-style candy shops and izakaya.',
      ],
    },
    howToEat: {
      ja: ['だし粉と青のりをかけて食べるのが定番です。', '1本ずつ注文できるので、いろいろな具を少しずつ試せます。'],
      en: [
        'Sprinkle on fish powder and green seaweed flakes.',
        'You can order skewer by skewer, so try a little of everything.',
      ],
    },
    priceRange: { ja: '1本100〜200円', en: '¥100–200 per skewer' },
    mapQuery: '静岡おでん 静岡市',
    shops: [],
    affiliate: [],
  },

  // ---- 大阪府 ----
  {
    id: 'takoyaki',
    prefecture: 'osaka',
    name: { ja: 'たこ焼き', en: 'Takoyaki' },
    romaji: 'Takoyaki',
    emoji: '🐙',
    summary: {
      ja: '外はカリッ、中はとろっ。大阪の「粉もん」文化を代表する一品。',
      en: "Crispy outside, gooey inside — the star of Osaka's flour-based street food.",
    },
    body: {
      ja: [
        '小麦粉の生地にタコを入れ、専用の鉄板で丸く焼き上げる大阪のソウルフードです。',
        'ソースとマヨネーズ、青のり、かつお節をかけるのが定番ですが、だしやしょうゆ、塩で食べるお店もあります。道頓堀などの繁華街では食べ歩きも楽しめます。',
      ],
      en: [
        'Batter with a piece of octopus inside, grilled into balls on a special iron plate — the soul food of Osaka.',
        'The classic topping is sauce, mayonnaise, green seaweed and bonito flakes, but some shops serve them with dashi broth, soy sauce or salt. Great for snacking while walking around Dotonbori.',
      ],
    },
    howToEat: {
      ja: ['焼きたては中が非常に熱いので、少し冷ましてから食べましょう。', '食べ歩きの際は、ゴミの持ち帰りなどマナーにも注意を。'],
      en: [
        'Freshly made takoyaki is very hot inside — let it cool a little first.',
        'If you eat on the go, please take your trash with you.',
      ],
    },
    priceRange: { ja: '500〜800円（6〜8個）', en: '¥500–800 (6–8 pieces)' },
    mapQuery: 'たこ焼き 道頓堀',
    shops: [],
    affiliate: [],
  },
  {
    id: 'kushikatsu',
    prefecture: 'osaka',
    name: { ja: '串カツ', en: 'Kushikatsu' },
    romaji: 'Kushikatsu',
    emoji: '🍡',
    summary: {
      ja: '肉や野菜を串に刺して揚げた、新世界名物の庶民の味。',
      en: 'Deep-fried skewers of meat and vegetables, the local favorite of Shinsekai.',
    },
    body: {
      ja: [
        '牛肉や豚肉、野菜、魚介などを串に刺し、衣を付けて揚げた大阪の名物です。通天閣のある新世界には専門店が多く並びます。',
        '1本から気軽に注文でき、ビールとの相性も抜群です。',
      ],
      en: [
        'Beef, pork, vegetables and seafood are skewered, battered and deep-fried. Shinsekai, home of Tsutenkaku Tower, is packed with kushikatsu shops.',
        'You can order just one skewer at a time, and they go perfectly with a cold beer.',
      ],
    },
    howToEat: {
      ja: ['共用のソースは「二度漬け禁止」がルールです。', 'ソースを追加したいときは、無料のキャベツですくってかけましょう。'],
      en: [
        'The shared sauce has one rule: no double-dipping!',
        'Need more sauce? Use the free cabbage leaves to scoop it onto your skewer.',
      ],
    },
    priceRange: { ja: '1本100〜300円', en: '¥100–300 per skewer' },
    mapQuery: '串カツ 新世界',
    shops: [],
    affiliate: [],
  },

  // ---- 福岡県 ----
  {
    id: 'hakata-ramen',
    prefecture: 'fukuoka',
    name: { ja: '博多ラーメン', en: 'Hakata Ramen' },
    romaji: 'Hakata rāmen',
    emoji: '🍜',
    summary: {
      ja: '白濁した豚骨スープと極細麺。麺の硬さを選び、替え玉で楽しむ。',
      en: 'Creamy pork-bone broth with ultra-thin noodles — choose your firmness and order refills.',
    },
    body: {
      ja: [
        '豚骨をじっくり煮出した白く濃厚なスープに、極細のストレート麺を合わせた福岡のラーメンです。',
        '麺の硬さを「バリカタ」「カタ」「普通」などから選べ、麺だけを追加する「替え玉」の文化があります。中洲などの屋台でも味わえます。',
      ],
      en: [
        'Fukuoka’s ramen pairs a rich, milky pork-bone (tonkotsu) broth with very thin, straight noodles.',
        'You can choose how firm you want the noodles, from "barikata" (very firm) to "futsu" (regular), and order a "kaedama" (noodle refill). You can also try it at the yatai food stalls in Nakasu.',
      ],
    },
    howToEat: {
      ja: ['スープを少し残しておき、替え玉を頼むのが地元流です。', '紅しょうがや辛子高菜、すりごまで味の変化を楽しめます。'],
      en: [
        'Save some broth so you can order a kaedama refill.',
        'Try adding pickled ginger, spicy mustard greens or sesame on the table.',
      ],
    },
    priceRange: { ja: '700〜1,000円', en: '¥700–1,000' },
    mapQuery: '博多ラーメン 博多',
    shops: [],
    affiliate: [],
  },
  {
    id: 'motsunabe',
    prefecture: 'fukuoka',
    name: { ja: 'もつ鍋', en: 'Motsunabe (Offal Hot Pot)' },
    romaji: 'Motsunabe',
    emoji: '🍲',
    summary: {
      ja: 'ぷるぷるの牛もつとキャベツ、ニラをたっぷり煮込む博多の名物鍋。',
      en: "Hakata's famous hot pot with tender beef offal, cabbage and garlic chives.",
    },
    body: {
      ja: [
        '牛の小腸などのもつを、キャベツやニラ、ニンニクと一緒に煮込む福岡の名物鍋です。',
        'しょうゆ味やみそ味が定番で、最後にちゃんぽん麺を入れて締めるのが人気です。',
      ],
      en: [
        'Beef offal is simmered with cabbage, garlic chives and garlic in this Fukuoka specialty.',
        'Soy sauce and miso broths are the most common. Finish by adding champon noodles to the leftover soup.',
      ],
    },
    howToEat: {
      ja: ['締めのちゃんぽん麺や雑炊まで楽しむのがおすすめです。', '多くのお店が2人前から注文できます。'],
      en: [
        'Do not skip the noodles or rice porridge at the end.',
        'Most restaurants serve it for two or more people.',
      ],
    },
    priceRange: { ja: '1人前1,500〜2,500円', en: '¥1,500–2,500 per person' },
    mapQuery: 'もつ鍋 博多',
    shops: [],
    affiliate: [],
  },
];

export function gourmetsByPrefecture(prefectureId: string): Gourmet[] {
  return gourmets.filter((g) => g.prefecture === prefectureId);
}
