/// <reference types="@mapeditor/tiled-api" />
//UltimateCataclysm
//ChibiUltica
//0x400 | 0x2000 | 0x4000 qdir filter for dir no dot and dotdot
//0x002 | 0x2000 | 0x4000 qdir filter for file no dot and dotdot
var verbose = true
var pathToProject = FileInfo.toNativeSeparators('E:/df/tileset/')
var PathToCDDA = FileInfo.toNativeSeparators('E:/df/cdda/dda/current/')
var PathToTileSets = PathToCDDA + FileInfo.toNativeSeparators('gfx/')
var ChosenTileSet = 'ChibiUltica'
var pathToPalettes = PathToCDDA + FileInfo.toNativeSeparators('data/json/mapgen_palettes/')
var pathToTSX = FileInfo.toNativeSeparators(pathToProject+'tsx/')

var PathToTileSet = FileInfo.toNativeSeparators(ChosenTileSet + '/')
var PathToJSON = PathToTileSets + PathToTileSet + 'tile_config.json'

const mapLayerTypes = ['terrain','furniture']

var skipOverlays = true;
var overwriteExisting = false;


function writeToFile(filename,format,data) {
    const file = new TextFile(pathToProject+filename + "." + format, TextFile.WriteOnly);
    if (format == 'tsx'){
        tiled.tilesetFormat(format).write(data, pathToProject + filename + "." + format)
    }
    if (format == 'tmx'){
        tiled.mapFormat(format).write(data, pathToProject + filename + "." + format)
    }
}
function readJSONFile(filepath){
        const file = new TextFile(filepath, TextFile.ReadOnly)
        const file_data = file.readAll()
        file.close()
        return JSON.parse(file_data)
}
function getRecursiveFilePathsInFolder(targetPath){
    if (verbose){tiled.log(`getting paths to palette files`);};
    let filePaths = getFilesInPath(targetPath).map(a => targetPath+a)
    let folderPaths = getFoldersInPath(targetPath).map(a => targetPath+a);
    for (let folderPath in folderPaths){
        filePaths = filePaths.concat(getFilesInPath(folderPath).map(a => folderPath+a));
        let subfolders = getFoldersInPath(folderPath).map(a => folderPath+a)
        for (let subfolder in subfolders){
            if ( subfolders != null ) { folderPaths.push(subfolder) }
        }
    }
    if (verbose){tiled.log(`palette file paths`);};
    if (verbose){tiled.log(filePaths);};
    return filePaths;
}
function getFilesInPath(path){ return File.directoryEntries(path, 0x002 | 0x2000 | 0x4000);}
function getFoldersInPath(path){ return File.directoryEntries(path, 0x400 | 0x2000 | 0x4000);}
function initialize(){
    /*TODO
    ask about folders
    get all filenames to expect
    check if files already made
    fill in missing files
    ask if overwrite/update eixisting

    let q = new Qt.QWidget()
    let loc = new Qt.FileEdit()
    tiled.log(loc)
    */

    //prompt(label: string, text?: string, title?: string): string
    //tiled.prompt("Path to project: ")
    let projfiles = File.directoryEntries(pathToProject)
    const projstring = '.tiled-project'
    const matches = projfiles.filter(element => {
        if (element.includes(projstring)) {
            return true;
        }
    });
    tiled.log(`matches: ${matches}`)
    //confirm(text: string, title?: string): boolean
    let txt = new FileEdit();
    tiled.log(`txt: ${txt}`)
}
function processTileset(j,i){
    //tiled.log(`i: ${i}`)

    let jts = {};

    //get name of tileset image
    let imgFile = j['tiles-new'][i]['file']
    jts.name = FileInfo.baseName(imgFile)

    //skip existing ("just skip existing altogether bro") and 'fallback'
    let shouldSkip = !overwriteExisting && File.exists(pathToTSX + jts.name + ".tsx") || skipOverlays && imgFile.match(/(fallback)/);
    if (shouldSkip){
        tiled.log(`skipping ${jts.name}`)
        return [0,0];
    }
    tiled.log(`working on ${jts.name}`);

    //tileset parameters
    //dimensions
    jts.width = j['tiles-new'][i]['sprite_width'];
    jts.height = j['tiles-new'][i]['sprite_height'];
    //offsets
    (typeof j['tiles-new'][i]['sprite_offset_x'] == 'number') ? jts.xOffset = j['tiles-new'][i]['sprite_offset_x'] : jts.xOffset = 0;
    (typeof j['tiles-new'][i]['sprite_offset_y'] == 'number') ? jts.yOffset = j['tiles-new'][i]['sprite_offset_y'] : jts.yOffset = 0;

    jts.range = [Number(j['tiles-new'][i]['//'].match(/\d+/)[0]),Number(j['tiles-new'][i]['//'].match(/\d+$/)[0])]
    let localIDRange = jts.range[1]-jts.range[0]

    tiled.log(`tileset range: ${jts.range[0]} - ${jts.range[1]}`);
    tiled.log(`tileset dimensions: ${jts.width}, ${jts.height}`);
    tiled.log(`tileset offset: ${jts.xOffset}, ${jts.yOffset}`);
    if (jts.height > 32){
        jts.offset = Qt.point(jts.xOffset,(32 + jts.yOffset));
    } else {
        jts.offset = Qt.point(jts.xOffset, jts.yOffset);
    }

    //construct tiled tileset
    var ts = new Tileset(jts.name);
    tiled.log((ts.isTileset) ? "new tileset created: " + ts.name : "no tileset made");

    (typeof jts.width == 'number') ? ts.tileWidth = jts.width : ts.tileWidth = j['tile_info'][0]['width'];
    (typeof jts.height == 'number') ? ts.tileHeight = jts.height : ts.tileHeight = j['tile_info'][0]['width'];
    
    ts.tileOffset = jts.offset;

    //load tilesheet image from file
    let img = new Image(jts.name);
    img.load(PathToTileSets+PathToTileSet+imgFile);
    tiled.log(`Image is ${img.width} by ${img.height} - ${PathToTileSets+PathToTileSet+imgFile}`)

    //load tilesheet image into tilesheet (source not embed)
    ts.loadFromImage(img,PathToTileSets+PathToTileSet+imgFile)

    tiled.log(`tileset name: ${ts.resolvedProperty('name')}`)
    tiled.log(`number of sprites: ${ts.tileCount}`)

    return {ts,jts};
}
function importSpriteData(ts,jts,j,i){
    let tiles = j['tiles-new'][i]['tiles']
    for (let tile of tiles){
        tiled.log('------')
        tiled.log(tile['id'])

        let cdda_IDs = []
        if (tile["animated"]){
            tiled.log(`is animated`)
            for (let subtile of tile['fg']){
                for (let subtile in tile['fg']){
                    if (typeof tile['fg'][subtile] != 'number'){
                        cdda_IDs.push(tile['fg'][subtile]['sprite'])
                    }
                }
            }
        }
        if (tile["multitile"]){
            tiled.log(`is multitile`)
            cdda_IDs.push(tile['fg'])
            for (let subtile in tile["additional_tiles"]){
                if (Array.isArray(tile["additional_tiles"][subtile]['fg'])){
                    for (let subSubtile in tile["additional_tiles"][subtile]['fg']){
                        if (typeof tile["additional_tiles"][subtile]['fg'][subSubtile] == 'number'){
                            cdda_IDs.push(tile["additional_tiles"][subtile]['fg'][subSubtile])
                        }

                        if (typeof tile["additional_tiles"][subtile]['fg'][subSubtile]['sprite'] == 'number'){
                            cdda_IDs.push(tile["additional_tiles"][subtile]['fg'][subSubtile]['sprite'])
                        } else {
                            for (let sprite in tile["additional_tiles"][subtile]['fg'][subSubtile]['sprite']){
                                cdda_IDs.push(tile["additional_tiles"][subtile]['fg'][subSubtile]['sprite'][sprite])
                            }
                        }
                    }
                } else {
                    cdda_IDs.push(tile["additional_tiles"][subtile]['fg'])
                    //subtile['id']
                }
            }
        }
        if (!tile["animated"] && !tile["multitle"]){
            if (Array.isArray(tile['fg'])){
                for (let subtile in tile['fg']){
                    if (typeof tile['fg'][subtile] != 'number'){
                        cdda_IDs.push(tile['fg'][subtile]['sprite'])
                    } else { 
                        cdda_IDs.push(tile['fg'][subtile])
                    }
                }
            } else {
                cdda_IDs.push(tile['fg'])
            }
            if (typeof tile['bg'] == 'number'){
                //cdda_IDs.push(tile['bg'])
            }

        }
        /*
        if(Array.isArray(tile['fg'])){
            if(isNaN(tile['fg'][0])){
                for (let k in tile['fg']){
                    cdda_IDs = [tile['fg'][k]['sprite']]
                }
            } else {
                cdda_IDs = tile['fg']
            }
        } else {
            cdda_IDs = [tile['fg']]
        }
        */

        //{ "id": "f_air_conditioner", "fg": 3841 },
        //{ "id": "f_armchair", "rotates": true, "fg": [ 3844, 3845, 3843, 3842 ] },

        //if local assigned id is out of range, skip
        tiled.log("CDDA IDs logged")
        tiled.log(cdda_IDs)
        const cdda_IDsOriginal = cdda_IDs
        cdda_IDs = []
        cdda_IDsOriginal.map(e => (jts.range[0] <= e && e <= jts.range[1]) ? cdda_IDs.push(e) : 0);
        tiled.log(`CDDA IDs found in range ${jts.range[0]} - ${jts.range[1]}`)
        tiled.log(cdda_IDs)
        if (cdda_IDs === []) {continue}

        //cdda_IDs = cdda_IDs.map(e => jts.range[0] > e > jts.range[1])
        //if (cdda_IDs[0] > jts.range[1] || cdda_IDs[0] < jts.range[0]){
        //    continue
        //}

        tiled.log(`CDDA IDs:`)
        tiled.log(cdda_IDs)
        let LocalID = 0;
        for (let t in cdda_IDs){
            //offset 1st tile in tileset range
            (jts.range[0] == 1) ? LocalID = cdda_IDs[t] - jts.range[0] + 1 : LocalID = cdda_IDs[t] - jts.range[0]
            tiled.log(`cdda id: ${cdda_IDs[t]} >>> Local tile ID: ${LocalID}`);
            let currentTile = ts.findTile(LocalID)
            //set custom properties
            currentTile.setProperty('CDDA_ID', tile['id'])
        }


    }
    return ts
}
function importTilesets(filename){

    File.makePath(pathToProject+'\\tsx')

    //read tileset config file
    let f = new TextFile(filename, TextFile.ReadOnly);
    let c = f.readAll();
    f.close();
    let j = JSON.parse(c);

    var tilesetInfoWidth = j['tile_info'][0]['width']
    var tilesetInfoHeight = j['tile_info'][0]['height']
    var tilesetInfoPixelscale = j['tile_info'][0]['pixelscale']

    tiled.log(`Importing '${ChosenTileSet}' with dimensions w:${tilesetInfoWidth} h:${tilesetInfoHeight} pixelscale:${tilesetInfoPixelscale}`)

    //iterate over tilset config entries

    for (let i in j['tiles-new']){
        let {ts,jts} = processTileset(j,i)
        if (ts == null){
            continue
        }
        ts = importSpriteData(ts,jts,j,i)

        let pathToTSX = "tsx\\" + ts.name
        let outputFileResults = writeToFile(pathToTSX,"tsx",ts);
        (outputFileResults == null) ? tiled.log(ts.name + " file created successfully.") : tiled.log(ts.name + " - FAILED to create file. Error: " + outputFileResults)
        tiled.log('-----TSX------')
        tiled.log('-----DONE-----')

    }
}
function prepareTilemap(mapName = 'CDDA_map_24x24',mapsize = 24){
    let tm = new TileMap()
    let tmname = mapName
    tm.setSize(mapsize, mapsize);
    tm.setTileSize(32, 32);
    tm.orientation = TileMap.Orthogonal;
    tiled.log(`tilemap name: ${tmname}`)
    return tm
}
function makeEmptyMap(){
    let tmname = 'CDDA_map_24x24'
    let tm = prepareTilemap(tmname);
    let terrain = new TileLayer('Terrain');
    terrain.width = mapsize
    terrain.height = mapsize
    let furniture = new TileLayer('furniture');
    furniture.width = mapsize
    furniture.height = mapsize
    let items = new TileLayer('items');
    items.width = mapsize
    items.height = mapsize
    let entities = new TileLayer('entities');
    entities.width = mapsize
    entities.height = mapsize

    //in order from bottom to top
    tm.addLayer(terrain)
    tm.addLayer(furniture)
    tm.addLayer(items)
    tm.addLayer(entities)

    File.makePath(pathToProject+'\\tmx')
    let pathToTMX = "tmx\\" + tmname
    let outputFileResults = writeToFile(pathToTMX,"tmx",tm);
    (outputFileResults == null) ? tiled.log(tmname + " file created successfully.") : tiled.log(tmname + " - FAILED to create file. Error: " + outputFileResults)
}

