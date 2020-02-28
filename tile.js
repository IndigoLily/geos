const fs = require('fs');
const { execSync } = require('child_process');

const maxLevel = 5;
const tileSize = 256;
execSync('rm -r tiles');
for (let z = 0; z <= maxLevel; z++) {
    const numTiles = 2**z;
    const size = tileSize*numTiles;
    execSync(`inkscape -z -e base.png -w ${size} -h ${size} base.svg`);
    for (let x = 0; x < numTiles; x++) {
        for (let y = 0; y < numTiles; y++) {
            fs.mkdirSync(`./tiles/${z}/${x}/`, {recursive:true});
            console.log(`./tiles/${z}/${x}/${y}.png`);
            execSync(`convert base.png -crop 256x256+${x*tileSize}+${y*tileSize} +repage ./tiles/${z}/${x}/${y}.png`);
        }
    }
}
