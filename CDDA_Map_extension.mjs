/// <reference types="@mapeditor/tiled-api" />
//ChibiUltica
//0x400 | 0x2000 | 0x4000 qdir filter for dir no dot and dotdot
//0x002 | 0x2000 | 0x4000 qdir filter for file no dot and dotdot
//JSON.stringify(m, null, 2) sringify with formatting
var verbose = true

const mapLayerTypes = ['terrain','furniture']

var skipOverlays = true;
var overwriteExisting = false;
var config = {}


function initialize(){
    // if ( Object.keys(config).length != 0 ) { return; }
    // var activeAsset = tiled.activeAsset;
    var pathToProject = FileInfo.toNativeSeparators(tiled.prompt("Path to Tile project:","~/cdda_tiled_project","Tiled Project Path"))
    var pathToConfig = FileInfo.toNativeSeparators(pathToProject+"/tiled_cdda_extension.json")
    if(!File.exists(pathToProject)){File.makePath(pathToProject);}

    if(!File.exists(pathToConfig)){
        tiled.log(`no config file found at ${pathToConfig}. Making new config file.`) 
        let givenPathToCDDA = FileInfo.toNativeSeparators(tiled.prompt("Path to CDDA folder:",config.pathToCDDA,"CDDA Path"))
        config = new extensionConfig(pathToProject,givenPathToCDDA);
        config.chosenTileset = tiled.prompt("Choose a tileset by name:","ChibiUltica","Tileset Name")
        if( !File.exists(config.pathToTSX)){File.makePath(config.pathToTSX);}
        if( !File.exists(config.pathToTMX)){File.makePath(config.pathToTMX);}

        var file = new TextFile(pathToConfig, TextFile.WriteOnly);
        file.write(JSON.stringify(config,null,2));
        file.commit();
    } else {
        tiled.log(`config file found at ${pathToConfig}`) 
        config = readJSONFile(pathToConfig)
        if( !File.exists(config.pathToTSX)){File.makePath(config.pathToTSX);}
        if( !File.exists(config.pathToTMX)){File.makePath(config.pathToTMX);}
    }
}