function buildTilePaletteDict(j,i){
    tiled.log(`------- Palette Loading Area ---------`);

    function getPaletteFileData(mapFilePalettes,filepath){
        const file = new TextFile(filepath, TextFile.ReadOnly)
        const file_data = file.readAll()
        file.close()
        let paletteFileJSON = JSON.parse(file_data)

        let thisPalette = {}
        for (let p of paletteFileJSON){
            // let thisPalette = paletteFileData[p]
            // tiled.log(`palette id '${p['id']}'`)
            if (p['type'] != "palette"){continue;};
            if (mapFilePalettes.includes(p['id'])){
                tiled.log(`id '${p['id']}' found in ${FileInfo.fileName(filepath)}. Importing...`)
                // mapPalette['terrain'] = Object.assign(mapPalette['terrain'], p['terrain']);
                for (let mapLayerType of mapLayerTypes){
                    thisPalette[mapLayerType] = {}
                    for (let key in p[mapLayerType]){
                        thisPalette[mapLayerType][key] = p[mapLayerType][key]
                        // if (typeof p[mapLayerTypes[mapLayerType]][key] == "string"){
                        //     thisPalette[key] = p[mapLayerTypes[mapLayerType]][key]
                        // } else if (typeof p[mapLayerTypes[mapLayerType]][key]['fallback'] == "string"){
                        //     thisPalette[key] = p[mapLayerTypes[mapLayerType]][key]['fallback']
                        // } else if (typeof p[mapLayerTypes[mapLayerType]][key][0] == "string"){
                        //     thisPalette[key] = p[mapLayerTypes[mapLayerType]][key][0]
                        // }/* else if (typeof p[mapLayerTypes[mapLayerType]][key][0][0] == "string"){
                        //     thisPalette[key] = p[mapLayerTypes[mapLayerType]][key][0][0]
                        // } else if (typeof p[mapLayerTypes[mapLayerType]][key][0][0][0] == "string"){
                        //     thisPalette[key] = p[mapLayerTypes[mapLayerType]][key][0][0][0]
                        // }*/
                        tiled.log(`${key} > ${p[mapLayerType][key]}\t\tadded to palette'${mapLayerType}'.`)
                    }
                }
            }
        }
        return thisPalette;
    }
    function getMapfileCustomPalette(j){
        let thisPalette = {}
        for (let mapLayerType of mapLayerTypes){
        thisPalette[mapLayerType] = {}
            for (let key in j[i]['object'][mapLayerType]){
                thisPalette[mapLayerType][key] = j[i]['object'][mapLayerType][key]
                // if(mapPalette[mapLayerType][key] == "interior_wall_type"){

                // }
                // if (typeof j[i]['object'][mapLayerType][key] == "string"){
                //     thisPalette[key] = j[i]['object'][mapLayerType][key]
                // } else {
                //     thisPalette[key] = j[i]['object'][mapLayerType][key][0]
                // }
                // // tiled.log(`${key} > ${j[i]['object'][mapLayerType][key]}`)
            }
        }
        return thisPalette;
    }

    // init map palette
    let mapPalette = {}
    let tempPaletteDict = {}
    for (let mapLayerType of mapLayerTypes){
        mapPalette[mapLayerType] = {};
    };

    tiled.log(`------- importing preset palettes ----`);
    let palettePaths = getRecursiveFilePathsInFolder(pathToPalettes);
    for(let file of palettePaths){
        let tempPaletteDict = getPaletteFileData(j[i]['object']['palettes'],file);
        for ( let mapLayerType of mapLayerTypes ){
            for ( let key in tempPaletteDict[mapLayerType]){
                mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]
            }
        }
    }

    tiled.log(`------- importing mapfile custom palette ---------`)
    tempPaletteDict = getMapfileCustomPalette(j);
    for (let mapLayerType of mapLayerTypes){
        for ( let key in tempPaletteDict){
            mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]
        }
    }

    tiled.log(`------- mapfile custom palette import results---------`)
    for (let mapLayerType of mapLayerTypes){
        tiled.log(`mapLayerType: ${mapLayerType}`)
        for ( let n in mapPalette[mapLayerType] ){
            tiled.log(`${n} > ${mapPalette[mapLayerType][n]}\t\tadded to palette'${mapLayerType}'.`)
        }
    }
    // clean up arrays
    let hadArray = true;
    while (hadArray){
        hadArray = false;
        for (let mapLayerType of mapLayerTypes){
            for (let item of Object.keys(mapPalette[mapLayerType])){
                if (Array.isArray(mapPalette[mapLayerType][item])){
                    hadArray = true;
                    // tiled.log("array found")
                    // tiled.log(mapPalette[mapLayerTypes[set]][item])
                    mapPalette[mapLayerType][item] = mapPalette[mapLayerType][item][0]
                    // tiled.log("pruned to")
                    // tiled.log(mapPalette[mapLayerTypes[set]][item])
                }
            }
        }
    }

    return mapPalette;
}
function importMap(){

    let pathToMap = FileInfo.toNativeSeparators(tiled.prompt("Path to CDDA .json map: ", FileInfo.toNativeSeparators("E:/df/cdda/dda/current/data/json/mapgen/house/house_detatched1.json"),"Select File").replace(/^"|"$/g, ''))
    
    if (pathToMap == ""){
        tiled.log(`import canceled`)
        return;
    }
    //File.makePath(pathToProject+'\\importedtsx')

    //read map file
    let f = new TextFile(pathToMap, TextFile.ReadOnly);
    let c = f.readAll();
    f.close();
    let j = JSON.parse(c);

    let i = 0
    var importMap = new CDDAMapEntryImport(j[i])
    function readCDDAMapFile(){

    }
    var importMapName = j[i]['om_terrain'];
    var importMapSize = j[i]['object']['rows'][0].length;
    var importMapFill = j[i]['object']['fill_ter']
    tiled.log(`${j[i]['om_terrain']}`)
    tiled.log(`${j[i]['object']['fill_ter']}`)

    let mapArray = importMap['object']['rows']

    //init mapPallete
    let mapPalette = buildTilePaletteDict(j,i)

    tiled.log(`-------after array clean---------`)
    for (let mapLayerType of mapLayerTypes){
        for (let c in mapPalette[mapLayerType]){
            tiled.log(`'${c}' > '${mapPalette[mapLayerType][c]}'\t\tadded to ${mapLayerType}`)
        }
    }

    tiled.log(`Original Map`)
    for (let row of mapArray){
        tiled.log(row)
    }
    let tm = prepareTilemap(importMap.name,importMap.width)

    //get tile numbers, cdda IDs, and tilset file 
    let tileDict = {}
    let tilesetsToLoad = []

    let tsxs = getFilesInPath(pathToTSX)
    for(let filename of tsxs){
        if (!filename.match(/\.tsx$/)){
            continue
        }
        let file = FileInfo.toNativeSeparators(pathToTSX+filename)
        let ts = tiled.open(file)
        tiled.log(`file ${file}`)
        for (let tile of ts.tiles){
            let cdda_ID = tile.properties()['CDDA_ID']
            if (!cdda_ID){continue;}
            // tiled.log(`CDDA ID '${cdda_ID}' and local Tile ID '${tile.id}'`)
            // add tilesets with matching tiles to map
            for (let mapLayerType of mapLayerTypes){
                if (cdda_ID == importMap.object.fill_ter){
                    tiled.log(`-${cdda_ID} found in palette with fill tile ${importMap.object.fill_ter} with local Tile ID ${tile.id}`)
                    tileDict["fill_ter"] = [tile.id, tile, filename] 
                    if(!tilesetsToLoad.includes(filename)){
                        tiled.log(`Adding tileset ${filename} to map.`)
                        tilesetsToLoad.push(filename)
                        tm.addTileset(ts)
                    }
                }
                if (Object.values(mapPalette[mapLayerType]).includes(cdda_ID)){
                    tiled.log(`-'${cdda_ID}'' found in tileset file with local Tile ID '${tile.id}'`)
                    tileDict[cdda_ID] = [tile.id, tile, filename]
                    if(!tilesetsToLoad.includes(filename)){
                        tiled.log(`Adding tileset ${filename} to map.`)
                        tilesetsToLoad.push(filename)
                        tm.addTileset(ts)
                    }
                }
            }
        }
        // tiled.log("ENTRIES")
        // tiled.log(Object.values(mapPalette['terrain']))
        // tiled.activeAsset(ts)
        // ts.close();
    }

    //prepare map for tiled
    // terrain fill
    function prepareMapArrayForTiled(mapLayerName){
        let tMapArray = []
        for (let row in mapArray){
            let tRow = []
            for (let cell in mapArray[row]){
                let thiscell = mapArray[row][cell]
                let newcell = 0
                // terrain fill
                if (mapLayerName == 'fill_ter'){
                    newcell = tileDict["fill_ter"][1]
                    tRow.push(newcell)
                    continue;
                }
                // hasownproperty is includes for keys
                if (mapPalette[mapLayerName].hasOwnProperty(thiscell) && tileDict[mapPalette[mapLayerName][thiscell]]) {
                    newcell = tileDict[mapPalette[mapLayerName][thiscell]][1]
                }
                if (newcell != 0) {
                    tiled.log(`newcell is of type '${typeof newcell}'`) 
                    tiled.log(`${mapLayerName} - cell ( ${cell}, ${row} )  '${thiscell}' > ${newcell.property("CDDA_ID")}`)
                } else {
                    tiled.log(`${mapLayerName} - cell ( ${cell}, ${row} )  '${thiscell}' > ${newcell}`)
                }
                //tiled.log(`becomes: ${newcell}`)
                tRow.push(newcell)
            }
            tMapArray.push(tRow)
        }
        return tMapArray;
    }

    let mapArrays = {}
    mapArrays['fill_ter'] = prepareMapArrayForTiled('fill_ter')
    for (let mapLayerType of mapLayerTypes){
        tiled.log(`preparing map array for layer '${mapLayerType}'`)
        mapArrays[mapLayerType] = prepareMapArrayForTiled(mapLayerType)
    }
    //show map layers in console
    /*
    for (let row in mapArrays['terrain']){
        tiled.log(mapArrays['terrain'][row])
    }
    */

    // Prepare tiled layer
    function prepareTiledLayer(layername){

        let tln = layername;
        let tl = new TileLayer(tln);
        tl.width = importMapSize;
        tl.height = importMapSize
        tl.setProperty("CDDA_Layer", tln)
        // tl.className = tln;
        let tle = tl.edit()

        tiled.log(`editing layer ${tle.target.name}`)

        for (let row in mapArrays[layername]){
            let y = row
            for (let cell in mapArrays[layername][row]){
                let x = cell
                if (layername == 'fill_ter'){
                    tle.setTile(x,y,mapArrays[layername][row][cell])
                }
                tle.setTile(x,y,mapArrays[layername][row][cell])
                // if (mapArrays[layername][row][cell] != 0){
                //     tiled.log(`tile set at (${x}, ${y}) for ${mapArrays[mapLayerTypes[set]][row][cell]}`)
                // }
            }
        }

        //setTile(x: number, y: number, tile: null | Tile, flags?: number): void
        tle.apply()
        return tl;
    }
        tm.addLayer(prepareTiledLayer('fill_ter'))
    for (let mapLayerType of mapLayerTypes){
        tm.addLayer(prepareTiledLayer(mapLayerType))
    }
    File.makePath(pathToProject+'\\tmx')
    let pathToTMX = "tmx\\" + importMapName
    let outputFileResults = writeToFile(pathToTMX,"tmx",tm);
    (outputFileResults == null) ? tiled.log(importMapName + " file created successfully.") : tiled.log(importMapName + " - FAILED to create file. Error: " + outputFileResults)
}

