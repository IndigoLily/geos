const fs = require('fs');
const { execSync } = require('child_process');

const base_size = 4096;
const tile_size = 256;
tile(0);
function tile(zoom) {
    const numTiles = 2**zoom;
    const size = tile_size*numTiles;
    if (size < base_size) {
        tile(zoom+1);
    }

    console.log(zoom, size);
    for (let x = 0; x < numTiles; x++) {
        for (let y = 0; y < numTiles; y++) {
            fs.mkdirSync(`./tiles/${zoom}/${x}/`, {recursive:true});
            //exec(`touch './tiles/${zoom}/${x}/${y}.png'`);
            console.log(`./tiles/${zoom}/${x}/${y}.png`);
            execSync(`convert base.png -resize ${size} -crop 256x256+${x*tile_size}+${y*tile_size} +repage ./tiles/${zoom}/${x}/${y}.png`);
        }
    }
}
