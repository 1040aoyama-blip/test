/**
 * 検索用に文字をそろえる（ビルド時とブラウザの両方で使う）。
 * 全角・半角、大文字・小文字、カタカナ・ひらがな、アクセント記号の違いを無視する。
 * 例: 「ラーメン」「らーめん」、「Hoto」「hōtō」は同じものとして扱う。
 */
export function normalizeForSearch(text: string): string {
  return (
    text
      .normalize('NFKC')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .normalize('NFC')
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      // 記号は区切りとして扱う（「Hoto (Flat Noodle…)」「、」など）。長音の「ー」は残す
      .replace(/[^\p{L}\p{N}ー]+/gu, ' ')
      .trim()
  );
}

/**
 * 検索語が文字列に含まれるか。英数字だけの語は単語の頭から一致させる
 * （「eel」で「feel」、「hoto」で「photo」が当たらないように）。日本語は文字列のどこでもよい。
 */
export function matchesTerm(text: string, term: string): boolean {
  return /^[a-z0-9]+$/.test(term) ? ` ${text}`.includes(` ${term}`) : text.includes(term);
}