class CDDAMapEntryImport {
    // noinspection DuplicatedCode
    /**
     * Constructs a new instance of the tileset exporter
     * @ param {string} fileName path of the file the tileset should be exported to
     */
    constructor(entry) {
        this.name = entry['om_terrain'];
        this.width = entry['object']['rows'][0].length;
        this.height = entry['object']['rows'].length;
        this.fill_ter = entry['object']['fill_ter'];
        this.weight = entry['weigth'];
        this.object = {
            "fill_ter": entry['object']['fill_ter'],
            "palettes": entry['object']['palettes'],
            "rows": entry['object']['rows'],
            "terrain":entry['object']["terrain"],
            "furniture": entry['object']["furniture"],
            "place_loot": entry['object']["place_loot"],
            "place_item": entry['object']["place_item"],
            "place_items": entry['object']["place_items"],
            "place_monsters": entry['object']["place_monsters"],
            "place_vehicles": entry['object']["place_vehicles"]
        };
    };
};
class CDDAMapEntry {

    // noinspection DuplicatedCode
    /**
     * Constructs a new instance of the tileset exporter
     * @ param {string} fileName path of the file the tileset should be exported to
     */
    constructor(fileName = "My_CDDA_Map",cddalayer = "") {
        this.type = "mapgen";
        this.method = "json";
        this.om_terrain = fileName+cddalayer;
        this.weight = 100;
        this.object = {
            "fill_ter": "t_floor",
            "palettes": [],
            "rows": [],
            "terrain": {},
            "furniture": {},
            "place_loot": [],
            "place_item": [],
            "place_items": [],
            "place_monsters": [],
            "place_vehicles": []
        };
    };
};

