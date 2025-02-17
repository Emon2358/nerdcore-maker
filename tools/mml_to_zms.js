const fs = require('fs');

function convertMMLtoZMD(mml) {
    const header = Buffer.from("ZMUSIC2.08", "utf-8"); // 仮のヘッダー
    const tempoMatch = mml.match(/T(\d+)/);
    const tempo = tempoMatch ? parseInt(tempoMatch[1], 10) : 120;
    const notes = mml.replace(/[^CDEFGABR]/g, ""); // CDEFGAB + R（休符）のみ抽出

    let zmdData = [tempo];
    for (const note of notes) {
        zmdData.push(note.charCodeAt(0));
    }

    return Buffer.concat([header, Buffer.from(zmdData)]);
}

function main(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
        console.error("MML ファイルが存在しません:", inputPath);
        process.exit(1);
    }

    const mml = fs.readFileSync(inputPath, "utf-8");
    const zmdData = convertMMLtoZMD(mml);
    fs.writeFileSync(outputPath, zmdData);

    console.log("ZMD 変換完了:", outputPath);
}

if (process.argv.length < 4) {
    console.error("Usage: node mml_to_zmd.js <input.mml> <output.zmd>");
    process.exit(1);
}

main(process.argv[2], process.argv[3]);
