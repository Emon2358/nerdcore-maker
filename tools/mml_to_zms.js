const fs = require('fs');

/**
 * MML を ZMS に変換する関数
 * ※ 以下の実装はサンプルです。実際の ZMS 仕様に合わせて変換処理を調整してください。
 */
function convertMMLtoZMS(mml) {
  // 仮のZMS用ヘッダー（必要に応じて修正してください）
  const header = Buffer.from("ZMUSIC ZMS", "utf-8");
  
  // MML からテンポ情報を抽出（例: T120 → 120）
  const tempoMatch = mml.match(/T(\d+)/);
  const tempo = tempoMatch ? parseInt(tempoMatch[1], 10) : 120;
  
  // MML から音符情報を抽出（例: C, D, E, F, G, A, B, R（休符））
  const notes = mml.replace(/[^CDEFGABR]/g, "");

  // ここでは先頭にテンポ値（1バイトと仮定）を付加し、続いて各音符の文字コードを格納
  // ※ 実際のフォーマットに合わせて変換処理を調整してください
  let zmsData = [tempo];
  for (const note of notes) {
    zmsData.push(note.charCodeAt(0));
  }

  return Buffer.concat([header, Buffer.from(zmsData)]);
}

function main(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.error("MML ファイルが存在しません:", inputPath);
    process.exit(1);
  }

  const mml = fs.readFileSync(inputPath, "utf-8");
  const zmsData = convertMMLtoZMS(mml);
  fs.writeFileSync(outputPath, zmsData);

  console.log("ZMS 変換完了:", outputPath);
}

if (process.argv.length < 4) {
  console.error("Usage: node mml_to_zms.js <input.mml> <output.zms>");
  process.exit(1);
}

main(process.argv[2], process.argv[3]);