function prepareExportMap(map){


    // tiled.log(tiled.openAssets)
    if (!tiled.activeAsset.isTileMap){ return tiled.log(`Not on a valid tilemap.`); }
    const currentMap_tm = tiled.activeAsset // get current map
    let mapEntries = []
    function prepareEntry(layer){
        let mapEntry = new CDDAMapEntry(currentMap_tm.fileName,currentMap_tm.className)
        mapEntry["om_terrain"] = FileInfo.baseName(currentMap_tm.fileName)
        mapEntry["palettes"] = ["standard_domestic_palette"]
        if (layer.property("CDDA_Layer") == "fill_ter"){
            mapEntry.object['fill_ter'] = layer.tileAt(0,0).property("CDDA_ID");
            return;
        }
        tiled.log(layer.name)
        tiled.log(layer.width)
        tiled.log(layer.height)
        let tRows = []
        for (let y = 0; y < layer.height; y++){
            let row = ""
            for (let x = 0; x < layer.height; x++){
                // tiled.log(`${x}, ${y}`)
                if (layer.tileAt(x,y) != null) {
                    if (typeof layer.tileAt(x,y).property("CDDA_ID") == "string") {
                        tiled.log(`( ${x}, ${y})  ${layer.tileAt(x,y).property("CDDA_ID")}`)
                        row = row + layer.tileAt(x,y).property("CDDA_ID").slice(2,3)
                    } else {
                        row = row + " "
                        // tiled.log(`( ${x}, ${y})  no cdda tile at location`)
                    }
                } else {
                    row = row + " "
                    // tiled.log(`( ${x}, ${y})  no cdda tile at location`)
                }
            }
            mapEntry.object.rows.push(row)
        }
        for (let d in mapEntry.object){
            if (mapEntry.object[d] == "" || (typeof mapEntry.object[d] === "object" &&  Object.keys(mapEntry.object[d]).length === 0)){ delete mapEntry.object[d]; };
        };
        return mapEntry;
    }
    for (let layer of currentMap_tm.layers){
        mapEntries.push(prepareEntry(layer))
    }
    
    // delete unused fields from map entry
    // tiled.log(mapEntries[0].object.rows[4])
    return mapEntries;
}

