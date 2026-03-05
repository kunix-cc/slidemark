# slidemark

Markdownでスライドを作ろう

---

## 特徴

- Markdownで書くだけ
- `---` でスライドを区切る
- 外部依存ゼロ
- ライブプレビュー対応

---

## コードも書ける

```typescript
const greeting = "Hello, slidemark!";
console.log(greeting);
```

インラインコードも `こんな感じ` で使える。

---

## GFM対応

| 機能 | 対応 |
|------|------|
| テーブル | ✓ |
| タスクリスト | ✓ |
| 取り消し線 | ✓ |

- [x] Markdownパーサ
- [x] HTMLテンプレート
- [ ] もっとテーマを追加

---

## 引用とリスト

> シンプルであることは究極の洗練である
> — レオナルド・ダ・ヴィンチ

1. Markdownを書く
2. `slidemark` を実行
3. プレゼン開始！

---

## 使い方

```bash
# HTMLファイルに変換
bun run index.ts slides.md -o slides.html

# ライブプレビュー
bun run index.ts slides.md --serve
```

---

# ありがとう！

**← →** キーでスライドを操作