//tiled.tilesetFormat("tsx").write(ts,pathToTSXFile)
function writeToFile(filepath,data) {
    var format = filepath.match(/\.(.+)$/)
    // const file = new TextFile(filepath, TextFile.WriteOnly);
    if (format == 'tsx'){
        tiled.log(`Writing to file: '${filepath}'`)
        return tiled.tilesetFormat(format[1]).write(data, filepath);
    }
    if (format == 'tmx'){
        tiled.log(`Writing to file: '${filepath}'`)
        return tiled.mapFormat(format[1]).write(data, filepath);
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
    let filePaths = getFilesInPath(targetPath).map(a => FileInfo.toNativeSeparators(targetPath+"/"+a))
    let folderPaths = getFoldersInPath(targetPath).map(a => targetPath+"/"+a);
    for (let folderPath in folderPaths){
        filePaths = filePaths.concat(getFilesInPath(folderPath).map(a => folderPath+"/"+a));
        let subfolders = getFoldersInPath(folderPath).map(a => folderPath+"/"+a)
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
    
function importTilesets(filename){

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
            //{ "id": [ "molotov", "sling-ready_molotov" ], "fg": 3174 },

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
                if ( Array.isArray(tile["id"]) ){
                    for ( let n in tile["id"]){
                        currentTile.setProperty('CDDA_ID_'+n.toString(), tile['id'][n])
                    }
                } else {
                    currentTile.setProperty('CDDA_ID_0', tile['id'])
                }
            }


        }
        return ts
    }
    function processTileset(j,i){
        //tiled.log(`i: ${i}`)

        let jts = {};

        //get name of tileset image
        let imgFile = j['tiles-new'][i]['file']
        jts.name = FileInfo.baseName(imgFile)

        //skip existing ("just skip existing altogether bro") and 'fallback'
        let shouldSkip = !overwriteExisting && File.exists(config.pathToTSX + "/" + jts.name + ".tsx") || skipOverlays && imgFile.match(/(fallback)/);
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
        tiled.log((ts.isTileset) ? `new tileset created: '${ts.name}'` : `Failed to make tileset '${ts.name}'`);

        (typeof jts.width == 'number') ? ts.tileWidth = jts.width : ts.tileWidth = j['tile_info'][0]['width'];
        (typeof jts.height == 'number') ? ts.tileHeight = jts.height : ts.tileHeight = j['tile_info'][0]['width'];
        
        ts.tileOffset = jts.offset;

        //load tilesheet image from file
        let img = new Image(jts.name);
        let pathToChosenTileset = FileInfo.toNativeSeparators(config.pathToChosenTileset+"/"+imgFile)
        img.load(pathToChosenTileset);
        tiled.log(`Image is ${img.width} by ${img.height} - ${pathToChosenTileset}`)

        //load tilesheet image into tilesheet (source not embed)
        ts.loadFromImage(img,pathToChosenTileset)

        tiled.log(`tileset name: ${ts.name}`)
        tiled.log(`tileset image: ${FileInfo.toNativeSeparators(ts.image)}`)
        tiled.log(`number of sprites: ${ts.tileCount}`)

        return {ts,jts};
    }
    // File.makePath(config.pathtoProject+'\\tsx')

    //read tileset config file
    let f = new TextFile(filename, TextFile.ReadOnly);
    let c = f.readAll();
    f.close();
    let j = JSON.parse(c);

    var tilesetInfoWidth = j['tile_info'][0]['width']
    var tilesetInfoHeight = j['tile_info'][0]['height']
    var tilesetInfoPixelscale = j['tile_info'][0]['pixelscale']

    tiled.log(`Importing '${config.chosenTileset}' with dimensions w:${tilesetInfoWidth} h:${tilesetInfoHeight} pixelscale:${tilesetInfoPixelscale}`)

    //iterate over tilset config entries

    for (let t in j['tiles-new']){
        let {ts,jts} = processTileset(j,t)
        if (ts == null){ continue; }
        ts = importSpriteData(ts,jts,j,t)
        let pathToTSXFile = FileInfo.toNativeSeparators(config.pathToTSX + "/" + ts.name+".tsx");
        tiled.log(`Preparing to write ${(ts.isTileset) ? `tilesheet` : `not a tilesheet`} '${ts.name}' to '${pathToTSXFile}'`)
        // let outputFileResults = writeToFile(pathToTSXFile,ts);
        let outputFileResults = tiled.tilesetFormat("tsx").write(ts,pathToTSXFile)
        // (outputFileResults == null) ? tiled.log(ts.name + " file created successfully.") : tiled.log(`FAILED to create file at '${pathToTSXFile}'' - Error: ${outputFileResults}`)
        tiled.log('------------------------TSX DONE-------------------------')

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

    let filepath = config.pathToTMX+"/"+tmname+".tmx"
        // return tiled.mapFormat(format[1]).write(data, filepath);
    let outputFileResults = writeToFile(filepath,tm);
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
    let palettePaths = getRecursiveFilePathsInFolder(config.pathToPalettes);
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
                if (typeof mapPalette[mapLayerType][item] === "object"){
                    if ("fallback" in mapPalette[mapLayerType][item]){
                        mapPalette[mapLayerType][item] = mapPalette[mapLayerType][item]["fallback"]
                    }
                }


                /* else if(typeof mapPalette[mapLayerType][item] != "string"){
                    if(Object.keys(mapPalette[mapLayerType][item]).length > 0){
                        mapPalette[mapLayerType][item] = mapPalette[mapLayerType][item]["fallback"]
                    }
                }*/
            }
        }
    }

    return mapPalette;
}
function importMap(){

    let pathToMap = tiled.prompt("Path to CDDA .json map: ", FileInfo.toNativeSeparators(config.pathToCDDA + "/data/json/mapgen/house/house_detatched1.json", "Path to Map"),"Select File").replace(/^"|"$/g, '')
    
    if (pathToMap == false){
        tiled.log(`import canceled`)
        return;
    }
    pathToMap = FileInfo.toNativeSeparators(pathToMap)
    //File.makePath(config.pathtoProject+'\\importedtsx')

    //read map file
    let f = new TextFile(pathToMap, TextFile.ReadOnly);
    let c = f.readAll();
    f.close();
    let j = JSON.parse(c);

    let i = 0
    var importMap = new CDDAMapEntryImport(j[i])
    function readCDDAMapFile(){
        tiled.log("test")
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
    let tileDict = {};
    let tilesetsToLoad = [];
    let tilesetObjects = {};

    let tsxs = getFilesInPath(config.pathToTSX);
    for(let filename of tsxs){
        if (!filename.match(/\.tsx$/)){
            continue;
        }
        let filepath = FileInfo.toNativeSeparators(config.pathToTSX+ "/" +filename)
        tiled.log(`file ${filepath}`)

        let tsxTiles = TSXread(filepath) // { filepath, tiles: { id: { class, probabiltiy, properties: { property: value }}}}
        let tilesetname = FileInfo.baseName(filepath)


        for ( let tsxTileID in tsxTiles.tiles ){
            if (!tsxTiles.tiles[tsxTileID].properties["CDDA_ID_0"]){continue;}
            // fill terrain
            if (tsxTiles.tiles[tsxTileID].properties["CDDA_ID_0"] == importMap.object.fill_ter){
                if (verbose){tiled.log(`-${tsxTiles.tiles[tsxTileID].properties["CDDA_ID_0"]} found in palette with fill tile ${importMap.object.fill_ter} with local Tile ID ${tsxTiles.tiles[tsxTileID].properties["CDDA_ID_0"]}`)}
                // tileDict["fill_ter"] = [tile_ID, filepath];
                if (verbose){tiled.log(`Adding tileset ${filepath} to map.`);}
                    if ( !tilesetObjects.hasOwnProperty(tilesetname) ){
                        tilesetObjects[tilesetname] = tiled.open(filepath)
                    }
                    tileDict["fill_ter"] = [tsxTiles.tiles[tsxTileID].properties["CDDA_ID_0"],tilesetObjects[tilesetname].findTile(tsxTileID), filepath]
                if(!tilesetsToLoad.includes(filepath)){
                    tilesetsToLoad.push(filepath);
                };
                continue;
            };
            // other terrain and furniture
            for ( let entry in tsxTiles.tiles[tsxTileID].properties ){
                let cdda_ID = tsxTiles.tiles[tsxTileID].properties[entry];
                let tile_ID = tsxTileID;
                for (let mapLayerType of mapLayerTypes){
                    if (Object.values(mapPalette[mapLayerType]).includes(cdda_ID)){
                        if (verbose){tiled.log(`-'${cdda_ID}'' found in tileset file with local Tile ID '${tile_ID}'`);}
                        
                        if ( !tilesetObjects.hasOwnProperty(tilesetname) ){
                            tilesetObjects[tilesetname] = tiled.open(filepath)
                        }

                        tileDict[cdda_ID] = [tile_ID,tilesetObjects[tilesetname].findTile(tsxTileID), filepath]
                        if(!tilesetsToLoad.includes(filepath)){
                            if (verbose){tiled.log(`Adding tileset ${filepath} to map.`);}
                            tilesetsToLoad.push(filepath)
                        }
                    }
                }
            }
        }
    }

    // prepare map for tiled
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
                    newcell = [tileDict["fill_ter"][1]];
                    tRow.push(newcell);
                    continue;
                }
                // hasownproperty is includes for keys
                if (mapPalette[mapLayerName].hasOwnProperty(thiscell) && tileDict[mapPalette[mapLayerName][thiscell]]) {
                    newcell = tileDict[mapPalette[mapLayerName][thiscell]][1]
                }
                if (newcell != 0) {
                    tiled.log(`newcell is of type '${typeof newcell}'`);
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
        if (layername == 'fill_ter'){tl.locked = true;}
        return tl;
    }
    tm.addLayer(prepareTiledLayer('fill_ter'))
    for (let mapLayerType of mapLayerTypes){
        tm.addLayer(prepareTiledLayer(mapLayerType))
    }
    let pathToTMX = config.pathToTMX +"/"+ importMapName+".tmx"
    
    let outputFileResults = tiled.mapFormat("tmx").write(tm, pathToTMX);
    // let outputFileResults = writeToFile(pathToTMX,tm);
    (outputFileResults == null) ? tiled.log(importMapName + " file created successfully.") : tiled.log(importMapName + " - FAILED to create file. Error: " + outputFileResults)
}

