const fs = require('fs');

// 簡易的な MML パーサー → ZMS バイナリデータ生成
function convertMMLtoZMS(mml) {
    const header = Buffer.from("ZMUSIC2.08", "utf-8"); // 仮のヘッダー
    const tempo = mml.match(/T(\d+)/) ? parseInt(mml.match(/T(\d+)/)[1], 10) : 120;
    const notes = mml.replace(/[^CDEFGABR]/g, ""); // CDEFGAB + R（休符）のみ抽出

    let zmsData = [tempo];
    for (const note of notes) {
        zmsData.push(note.charCodeAt(0)); // 仮の変換
    }

    return Buffer.concat([header, Buffer.from(zmsData)]);
}

// ファイルの読み込みと変換処理
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

// コマンドライン引数からファイルパスを取得
if (process.argv.length < 4) {
    console.error("Usage: node mml_to_zms.js <input.mml> <output.zms>");
    process.exit(1);
}

main(process.argv[2], process.argv[3]);