var CDDAMapFormat = {
    name: "CDDA map format",
    extension: "json",

    write: function(map, fileName) {
        var m = prepareExportMap(map);

        var file = new TextFile(fileName, TextFile.WriteOnly);
        file.write(JSON.stringify(m, null, 2));
        file.commit();
    }
}


//import CDDA Tileset
const action_importTileset = tiled.registerAction("CustomAction_importTileset", function(action_importTileset) {
    tiled.log(`${action_importTileset.text} was run.`)
    importTilesets(PathToJSON)
});
//Create New Map
const action_createNewMap = tiled.registerAction("CustomAction_createNewMap", function(action_createNewMap) {
    tiled.log(`${action_createNewMap.text} was run.`)
    makeEmptyMap()
});
//Import CDDA Map
const action_importMap = tiled.registerAction("CustomAction_importMap", function(action_importMap) {
    tiled.log(`${action_importMap.text} was run.`)
    //initialize()
    importMap()
});
//Export CDDA Map
const action_exportMap = tiled.registerAction("CustomAction_exportMap", function(action_exportMap) {
    tiled.log(`${action_exportMap.text} was run.`)
    //initialize()
    prepareExportMap()
});

action_importTileset.text = "Import CDDA tileset"
action_createNewMap.text = "Create new CDDA map"
action_importMap.text = "Import CDDA map"
action_exportMap.text = "Export to CDDA map"
action_exportMap.shortcut = "CTRL+D"

//tiled.log(tiled.menus)
tiled.extendMenu("File", [
    { separator: true },
    { action: "CustomAction_importTileset", before: "Close" },
    { action: "CustomAction_createNewMap", before: "Close" },
    { action: "CustomAction_importMap", before: "Close" },
    { separator: true }
]);
tiled.registerMapFormat("CDDAmap", CDDAMapFormat)
tiled.extendMenu("Map", [
    { separator: true },
    { action: "CustomAction_exportMap", before: "AutoMap" },
    { separator: true }
]);