class CDDAMapEntryImport {
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
class extensionConfig {
    constructor(pathToProject,pathToCDDA = "~/cdda") {
        this.filename = "tiled_cdda_extension.json";
        this.pathToProject = pathToProject;
        this.pathToTSX = FileInfo.toNativeSeparators(pathToProject + "/tsx");
        this.pathToTMX = FileInfo.toNativeSeparators(pathToProject + "/tmx");
        this.pathToCDDA = pathToCDDA;
        this.pathToTilesets = FileInfo.toNativeSeparators(pathToCDDA + "/gfx");
        this.pathToPalettes = FileInfo.toNativeSeparators(pathToCDDA + "/data/json/mapgen_palettes");
        this.chosenTileset = "ChibiUltica";
        this.pathToChosenTileset = FileInfo.toNativeSeparators(this.pathToTilesets + "/" + this.chosenTileset);
        this.pathToJSON = FileInfo.toNativeSeparators(this.pathToChosenTileset + "/tile_config.json");
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

function TSXread(filepath){ // { tiles: { id: { properties: { property: value }}}}
    const file = new TextFile(filepath, TextFile.ReadOnly)
    const file_data = file.readAll()
    file.close()
    let xmlDictionary = {} // assign as dictionary because missing tiles can leave empty entries.
    xmlDictionary["filepath"] = filepath
    xmlDictionary["tiles"] = {}
    let tileregex = /.*<tile id.*\n(?:.*\n)+?.*<\/tile>/g
    let xmlentries = file_data.match(tileregex)
    for ( let xmlentry of xmlentries ){
        let tileid = xmlentry.match(/tile id\=.*?\"(.*?)\"/)[1]
        xmlDictionary["tiles"][tileid] = {}
        xmlDictionary["tiles"][tileid]["properties"] = {}
        if ( xmlentry.match(/class\=.*?\"(.*?)\"/) ) {
            xmlDictionary["tiles"][tileid]["class"] = xmlentry.match(/class\=.*?\"(.*?)\"/)
        }
        if ( xmlentry.match(/probability\=.*?\"(.*?)\"/) ) {
            xmlDictionary["tiles"][tileid]["probability"] = xmlentry.match(/probability\=.*?\"(.*?)\"/)
        }

        if ( xmlentry.match(/<properties/) ) {
            for (let property of xmlentry.match(/<property.*?>/g)){
                let propertyKeyValue = property.match(/<property.*?name.*?\"(.*?)\".*?value.*?\"(.*?)\"/)
                xmlDictionary["tiles"][tileid]["properties"][propertyKeyValue[1]] = propertyKeyValue[2]
                if(verbose){tiled.log(`entry id: ${tileid} property name: ${propertyKeyValue[1]} cdda id (property value): ${propertyKeyValue[2]}`);}
            }
        }
    }
    return xmlDictionary;
}

function findTileInTilesets(){
    let cdda_id_tofind = tiled.prompt(`Find tile with corresponding CDDA ID:`,"t_floor","Find Tile by CDDA ID").replace(/^"|"$/g, '').replace(/^'|'$/g, '').replace(/\\$|\/$/g, '')
    tiled.log(`Searching for '${cdda_id_tofind}'...`)
    var ts;
    let tsxs = getFilesInPath(config.pathToTSX)

    for(let filename of tsxs){
        if (!filename.match(/\.tsx$/)){
            continue
        }
        let filepath = FileInfo.toNativeSeparators(config.pathToTSX+ "/" +filename)
        tiled.log(`${filepath}`)
        let tsxData = TSXread(filepath)
        for ( let tileid in tsxData.tiles ){
            if( tsxData.tiles[tileid].hasOwnProperty("properties")){
                for ( let property in tsxData.tiles[tileid].properties ){
                    if( verbose ){tiled.log(`checking '${property}' in id '${tileid}'`);}
                    if(tsxData.tiles[tileid].properties[property] == cdda_id_tofind){
                        tiled.log(`'${cdda_id_tofind}' found in '${filename}'`)
                        tiled.open(filepath)
                        return;
                    }
                }
            }
        }
    }
}

// tiled.log(tiled.actions)
// tiled.trigger(tiled.actions)

//import CDDA Tileset
const action_importTileset = tiled.registerAction("CustomAction_importTileset", function(action_importTileset) {
    tiled.log(`${action_importTileset.text} was run.`)
    initialize()
    importTilesets(config.pathToJSON)
});
//Create New Map
const action_createNewMap = tiled.registerAction("CustomAction_createNewMap", function(action_createNewMap) {
    tiled.log(`${action_createNewMap.text} was run.`)
    initialize()
    makeEmptyMap()
});
//Import CDDA Map
const action_importMap = tiled.registerAction("CustomAction_importMap", function(action_importMap) {
    tiled.log(`${action_importMap.text} was run.`)
    initialize()
    importMap()
});
//Export CDDA Map
const action_exportMap = tiled.registerAction("CustomAction_CDDA_map_exportMap", function(action_exportMap) {
    tiled.log(`${action_exportMap.text} was run.`)
    initialize()
    prepareExportMap()
});
//Find tile in tileset by CDDA ID
const action_findTileInTilemap = tiled.registerAction("CustomAction_CDDA_map_findTileInTileset", function(action_findTileInTilemap) {
    tiled.log(`${action_findTileInTilemap.text} was run.`)
    initialize()
    findTileInTilesets()
});
//test action for debug
const action_cdda_debug = tiled.registerAction("CustomAction_cdda_debug", function(action_cdda_debug) {
    tiled.log(`${action_cdda_debug.text} was run.`)
    tiled.log(tiled.actions)
    tiled.trigger("CustomAction_CDDA_map_findTileInTileset")
    // initialize()
    // findTileInTilesets(cdda_id_tofind)
});

action_importTileset.text = "Import CDDA tileset"
action_createNewMap.text = "Create new CDDA map"
action_importMap.text = "Import CDDA map"
action_exportMap.text = "Export to CDDA map"
action_findTileInTilemap.text = "Find CDDA Tile"
action_cdda_debug.text = "run associated debug action"
action_cdda_debug.shortcut = "CTRL+D"

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
    { action: "CustomAction_CDDA_map_exportMap", before: "AutoMap" },
    { separator: true }
]);
tiled.extendMenu("Tileset", [
    { separator: true },
    { action: "CustomAction_CDDA_map_findTileInTileset", after: "Terrain Sets" },
    { separator: true }
]);
tiled.extendMenu("Help", [
    { separator: true },
    { action: "CustomAction_cdda_debug", after: "Terrain Sets" },
    { separator: true }
]);