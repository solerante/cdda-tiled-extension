/// <reference types="@mapeditor/tiled-api" />
//ChibiUltica
//0x400 | 0x2000 | 0x4000 qdir filter for dir no dot and dotdot
//0x002 | 0x2000 | 0x4000 qdir filter for file no dot and dotdot
//JSON.stringify(m, null, 2) sringify with formatting
var verbose = true

const pathToUserFolder = FileInfo.toNativeSeparators(tiled.extensionsPath.match(/(.*?(?:Users|home)(?:\/|\\|\\\\)\w+)/i)[1])
const pathToExtras = FileInfo.toNativeSeparators(tiled.extensionsPath + "/cdda_map_extension_extras");
const pathToMainConfig = FileInfo.toNativeSeparators(pathToExtras + "/cdda_map_extension_main_config.json")
const configfilename = "tiled_cdda_extension_config.json";

const mapLayerTypes = ['terrain','furniture']
const entityLayerTypes = ["items", "place_item", "place_items", "place_loot", "place_monsters", "place_vehicles"]
const flags = ["ERASE_ALL_BEFORE_PLACING_TERRAIN","ALLOW_TERRAIN_UNDER_OTHER_DATA","NO_UNDERLYING_ROTATE","AVOID_CREATURES"]
const possible_unicode_chars = "#$%&'()*+,-.0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ^_`abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§©ª«¬®¯°±²³µ¶·¸¹º»¼½¾¿"

var skipOverwrite = true;
var overwriteExisting = true;
var config = {};
var mainConfig = {};
var imageCache = {};

const cte = { // helper functions
    getTileXY: function getTileXY(tile){
        let tileset = tile.asset;
        if(tileset.isCollection){return [[0,tile.width],0,tile.height];}
        let x = [ parseInt((( tile.id * tileset.tileWidth ) % tileset.imageWidth),10), parseInt(( tile.id * tileset.tileWidth ) % tileset.imageWidth + tileset.tileWidth,10) ]
        let y = [ parseInt(Math.floor((tile.id*tileset.tileWidth)/tileset.imageWidth)*tileset.tileHeight,10), parseInt(Math.floor((tile.id*tileset.tileWidth)/tileset.imageWidth)*tileset.tileHeight + tileset.tileHeight,10) ]
        tileset = undefined;
        return [x,y];
    },
    cropImage : function cropImage(image, importX, importY){
        if(!imageCache.hasOwnProperty(image)){
            imageCache[image] = new Image(image);
        }
        // let originalImage = new Image(image);
        let croppedImage = new Image( importX[1]-importX[0], importY[1]-importY[0] );
        if(verbose >= 2){tiled.log(`'${originalImage}, ${croppedImage}'`);}
        if(verbose >= 2){tiled.log(`'${importX}, ${importY}'`);}
        for(let py = importY[0]; py < importY[1]; py++){
            let y = py - importY[0];
            for(let px = importX[0]; px < importX[1]; px++){
                let x = px - importX[0];
                if(verbose >= 2){tiled.log(`'${x},${y}'`);}
                if(verbose >= 4){tiled.log(`'${imageCache[image].pixel( px, py )}'`);}
                // if(verbose >= 1){tiled.log(`'${px}, ${py}'`);}
                croppedImage.setPixel( x, y, imageCache[image].pixel( px, py ) )
            };
        };
        // originalImage = undefined;
        return croppedImage;
    }

}

function initialize(){
    if(!File.exists(pathToMainConfig)){
        mainConfig = { "pathToProject" : "~/cdda_tiled_project" }
        var mainConfigfile = new TextFile(FileInfo.cleanPath(pathToMainConfig), TextFile.WriteOnly); 
        mainConfigfile.write(JSON.stringify(mainConfig,null,2));
        mainConfigfile.commit();
        mainConfig = readJSONFile(pathToMainConfig)
        tiled.log(`generating main config file at '${pathToMainConfig}'`)
        changeProjectPath()
    }
    mainConfig = readJSONFile(pathToMainConfig)
    
    var pathToConfig = FileInfo.toNativeSeparators(mainConfig.pathToProject+"/"+configfilename)
    if(!File.exists(mainConfig.pathToProject)){File.makePath(mainConfig.pathToProject);}

    if(!File.exists(pathToConfig)){
        tiled.log(`no config file found at ${pathToConfig}. Making new config file.`) 
        let givenPathToCDDA = FileInfo.toNativeSeparators(tiled.prompt("Path to CDDA folder:",config.pathToCDDA,"CDDA Path").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"").replace("~",pathToUserFolder))
        config = new extensionConfig(mainConfig.pathToProject,givenPathToCDDA);
        if( !File.exists(config.pathToTSX) ){File.makePath(config.pathToTSX);}
        if( !File.exists(config.pathToTMX) ){File.makePath(config.pathToTMX);}
        updateConfig()
    } else {
        tiled.log(`config file found at ${pathToConfig}`) 
        config = readJSONFile(pathToConfig)
        if( !File.exists(config.pathToTSX) ){File.makePath(config.pathToTSX);}
        if( !File.exists(config.pathToTMX) ){File.makePath(config.pathToTMX);}
    }
    tiled.log("Generating custom tileset.");
    generateMetaTileset();
    return 1;
    // if( !File.exists(config.pathToCustomTileset) ){tiled.log("generating custom tileset.");generateCustomTileset();}

}
function changeProjectPath(){
    var loggedPathToProject = mainConfig.pathToProject
    var pathToProject = FileInfo.toNativeSeparators(tiled.prompt("Path to Tile project:",loggedPathToProject,"Tiled Project Path").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"").replace("~",pathToUserFolder))
    if(!pathToProject){return false;}
    if(pathToProject && pathToProject != loggedPathToProject){
        mainConfig.pathToProject = pathToProject;
        updateMainConfig();
    }
}
function updateMainConfig(){
    var updateConfigfile = new TextFile(FileInfo.cleanPath(pathToMainConfig), TextFile.WriteOnly); 
    updateConfigfile.write(JSON.stringify(mainConfig,null,2));
    updateConfigfile.commit();
}
function updateConfig(){
    var pathToConfig = FileInfo.toNativeSeparators(mainConfig.pathToProject+"/"+configfilename)
    var configfile = new TextFile(FileInfo.cleanPath(pathToConfig), TextFile.WriteOnly); 
    configfile.write(JSON.stringify(config,null,2));
    configfile.commit();
}

function addSpriteToFavotires(){
    let tileset = tiled.activeAsset
    let tiles = tileset.selectedTiles
    if(tiles.length < 1){ return tiled.log(`No tiles selected.`)}
    let pathToFavoriteImages = FileInfo.toNativeSeparators(FileInfo.path(config.pathToFavoritesTSX)+"/images");
    if(!File.exists(FileInfo.path(config.pathToFavoritesTSX))){File.makePath(FileInfo.path(config.pathToFavoritesTSX));};
    if(!File.exists(pathToFavoriteImages)){File.makePath(pathToFavoriteImages);};
    
    let favorites;
    if(!File.exists(config.pathToFavoritesTSX)){
        favorites = new Tileset("Favorites");
        tiled.tilesetFormat("tsx").write(favorites,config.pathToFavoritesTSX);
    }
    favorites = tiled.open(config.pathToFavoritesTSX);

    for(let tile of tiles){
        let pathToImage = FileInfo.toNativeSeparators(`${pathToFavoriteImages}/${tile.property(`cdda_id`)}.png`)
        let [x,y] = cte.getTileXY(tile)
        let croppedImage = cte.cropImage(tileset.image,x,y);
        croppedImage.save(pathToImage);
        let img = new Image(pathToImage);
        let croppedImageTile = favorites.addTile()
        croppedImageTile.setProperty("cdda_id",tile.property(`cdda_id`))
        croppedImageTile.setImage(img)
    }
    // tiled.log(tiled.activeAsset.selectedTiles)
    tiled.tilesetFormat("tsx").write(favorites,config.pathToFavoritesTSX);
    tiled.reload(tiled.activeAsset)
}

// custom tileset
function generateMetaTileset(){
    // File.exists(FileInfo.toNativeSeparators(tiled.extensionsPath+"/cdda_map_extension_extras"))
    if( File.exists(config.pathToExtras) ){
        let tilesetname = "cdda_ext_custom_tileset"
        let tileset = new Tileset(tilesetname)
        for(let filepath of getRecursiveFilePathsInFolder(config.pathToExtras)){
            if (!filepath.match(/\.png$/)){continue;}
            if( verbose >= 2){tiled.log(`adding '${filepath}' to custom tileset.`);}
            let tile = tileset.addTile();
            tile.setProperty("cdda_id",FileInfo.baseName(filepath))
            let img = new Image(filepath);
            tile.setImage(img);
        }
        tiled.tilesetFormat("tsx").write(tileset,config.pathToCustomTileset)
    } else {
        tiled.log("cannot find 'extras' folder.")
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
        file.codec = "UTF-8"
        const file_data = file.readAll()
        file.close()
        return JSON.parse(file_data)
}
function getRecursiveFilePathsInFolder(targetPath){
    if (verbose >= 2){tiled.log(`getting paths files in folder`);};
    let filePaths = getFilesInPath(targetPath).map(a => FileInfo.toNativeSeparators(targetPath+"/"+a))
    let folderPaths = getFoldersInPath(targetPath).map(a => targetPath+"/"+a);
    for (let folderPath in folderPaths){
        filePaths = filePaths.concat(getFilesInPath(folderPath).map(a => folderPath+"/"+a));
        let subfolders = getFoldersInPath(folderPath).map(a => folderPath+"/"+a)
        for (let subfolder in subfolders){
            if ( subfolders != null ) { folderPaths.push(subfolder); }
        }
    }
    if (verbose >= 2){tiled.log(`palette file paths`);};
    if (verbose >= 2){tiled.log(filePaths);};
    return filePaths;
}
function getFilesInPath(path){ return File.directoryEntries(path, 0x002 | 0x2000 | 0x4000);}
function getFoldersInPath(path){ return File.directoryEntries(path, 0x400 | 0x2000 | 0x4000);}

function importTilesets(){
    
    config.pathToChosenTileset = FileInfo.toNativeSeparators(tiled.prompt("Path to Tileset folder:",config.pathToChosenTileset,"Tileset Path").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"").replace("~",pathToUserFolder))
    if(!config.pathToChosenTileset){return tiled.log("Action cancelled.")}
    config.chosenTileset = config.pathToChosenTileset.match(/(?:\/|\\|\\\\)(?:(\.?.+$)|(?:(\.?.+)(?:\/|\\|\\\\).+\..+))/)[1]
    config.pathToJSON = FileInfo.toNativeSeparators(config.pathToChosenTileset + "/tile_config.json");
    
    config.pathToChosenTilesetTSX = FileInfo.toNativeSeparators(config.pathToProject + "/tsx/"+FileInfo.baseName(config.chosenTileset))
    if( !File.exists(config.pathToChosenTilesetTSX) ){File.makePath(config.pathToChosenTilesetTSX);}
    
    updateConfig();
    let pathToDuplicateIDImages = FileInfo.toNativeSeparators(config.pathToChosenTilesetTSX+"/duplicate_id_images")
    if( !File.exists(pathToDuplicateIDImages) ){File.makePath(pathToDuplicateIDImages);}
    let pathToDuplicateIDTSX = FileInfo.toNativeSeparators(config.pathToChosenTilesetTSX+"/duplicate_id_tiles.tsx")
    //duplicates tiled tileset
    var dupe_tileset = new Tileset("duplicate_cdda_ids");
    
    var filename = config.pathToJSON



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
            //{ "id": "f_air_conditioner", "fg": 3841 },
            //{ "id": "f_armchair", "rotates": true, "fg": [ 3844, 3845, 3843, 3842 ] },
            //{ "id": [ "molotov", "sling-ready_molotov" ], "fg": 3174 },

            //if local assigned id is out of range, skip
            tiled.log("CDDA IDs logged")
            tiled.log(cdda_IDs)
            const cdda_IDsOriginal = cdda_IDs
            cdda_IDs = []
            cdda_IDsOriginal.map(e => (jts.range[0] <= e && e <= jts.range[1]) ? cdda_IDs.push(e) : 0);
            if(verbose >= 2){tiled.log(`CDDA IDs found in range ${jts.range[0]} - ${jts.range[1]}`);};
            if(verbose >= 2){tiled.log(cdda_IDs);}
            if (cdda_IDs === []) {continue}


            if(verbose >= 2){tiled.log(`CDDA IDs:`);}
            if(verbose >= 2){tiled.log(cdda_IDs);}
            let LocalID = 0;
            cddaidentryloop:
            for (let t in cdda_IDs){
                //offset 1st tile in tileset range
                (jts.range[0] == 1) ? LocalID = cdda_IDs[t] - jts.range[0] + 1 : LocalID = cdda_IDs[t] - jts.range[0]
                tiled.log(`cdda id: ${cdda_IDs[t]} >>> Local tile ID: ${LocalID}`);
                let currentTile = ts.findTile(LocalID)

                // // set custom properties and duplicate tiles
                // if (currentTile.properties().hasOwnProperty("cdda_id")){
                //     let [x,y] = cte.getTileXY(currentTile);
                //     let croppedImage = cte.cropImage(currentTile.asset.image,x,y);
                //     dupe_tileset.addTile();
                // }


                // find right index to continue IDs
                let propertyIndex = 0;
                if (currentTile.properties().hasOwnProperty("cdda_id_0")){
                    let tempPropertiesArray = []
                    for (let property in currentTile.properties()){
                        if(property.match(/cdda_id_(.*)/)){
                        if(verbose >= 2){tiled.log(`found property indeces ${tempPropertiesArray}`);};
                            tempPropertiesArray.push(parseInt(property.match(/CDDA_ID_(.*)/)[1]))
                        }
                    }
                    propertyIndex = 1 + Math.max(...tempPropertiesArray)
                    if(verbose >= 2){tiled.log(`Local tile ID: '${LocalID}' already has assigned properties. will assign at CDDA_ID_${propertyIndex}`);};
                }
                let pathToThisDupeImage;
                if ( Array.isArray(tile["id"]) ){
                    eachtileloop:
                    for ( let n in tile.id){
                        pathToThisDupeImage = FileInfo.toNativeSeparators(`${pathToDuplicateIDImages}/${tile.id[n]}.png`);
                        if (currentTile.properties().hasOwnProperty("cdda_id")){
                            if(!File.exists(pathToThisDupeImage)){
                                let [x,y] = cte.getTileXY(currentTile);
                                let croppedImage = cte.cropImage(currentTile.asset.image,x,y);
                                croppedImage.save(pathToThisDupeImage);
                            }
                            let tileImg = new Image(pathToThisDupeImage);
                            let croppedImageTile = dupe_tileset.addTile()
                            croppedImageTile.setProperty("cdda_id",tile.id[n])
                            croppedImageTile.setImage(tileImg)
                        } else {
                            currentTile.setProperty('cdda_id', tile.id[n])
                        }



                        let index = parseInt(n,10)+parseInt(propertyIndex, 10)
                        for(let p in currentTile.properties()){
                            if(currentTile.properties()[p] == tile["id"][n]){continue eachtileloop;}
                        }
                        // currentTile.setProperty('CDDA_ID_'+index.toString(), tile['id'][n])
                    }
                } else {
                    for(let p in currentTile.properties()){
                        if(currentTile.properties()[p] == tile["id"]){continue cddaidentryloop;}
                    }
                    
                    pathToThisDupeImage = FileInfo.toNativeSeparators(`${pathToDuplicateIDImages}/${tile.id}.png`);
                    if (currentTile.properties().hasOwnProperty("cdda_id")){
                        if(!File.exists(pathToThisDupeImage)){
                            let [x,y] = cte.getTileXY(currentTile);
                            let croppedImage = cte.cropImage(currentTile.asset.image,x,y);
                            croppedImage.save(pathToThisDupeImage);
                            croppedImage = undefined;
                        }
                        let tileImg = new Image(pathToThisDupeImage);
                        let croppedImageTile = dupe_tileset.addTile()
                        croppedImageTile.setProperty("cdda_id",tile.id)
                        croppedImageTile.setImage(tileImg)
                    } else {
                        currentTile.setProperty('cdda_id', tile.id)
                    }
                    // currentTile.setProperty('CDDA_ID_'+propertyIndex.toString(), tile['id'])
                }
                // // set export property
                // if (!currentTile.properties().hasOwnProperty("CDDA_ID_export")){
                //     currentTile.setProperty("CDDA_ID_export", "")
                // }
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
        let shouldSkip = !overwriteExisting && File.exists(config.pathToChosenTilesetTSX + "/" + jts.name + ".tsx") || skipOverwrite && imgFile.match(/(fallback)/);
        if (shouldSkip){
            if(verbose >= 2){tiled.log(`skipping ${jts.name}`);};
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
        if(j['tiles-new'][i].hasOwnProperty("//")){
            jts.range = [Number(j['tiles-new'][i]['//'].match(/\d+/)[0]),Number(j['tiles-new'][i]['//'].match(/\d+$/)[0])]
            let localIDRange = jts.range[1]-jts.range[0]
        }
            
        if(verbose >= 2){tiled.log(`tileset dimensions: ${jts.width}, ${jts.height}`);};
        if(verbose >= 2){tiled.log(`tileset range: ${jts.range[0]} - ${jts.range[1]}`);};
        if(verbose >= 2){tiled.log(`tileset offset: ${jts.xOffset}, ${jts.yOffset}`);};
        if (jts.height >= 64){
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
        if(verbose >= 2){tiled.log(`Image is ${img.width} by ${img.height} - ${pathToChosenTileset}`);};

        //load tilesheet image into tilesheet (source not embed)
        ts.loadFromImage(img,pathToChosenTileset)

        if(verbose >= 1){tiled.log(`tileset name: ${ts.name}`);};
        if(verbose >= 1){tiled.log(`tileset image: ${FileInfo.toNativeSeparators(ts.image)}`);};
        if(verbose >= 1){tiled.log(`number of sprites: ${ts.tileCount}`);};

        return {ts,jts};
    }

    //read tileset config file
    let f = new TextFile(filename, TextFile.ReadOnly);
    let c = f.readAll();
    f.close();
    let j = JSON.parse(c);

    var tilesetInfoWidth = j['tile_info'][0]['width']
    var tilesetInfoHeight = j['tile_info'][0]['height']
    var tilesetInfoPixelscale = j['tile_info'][0]['pixelscale']

    tiled.log(`Importing '${config.chosenTileset}' with dimensions w:${tilesetInfoWidth} h:${tilesetInfoHeight} pixelscale:${tilesetInfoPixelscale}`)

    //iterate over tilset config file entries

    for (let t in j['tiles-new']){
        let {ts,jts} = processTileset(j,t)
        if (ts == null){ continue; }
        ts = importSpriteData(ts,jts,j,t)
        let pathToTSXFile = FileInfo.toNativeSeparators(config.pathToChosenTilesetTSX + "/" + ts.name+".tsx");
        if(verbose >= 2){tiled.log(`Preparing to write ${(ts.isTileset) ? `tilesheet` : `not a tilesheet`} '${ts.name}' to '${pathToTSXFile}'`);};
        // let outputFileResults = writeToFile(pathToTSXFile,ts);
        let outputFileResults = tiled.tilesetFormat("tsx").write(ts,pathToTSXFile)
        // (outputFileResults == null) ? tiled.log(ts.name + " file created successfully.") : tiled.log(`FAILED to create file at '${pathToTSXFile}'' - Error: ${outputFileResults}`)
        tiled.log('-------------------TSX DONE-------------------')

    }
    tiled.log(pathToDuplicateIDTSX)
    tiled.tilesetFormat("tsx").write(dupe_tileset,pathToDuplicateIDTSX)
    tiled.log('------------------------- Import Tileset DONE -------------------------')
}
function prepareTilemap(tmname = 'CDDA_map_24x24',mapsize = 24){
    let tm = new TileMap()
    tm.setSize(mapsize, mapsize);
    tm.setTileSize(32, 32);
    tm.orientation = TileMap.Orthogonal;
    tiled.log(`tilemap name: ${tmname}`)
    return tm
}
function buildTilePaletteDict(import_map){
    tiled.log(`------- Palette Loading Area ---------`);

    function getPaletteFileData(mapFilePalettes,filepath){
        if(verbose){tiled.log(`checking palette '${filepath}'`);}
        const file = new TextFile(filepath, TextFile.ReadOnly)
        file.codec = "UTF-8"
        const file_data = file.readAll()
        file.close()
        let paletteFileJSON = JSON.parse(file_data)

        let thisPalette = {}
        for (let p of paletteFileJSON){
            // let thisPalette = paletteFileData[p]
            // tiled.log(`palette id '${p['id']}'`)
            if (p['type'] != "palette"){continue;};
            if (mapFilePalettes.includes(p['id'])){
                if (verbose){tiled.log(`id '${p['id']}' found in ${FileInfo.fileName(filepath)}. Importing...`);}
                // mapPalette['terrain'] = Object.assign(mapPalette['terrain'], p['terrain']);
                for (let mapLayerType of mapLayerTypes){
                    thisPalette[mapLayerType] = {}
                    for (let key in p[mapLayerType]){
                        let temparray = []
                        // if string
                        if(typeof p[mapLayerType][key] === "string"){
                            thisPalette[mapLayerType][key] = p[mapLayerType][key]
                        }
                        // if array
                        if(Array.isArray(p[mapLayerType][key])){
                            if(Array.isArray(p[mapLayerType][key][0])){
                                temparray = []
                                for(let subarray of p[mapLayerType][key]){
                                    (Array.isArray(subarray)) ? temparray.push(subarray[0]) : temparray.push(subarray);
                                    
                                }
                                thisPalette[mapLayerType][key] = temparray
                            } else {
                                thisPalette[mapLayerType][key] = p[mapLayerType][key]
                            }
                        }
                        // if object (dict)
                        if(p[mapLayerType][key].constructor == Object){
                            if(p[mapLayerType][key].hasOwnProperty("param")){
                                if(typeof p[mapLayerType][key].param === "string"){
                                    thisPalette[mapLayerType][key] = p[mapLayerType][key].param
                                }
                            }
                            if(p[mapLayerType][key].hasOwnProperty("switch")){
                                if(p[mapLayerType][key].switch.hasOwnProperty("param")){
                                    thisPalette[mapLayerType][key] = p[mapLayerType][key].switch.param
                                }
                            }
                        }
                        tiled.log(`\t${key} > ${thisPalette[mapLayerType][key]}\tadded to palette'${mapLayerType}'.`)
                    }
                }
            }
        }
        return thisPalette;
    }
    function getMapfileCustomPalette(import_map){
        if(verbose){tiled.log(`getting data from map file`);}
        let thisPalette = {}
        for (let mapLayerType of mapLayerTypes){
            tiled.log(`map layer '${mapLayerType}'`)
            thisPalette[mapLayerType] = {}
            for (let key in import_map.object[mapLayerType]){
                // if string
                if(typeof import_map.object[mapLayerType][key] === "string"){
                    thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key]
                }
                if(Array.isArray(import_map.object[mapLayerType][key])){
                    thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][0]
                    // thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][Math.floor(Math.random() * import_map.object[mapLayerType][key].length)]
                }
                
                tiled.log(`custom key '${key}' > '${thisPalette[mapLayerType][key]}'\tadded to palette'${mapLayerType}'.`)
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

    if(import_map.object.hasOwnProperty("palettes")){
        tiled.log(`------- importing preset palette symbols ----`);
        let palettePaths = getRecursiveFilePathsInFolder(config.pathToPalettes);
        for(let filepath of palettePaths){
            let tempPaletteDict = getPaletteFileData(import_map['object']['palettes'],filepath);
            for ( let mapLayerType of mapLayerTypes ){
                for ( let key in tempPaletteDict[mapLayerType]){
                    if(Array.isArray(tempPaletteDict[mapLayerType][key])){
                        mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]//[Math.floor(Math.random() * tempPaletteDict[mapLayerType][key].length)]
                    } else {
                        mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]
                    }
                    if(verbose){tiled.log(`true assign '${key}' >> '${mapPalette[mapLayerType][key]}'`)}
                }
            }
        }
    }

    tiled.log(`------- importing mapfile symbols ---------`)
    tempPaletteDict = getMapfileCustomPalette(import_map);
    for (let mapLayerType of mapLayerTypes){
        for ( let key in tempPaletteDict[mapLayerType]){
            mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]
            if(verbose){tiled.log(`true assign '${key}' >> ${mapPalette[mapLayerType][key]}`)}
        }
    }

    tiled.log(`------- mapfile total custom palette import results---------`)
    for (let mapLayerType of mapLayerTypes){
        tiled.log(`mapLayerType: ${mapLayerType}`)
        for ( let n in mapPalette[mapLayerType] ){
            tiled.log(`${n} > ${mapPalette[mapLayerType][n]}\t\tin palette'${mapLayerType}'.`)
        }
    }

    return mapPalette;
}
function importMap(){
    let pathToMap;
    if(!config.hasOwnProperty("importMapPath")){
        config.importMapPath = FileInfo.toNativeSeparators(config.pathToCDDA + "/data/json/mapgen/house/house_detatched1.json")
    }
    pathToMap = FileInfo.toNativeSeparators(tiled.prompt("Path to CDDA .json map: ", config.importMapPath, "Select File").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"").replace("~",pathToUserFolder))
    if (pathToMap == false){
        tiled.log(`import canceled`);
        return;
    }
    
    pathToMap = pathToMap
    config.importMapPath = pathToMap;
    updateConfig();
    tiled.log(`Importing '${pathToMap}'`)
    //File.makePath(config.pathtoProject+'\\importedtsx')

    //read map file
    let f = new TextFile(pathToMap, TextFile.ReadOnly);
    let c = f.readAll();
    f.close();
    let j = JSON.parse(c);
    let tm;
    for(let i in j){ // find valid entry for size
        if(j[i].type != "mapgen" || j[i].method != "json"){continue;} // must be mapgen and json
        tm = prepareTilemap(j[i]['om_terrain'],j[i]['object']['rows'][0].length)
        break;
    }

    let layergroups = [];

    for(let i in j){
        if(j[i].type != "mapgen" || j[i].method != "json"){continue;} // must be mapgen and json
        var import_map = j[i];

        var importMapName = import_map['om_terrain'];
        var importMapSize = import_map['object']['rows'][0].length;
        tiled.log(`Working on map '${import_map.om_terrain}'`)
        // check if has fill_ter, TODO remove later
        if (import_map.object.hasOwnProperty("fill_ter")){ var importMapFill = import_map.object.fill_ter;tiled.log(`Has fill_ter: ${import_map.object.fill_ter}`);}

        let mapArray = import_map['object']['rows'];

        // init mapPallete
        let mapPalette = buildTilePaletteDict(import_map);

        if(verbose){
            tiled.log(`Original Map`)
            for (let row of mapArray){
                tiled.log(row)
            }
        }
        

        //get tile numbers, cdda IDs, and tilset file 
        let tileDict = {};
        let tilesetsToLoad = [];
        let tilesetObjects = {};
        let mapArrays = {};

        for (let entityLayerType of entityLayerTypes){
            tiled.log(`preparing map array for layer '${entityLayerType}'`)
            mapArrays[entityLayerType] = getMapEntities(entityLayerType);
        };
        for (let entityLayerType of entityLayerTypes){
            tiled.log(`mapArrays["${entityLayerType}"]`);
            for (let e in mapArrays[entityLayerType]){
                tiled.log(`${mapArrays[entityLayerType][e]}`);
            };
        };

        let tsxs = getRecursiveFilePathsInFolder(config.pathToChosenTilesetTSX);
        tsxs.push(config.pathToCustomTileset) // add custom tsx to the mix
        for(let filepath of tsxs){
            if (!filepath.match(/\.tsx$/)){
                continue;
            };
            tiled.log(`file ${filepath}`);

            let tsxTiles = TSXread(filepath) //  filepath returns { tiles: { id: { class, probabiltiy, properties: { property: value }}}}
            let tilesetname = FileInfo.baseName(filepath);


            for ( let tsxTileID in tsxTiles.tiles ){
                if (!tsxTiles.tiles[tsxTileID].properties["cdda_id"]){continue;};
                // fill terrain
                if (import_map.object.hasOwnProperty("fill_ter")){
                    if (tsxTiles.tiles[tsxTileID].properties["cdda_id"] == import_map.object.fill_ter){
                        if (verbose){tiled.log(`-${tsxTiles.tiles[tsxTileID].properties["cdda_id"]} found in palette with fill tile ${import_map.object.fill_ter} with local Tile ID ${tsxTileID}`)}
                        // tileDict["fill_ter"] = [tile_ID, tileobject, filepath];
                        if (verbose >= 2){tiled.log(`Adding tileset ${filepath} to map.`);};
                        if ( !tilesetObjects.hasOwnProperty(tilesetname) ){ // open tileset if not already open
                            tilesetObjects[tilesetname] = tiled.open(filepath);
                        };
                        tileDict["fill_ter"] = [tsxTiles.tiles[tsxTileID].properties["cdda_id"],tilesetObjects[tilesetname].findTile(tsxTileID), filepath]
                        if(!tilesetsToLoad.includes(filepath)){
                            tilesetsToLoad.push(filepath);
                        };
                        continue;
                    };
                };
                // other terrain and furniture and entities
                for ( let entry in tsxTiles.tiles[tsxTileID].properties ){
                    let cdda_ID = tsxTiles.tiles[tsxTileID].properties[entry];
                    let tile_ID = tsxTileID;
                    for (let mapLayerType of mapLayerTypes){
                        if (flatten(Object.values(mapPalette[mapLayerType])).includes(cdda_ID)){
                            if (verbose){tiled.log(`-'${cdda_ID}' found in tileset file with local Tile ID '${tile_ID}'`);}
                            
                            if ( !tilesetObjects.hasOwnProperty(tilesetname) ){
                                tilesetObjects[tilesetname] = tiled.open(filepath);
                            };

                            tileDict[cdda_ID] = [tile_ID,tilesetObjects[tilesetname].findTile(tsxTileID), filepath];
                            if(!tilesetsToLoad.includes(filepath)){
                                if (verbose){tiled.log(`Adding tileset ${filepath} to map.`);};
                                tilesetsToLoad.push(filepath);
                            };
                        };
                    };
                    //entities
                    for (let entityLayerType of entityLayerTypes){
                        if(verbose >=2){tiled.log(`trying layer ${entityLayerType}`);}
                        if(mapArrays.hasOwnProperty(entityLayerType)){
                            if(verbose >=3){tiled.log(`looking in layer ${entityLayerType}`);}
                            for (let entry in mapArrays[entityLayerType]){
                                if (verbose >= 3){tiled.log(`searching for '${cdda_ID} for layer '${entityLayerType}' in '${filepath}'`);}
                                if(mapArrays[entityLayerType][entry][2] == cdda_ID){
                                    if (verbose){tiled.log(`-'${cdda_ID}' found in tileset file with local Tile ID '${tile_ID}'`);}

                                    if ( !tilesetObjects.hasOwnProperty(tilesetname) ){
                                        tilesetObjects[tilesetname] = tiled.open(filepath)
                                    }

                                    mapArrays[entityLayerType][entry][2] = tilesetObjects[tilesetname].findTile(tsxTileID);
                                    if(!tilesetsToLoad.includes(filepath)){
                                    if (verbose){tiled.log(`Adding tileset ${filepath} to map.`);}
                                        tilesetsToLoad.push(filepath)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        function getMapEntities(entityType){ // place_item, place_items, place_monsters, place_vehicles
            let tMapArray = []
            if(j[i].object.hasOwnProperty(entityType)){
                for (let entry in j[i].object[entityType]){
                    if (entityType == "items"){
                        tMapArray.push([j[i].object[entityType][entry]["x"],j[i].object[entityType][entry]["y"],j[i].object[entityType][entry]["item"],j[i].object[entityType][entry]["repeat"]])
                    }
                    if (entityType == "place_item"){
                        tMapArray.push([j[i].object[entityType][entry]["x"],j[i].object[entityType][entry]["y"],j[i].object[entityType][entry]["item"],j[i].object[entityType][entry]["repeat"]])
                    }
                    if (entityType == "place_items"){
                        tMapArray.push([j[i].object[entityType][entry]["x"],j[i].object[entityType][entry]["y"],j[i].object[entityType][entry]["item"],j[i].object[entityType][entry]["chance"]])
                    }
                    if (entityType == "place_vehicles"){
                        tMapArray.push([j[i].object[entityType][entry]["x"],j[i].object[entityType][entry]["y"],j[i].object[entityType][entry]["vehicle"],j[i].object[entityType][entry]["chance"],j[i].object[entityType][entry]["rotation"]])
                    }
                    if (entityType == "place_monsters"){
                        tMapArray.push([j[i].object[entityType][entry]["x"],j[i].object[entityType][entry]["y"],j[i].object[entityType][entry]["monster"],j[i].object[entityType][entry]["chance"],j[i].object[entityType][entry]["density"]])
                    }
                }
                return tMapArray;
            }
        }
        function prepareEntitiesArrayForTiled(entityLayerType){
            if (mapArrays.hasOwnProperty(entityLayerType)){
                let tMapArray = mapArrays[entityLayerType]
                for (let entry in mapArrays[entityLayerType]){
                    if(tileDict.hasOwnProperty(entityLayerType)){
                        if(!tileDict[entityLayerType].hasOwnProperty(mapArrays[entityLayerType][entry][2])){
                            if(verbose){tiled.log(`'${mapArrays[entityLayerType][entry][2]}' not found in tile dictionary'`);}
                            continue;
                        };
                        if(verbose >= 2){tiled.log(`( ${tMapArray[entry][0]}, ${tMapArray[entry][1]} ) '${mapArrays[entityLayerType][entry][2]}' > '${tileDict[entityLayerType][mapArrays[entityLayerType][entry][2]]}'`)}
                        tMapArray[entry][2] = tileDict[entityLayerType][mapArrays[entityLayerType][entry][2]]
                    };
                }
                return tMapArray
            }
        }

        // prepare map for tiled
        function prepareMapArrayForTiled(mapLayerName){
            if (verbose){tiled.log(`working on map layer '${mapLayerName}'`);}
            // if (mapLayerName == "fill_ter"){return;};
            let tMapArray = []
            if (!mapPalette.hasOwnProperty(mapLayerName) && mapLayerName != "fill_ter"){tiled.log(`missing ${mapLayerName}`);return;}
            for (let row in mapArray){
                let tRow = []
                for (let cell in mapArray[row]){
                    let thiscell = mapArray[row][cell]
                    let newcell = 0
                    // terrain fill
                    if (mapLayerName == "fill_ter"){
                        if (import_map.object.hasOwnProperty("fill_ter")){
                            if(tileDict["fill_ter"] != undefined){
                                if (verbose >= 3){tiled.log(`( ${cell}, ${row} ) - fill_ter: '${tileDict["fill_ter"][0]}'`);}
                                newcell = tileDict["fill_ter"][1]
                                tMapArray.push([cell,row,newcell])
                                continue;
                            };
                        };
                    };
                    // hasownproperty is includes for keys
                    if(thiscell === " "){continue;}
                    if (mapPalette[mapLayerName].hasOwnProperty(thiscell)) {
                        if(mapPalette[mapLayerName][thiscell] === undefined){continue;};
                        if(typeof mapPalette[mapLayerName][thiscell] === "object"){
                            for(let e of mapPalette[mapLayerName][thiscell]){
                                if(tileDict.hasOwnProperty(e)){
                                    if(verbose >= 2){tiled.log(`\t\tAssigning ID '${e}' TO SYMBOL '${thiscell}'`);}
                                    newcell = tileDict[e][1]
                                    break;
                                }
                            }
                        } else{
                            if(tileDict.hasOwnProperty(mapPalette[mapLayerName][thiscell])){
                                newcell = tileDict[mapPalette[mapLayerName][thiscell]][1]
                            } else {
                                if(verbose >= 2){tiled.log(`no sprite for ${mapPalette[mapLayerName][thiscell]}`)}
                            }
                        }
                        if(verbose >= 2){tiled.log(`( ${cell}, ${row} ) '${thiscell}' > '${mapPalette[mapLayerName][thiscell]}' - '${newcell}'`)}
                        tMapArray.push([cell,row,newcell])
                    }
                }
            }
            return tMapArray;
        }

        if (import_map.object.hasOwnProperty("fill_ter")){
            mapArrays["fill_ter"] = prepareMapArrayForTiled("fill_ter")
        }
        for (let mapLayerType of mapLayerTypes){
            tiled.log(`preparing map array for layer '${mapLayerType}'`)
            mapArrays[mapLayerType] = prepareMapArrayForTiled(mapLayerType)
        }
        for (let entityLayerType of entityLayerTypes){
            tiled.log(`preparing object array for layer ${entityLayerType}`)
            mapArrays[entityLayerType] = prepareEntitiesArrayForTiled(entityLayerType)
        }


        // Prepare tiled layer
        function prepareTiledLayer(layername){


            if(mapLayerTypes.includes(layername) || layername == "fill_ter"){
                let tl = new TileLayer(layername);
                tl.width = importMapSize;
                tl.height = importMapSize
                tl.setProperty("cdda_layer", layername)
                let tle = tl.edit()
                tiled.log(`editing layer ${tle.target.name}`)
                if(layername == "fill_ter"){
                    // tiled.log(`fill_ter mapentry: '${mapArrays["fill_ter"]}'`)
                    tl.setProperty("cdda_id", tileDict["fill_ter"][0])
                    for (let entry in mapArrays["fill_ter"]){
                        if(verbose){tiled.log(`( ${mapArrays["fill_ter"][entry][0]}, ${mapArrays["fill_ter"][entry][1]} ) - ${mapArrays["fill_ter"][entry][2]}`)}
                        tle.setTile(mapArrays["fill_ter"][entry][0],mapArrays["fill_ter"][entry][1],mapArrays["fill_ter"][entry][2])
                    }
                    tle.apply();
                    return tl;
                }

                if(mapLayerTypes.includes(layername)){
                    for (let entry in mapArrays[layername]){
                        if(verbose){tiled.log(`'${entry}' - ( ${mapArrays[layername][entry][0]}, ${mapArrays[layername][entry][1]} ) - ${mapArrays[layername][entry][2]}`)}
                        tle.setTile(mapArrays[layername][entry][0],mapArrays[layername][entry][1],mapArrays[layername][entry][2])
                    }
                }
                tle.apply();
                return tl;
            }
            // entities
            if(entityLayerTypes.includes(layername)){
                let og = new ObjectGroup(layername)
                og.width = importMapSize;
                og.height = importMapSize
                og.setProperty("cdda_layer", layername)
                // let oge = og.edit()
                tiled.log(`editing layer ${og.name}`)

                for (let entry in mapArrays[layername]){
                    if (typeof mapArrays[layername][entry][2] === "string"){continue;}
                    // if (layername == "place_item"){
                    let obj = new MapObject()
                    obj.x = (mapArrays[layername][entry][0]*32)
                    obj.y = (mapArrays[layername][entry][1]+1)*32
                    tiled.log(`adding object '${mapArrays[layername][entry][2]}' at ( ${obj.x}, ${obj.y} ) to '${og.name}'`)
                    obj.tile = mapArrays[layername][entry][2]
                    og.addObject(obj);
                    // }
                }
                return og;
            }

            //setTile(x: number, y: number, tile: null | Tile, flags?: number): void
        }
        var layergroup = new GroupLayer(importMapName)


        // add palettes to properties layer
        if(j[i]["object"].hasOwnProperty("palettes")){
            if (Array.isArray(j[i]["object"]["palettes"])){
                for(let p in j[i]["object"]["palettes"]){
                    layergroup.setProperty("cdda_palette_"+p ,j[i]["object"]["palettes"][p])
                }
            } else {
                layergroup.setProperty("cdda_palette_0",j[i]["object"]["palettes"])
            }
        }
        for(let flag of flags){layergroup.setProperty( flag, false); };
        // add flags to properties layer
        if(j[i]["object"].hasOwnProperty("flags")){
            if (Array.isArray(j[i]["object"]["flags"])){
                for(let p in j[i]["object"]["flags"]){
                    layergroup.setProperty(j[i]["object"]["flags"][p] , true);
                }
            } else {
                layergroup.setProperty(j[i]["object"]["flags"], true);
            }
        }
        // add fill_ter to properties layer
        if(j[i]["object"].hasOwnProperty("fill_ter")){
            layergroup.setProperty("fill_ter", j[i].object.fill_ter);
        }
        // if (layername == 'fill_ter'){tl.locked = true;}

        if (import_map.object.hasOwnProperty("fill_ter")){
            layergroup.addLayer(prepareTiledLayer("fill_ter"));
        };
        for (let mapLayerType of mapLayerTypes){
            layergroup.addLayer(prepareTiledLayer(mapLayerType))
        }
        for (let entityLayerType of entityLayerTypes){
            if (entityLayerType == "items"){continue;};
            layergroup.addLayer(prepareTiledLayer(entityLayerType))
        }
        layergroups.push(layergroup)
    }
    for (let lg in layergroups.reverse()){
        tm.addLayer(layergroups[lg]);
    }
    tm.setProperty("import_tileset",config.chosenTileset)
    
    let pathToTMX = config.pathToTMX +"/"+ FileInfo.baseName(pathToMap) +".tmx"
    
    let outputFileResults = tiled.mapFormat("tmx").write(tm, pathToTMX);
    // let outputFileResults = writeToFile(pathToTMX,tm);
    (outputFileResults == null) ? tiled.log(FileInfo.baseName(pathToMap) + " file created successfully.") : tiled.log(FileInfo.baseName(pathToMap) + " - FAILED to create file. Error: " + outputFileResults)
    tiled.open(pathToTMX);
}

function makeEmptyMap(){
    let mapsize = tiled.prompt("Map is square. Length of side in tiles:",24,"Map Size")
    let tmname = `CDDA_map_${mapsize}x${mapsize}`
    let tm = prepareTilemap(tmname,mapsize);
    let terrain = new TileLayer('Terrain');
    terrain.setProperty("cdda_layer","terrain")
    terrain.width = mapsize
    terrain.height = mapsize
    let furniture = new TileLayer('furniture');
    furniture.setProperty("cdda_layer","furniture")
    furniture.width = mapsize
    furniture.height = mapsize
    let items = new TileLayer('items');
    items.setProperty("cdda_layer","items")
    items.width = mapsize
    items.height = mapsize
    let entities = new TileLayer('entities');
    entities.setProperty("cdda_layer","entities")
    entities.width = mapsize
    entities.height = mapsize

    let layergroup = new GroupLayer("My_om_terrain")
    layergroup.setProperty("cdda_palette_0","")

    //in order from bottom to top
    layergroup.addLayer(terrain)
    layergroup.addLayer(furniture)
    layergroup.addLayer(items)
    layergroup.addLayer(entities)
    tm.addLayer(layergroup)


    let filepath = FileInfo.toNativeSeparators(config.pathToTMX+"/"+tmname+".tmx")
        // return tiled.mapFormat(format[1]).write(data, filepath);
    let outputFileResults = tiled.mapFormat("tmx").write(tm, filepath);
    (outputFileResults == null) ? tiled.log(FileInfo.baseName(filepath) + " file created successfully.") : tiled.log(FileInfo.baseName(filepath) + " - FAILED to create file. Error: " + outputFileResults)
    tiled.open(filepath);
}

function exportMap(map){
    initialize();
    // tiled.log(tiled.openAssets)
    if (!tiled.activeAsset.isTileMap){ return tiled.log(`Not on a valid tilemap.`); }
    const currentMap_tm = tiled.activeAsset // get current map


    let mapEntries = []


    // prepare layer group (entry)
    function prepareEntry(layer){ // layer is om_terrain
        if(verbose){tiled.log(`\nworking on layer '${layer.name}'`);}
        let mapEntry = new CDDAMapEntry(currentMap_tm.fileName)
        mapEntry["om_terrain"] = layer.name

        // palettes
        if(Object.keys(layer.properties()).includes("cdda_palette_0")){
            for(let p of Object.keys(layer.properties())){
                if(p.match(/palette/)){
                    if(verbose){tiled.log(`'${layer.name}' has palette '${layer.properties()[p]}'`);};
                    mapEntry.object["palettes"].push(layer.properties()[p]);
                };
            };
        };
        // flags
        for(let flag of flags){
            if(Object.keys(layer.properties()).includes(flag)){
                if(layer.properties()[flag] == true){
                    mapEntry.object.flags.push(flag);
                };
            };
        };

        // find assigned palettes
        var loaded_palettes = []
        for(let filepath of getRecursiveFilePathsInFolder(config.pathToPalettes)){
            if(verbose >= 2){tiled.log(filepath);}
            if (!filepath.match(/\.json$/)){
                continue;
            }
            let palette_json = readJSONFile(filepath)
            for (let palette of palette_json){
                if(verbose >= 2){tiled.log(`checking '${palette.id}' in '${filepath}'`);}
                if(mapEntry.object["palettes"].includes(palette.id)){
                    if(verbose){tiled.log(`found palette '${palette.id}' in '${filepath}'`);}
                    loaded_palettes.push(palette);
                }
            }
        }
        
        let layer_map_array = [] // the rows of the map
        let mapsize = [];
        // initialize rows with empty spaces
        for(let sublayer of layer.layers){
            if(sublayer.isTileLayer){
                for (let y = 0; y < sublayer.height; y++){
                    layer_map_array.push(" ".repeat(sublayer.width)) // create empty rows in the size of the map
                    mapsize = [sublayer.width,sublayer.height]
                }
                break;
            }
        }

        let assigned_symbols_dict = {}; // symbol to cdda id dictionary, by layer
        let assigned_symbols = []; // array of used symbols

        let assigned_cdda_id_symbols = {}; // cdda id to symbol dictionary, by cdda id

        let custom_symbols_dict = {}; // symbol: {layer: [cdda_ids]}
        let need_custom_assign = {};
        let combined_symbols_dict = {}; // symbol: {layer: [cdda_ids]}
        let coordinate_assignments = {}; // (x,y): [cdda_ids]

        // get all cdda ids associated with each symbol in palette, by symbol
        let palette_objects_with_symbols = ["terrain", "furniture"]
        for(let palette of loaded_palettes){ // get symbols from palette by layer (terrain, furniture, items, etc.) to avoid using for custom assignment
            for(let object of palette_objects_with_symbols){
                if(!palette.hasOwnProperty(object)){continue;}
                for(let symbol of Object.keys(palette[object])){

                    if(!combined_symbols_dict.hasOwnProperty(symbol)){
                        combined_symbols_dict[symbol] = []
                    }
                    if(palette[object][symbol].hasOwnProperty("param")){ // is object "param"
                        combined_symbols_dict[symbol].push([palette[object][symbol].param])
                    
                    } else if(palette[object][symbol].hasOwnProperty("switch")){ // is object "switch"
                        if(palette[object][symbol].switch.hasOwnProperty("param")){ 
                            combined_symbols_dict[symbol].push([palette[object][symbol].switch.param])
                        }
                    
                    }else if(Array.isArray(palette[object][symbol])){ // is array
                        let temparray = []
                        for(let entry of palette[object][symbol]){
                            if(typeof entry === "string"){
                                temparray.push([entry])
                            }
                            if(Array.isArray(entry)){
                                temparray.push([entry[0]])
                            }
                        }
                        combined_symbols_dict[symbol].push([temparray])
                    } else if (typeof palette[object][symbol] === "string"){
                        combined_symbols_dict[symbol].push([palette[object][symbol]])
                    }

                    if(!assigned_symbols.includes(symbol)){assigned_symbols.push(palette[object][symbol].param);}
                }
            }
        }
        // get all assigned cdda ids by coordinate
        for(let sublayer of layer.layers){
            if (sublayer.property("cdda_layer") == "fill_ter"){ continue;};
            if(sublayer.isTileLayer){
                for (let y = 0; y < sublayer.height; y++){
                    for (let x = 0; x < sublayer.width; x++){
                        if (sublayer.tileAt(x,y) != null) { // check if 'valid' tile
                            if (typeof sublayer.tileAt(x,y).property("cdda_id") === "string") { // check if tile has cdda id
                                let tile_cdda_id = sublayer.tileAt(x,y).property("cdda_id"); // get cdda id
                                let thisxy = `[${x},${y}]`;
                                if(!coordinate_assignments.hasOwnProperty(thisxy)){
                                    coordinate_assignments[thisxy] = {};
                                }
                                if(!coordinate_assignments[thisxy].hasOwnProperty(sublayer.property("cdda_layer"))){
                                    coordinate_assignments[thisxy][sublayer.property("cdda_layer")] = [];
                                }
                                coordinate_assignments[thisxy][sublayer.property("cdda_layer")].push(tile_cdda_id)
                            }
                        }
                    }
                }
            }
        }
        
        for(let symbol in combined_symbols_dict){ // get palette symbols for exclusion
            if(!assigned_symbols.includes(symbol)){assigned_symbols.push(symbol);}
        }

        tiled.log(`Layer dimensions: ${layer.layers}`)
        if(verbose){tiled.log(`coordinate assignemnts:`);}
        for (let ca in coordinate_assignments){
            if(verbose){tiled.log(`${ca} > ${flattenDict(coordinate_assignments[ca])} (${Object.keys(coordinate_assignments[ca]).length})`);}

        }
        if(verbose){tiled.log(`combined symbols assignemnts:`);}
        for (let s in combined_symbols_dict){
            if(verbose){tiled.log(`${s} > ${combined_symbols_dict[s]} (${combined_symbols_dict[s].length})`);}

        }
        // assign symbols to coordinates on map
        coordinate_entry_loop:
        for(let coordinate of Object.keys(coordinate_assignments)){
            let coordmatch = coordinate.match(/\[(\d+)\,(\d+)\]/)
            let x = Number.parseInt(coordmatch[1],10)
            let y = Number.parseInt(coordmatch[2],10)


            for(let possible_symbol in combined_symbols_dict){ // assign palette symbols
                if(verbose >= 3){tiled.log(`'${coordinate}' possible symbol '${possible_symbol}'`);}
                if(combined_symbols_dict[possible_symbol].length == Object.keys(coordinate_assignments[coordinate]).length && 
                    flattenDict(coordinate_assignments[coordinate]).every(r => flatten(combined_symbols_dict[possible_symbol]).includes(r))
                    ){
                    if(verbose ){tiled.log(`[${x},${y}] palette assign '${possible_symbol}' > '${flattenDict(coordinate_assignments[coordinate])}'`);}
                    layer_map_array[y] = layer_map_array[y].slice(0,x)+possible_symbol+layer_map_array[y].slice(x+1)

                        
                    for(let entry of palette_objects_with_symbols){
                        if(coordinate_assignments[coordinate].hasOwnProperty(entry)){
                            coordinate_assignments[coordinate][entry]
                        }
                    }
                    
                    continue coordinate_entry_loop;
                    // if(!assigned_symbols.includes(possible_symbol)){assigned_symbols.push(possible_symbol);} // get used symbols
                } else { // no matches found in palette
                    need_custom_assign[coordinate] = coordinate_assignments[coordinate] 
                }
            }

            // custom symbols

            // previously defined symbol
            for(let object of palette_objects_with_symbols){
            }
            for(let symbol of Object.keys(custom_symbols_dict)){
                if(
                    Object.keys(custom_symbols_dict[symbol]).length == Object.keys(coordinate_assignments[coordinate]).length && 
                    flattenDict(coordinate_assignments[coordinate]).every(r => flattenDict(custom_symbols_dict[symbol]).includes(r))
                ){
                    if(verbose){tiled.log(`[${x}, ${y}] - previously assigned '${symbol}' > '${flattenDict(coordinate_assignments[coordinate])}'`);}
                    layer_map_array[y] = layer_map_array[y].slice(0,x)+symbol+layer_map_array[y].slice(x+1)
                    
                    continue coordinate_entry_loop;
            }
            }
            // newly defined symbol
            for(let symbol of possible_unicode_chars){
                if(assigned_symbols.includes(symbol)){continue;} else { assigned_symbols.push(symbol);}
                if(verbose){tiled.log(`( ${x}, ${y} ) - newly assigned '${symbol}' > '${flattenDict(coordinate_assignments[coordinate])}'`);}
                custom_symbols_dict[symbol] = coordinate_assignments[coordinate]
                layer_map_array[y] = layer_map_array[y].slice(0,x)+symbol+layer_map_array[y].slice(x+1)
                for(let entry in coordinate_assignments[coordinate]){
                    let entry_ready = coordinate_assignments[coordinate][entry];
                    if(Array.isArray(entry_ready) && entry_ready.length === 1){
                        entry_ready = entry_ready[0]
                    }
                    if (entry == "terrain"){ mapEntry.object.terrain[symbol] = entry_ready; }
                    if (entry == "furniture"){ mapEntry.object.furniture[symbol] = entry_ready; }
                }
                continue coordinate_entry_loop;
            }
        }
        tiled.log("complete symbol map")
        for (let y = 0; y < layer_map_array.length; y++){
            tiled.log(layer_map_array[y])
            for (let x = 0; x < layer_map_array[y].length; x++){
            };
        };
        mapEntry.object.rows = layer_map_array

        tiled.log("assigned symbols = "+assigned_symbols)
        for (let d in mapEntry.object){ // cleanup empty 'objects'
            if (mapEntry.object[d] == "" || (typeof mapEntry.object[d] === "object" &&  Object.keys(mapEntry.object[d]).length === 0)){ delete mapEntry.object[d]; };
        };
        return mapEntry;
    }
    for (let layer of currentMap_tm.layers){
        mapEntries.push(prepareEntry(layer))
    }
    
    // delete unused fields from map entry
    // tiled.log(mapEntries[0].object.rows[4])
    return mapEntries.reverse();
}

var CDDAMapFormat = {
    name: "CDDA map format",
    extension: "json",

    write: function(map, fileName) {
        var m = exportMap(map);

        var file = new TextFile(fileName, TextFile.WriteOnly);
        file.write(JSON.stringify(m, null, 2));
        file.codec = "UTF-8"
        file.commit();
    }
};

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
                if(verbose >= 2){tiled.log(`entry id: ${tileid} property name: ${propertyKeyValue[1]} cdda id (property value): ${propertyKeyValue[2]}`);}
            }
        }
    }
    return xmlDictionary;
};

function findTileInTilesets(){
    let cdda_id_tofind = tiled.prompt(`Find tile with corresponding CDDA ID:`,"t_floor","Find Tile by CDDA ID").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"")
    tiled.log(`Searching for '${cdda_id_tofind}'...`)
    var ts;
    let tsxs = getFilesInPath(config.pathToChosenTilesetTSX)

    for(let filename of tsxs){
        if (!filename.match(/\.tsx$/)){
            continue
        }
        let filepath = FileInfo.toNativeSeparators(config.pathToChosenTilesetTSX+ "/" +filename)
        if(verbose >= 2){tiled.log(`${filepath}`);}
        let tsxData = TSXread(filepath)
        for ( let tileid in tsxData.tiles ){
            if( tsxData.tiles[tileid].hasOwnProperty("properties")){
                for ( let property in tsxData.tiles[tileid].properties ){
                    if( verbose >= 2){tiled.log(`checking '${property}' in id '${tileid}'`);}
                    if(tsxData.tiles[tileid].properties[property] == cdda_id_tofind){
                        tiled.log(`'${cdda_id_tofind}' found. '${tileid}' in '${filename}'`)
                        let tileset = tiled.open(filepath)
                        tileset.selectedTiles = [tileset.findTile(tileid)]
                        
                        return;
                    }
                }
            }
        }
    }
    tiled.log(`'${cdda_id_tofind}' not found.`)
};
function flattenDict(dict, result) {
    if (typeof result === "undefined") {
        result = [];
    }
    for (let i in dict) {
        if ((dict[i].constructor == Object)) {
            flattenDict(dict[i], result);
        } else {
            if (Array.isArray(dict[i])) {
                let flat = flatten(dict[i])
                for(var a = 0; a < flat.length; a++){
                    result.push(flat[a]);
                }
            }
        }
    }
    return result;
};
function flatten(arr, result) {
    if (typeof result === "undefined") {
        result = [];
    }
    for (var i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            flatten(arr[i], result);
        } else {
            result.push(arr[i]);
        }
    }
    return result;
};

class CDDAMapEntryImport {
    constructor(entry) {
        this.name = entry['om_terrain'];
        this.om_terrain = entry['om_terrain'];
        this.width = entry['object']['rows'][0].length;
        this.height = entry['object']['rows'].length;
        this.fill_ter = entry['object']['fill_ter'];
        this.weight = entry['weigth'];
        this.object = { // place_ uses x,y otherwise uses tile symbol
            "flags": entry['object']['flags'],
            "fill_ter": entry['object']['fill_ter'],
            "palettes": entry['object']['palettes'],
            "predecessor_mapgen": entry['object']['predecessor_mapgen'],
            "distribution": entry['object']["distribution"],
            "rows": entry['object']['rows'],
            "terrain":entry['object']["terrain"],
            "furniture": entry['object']["furniture"],
            "items": entry['object']["items"],
            "place_computers": entry['object']["place_computers"],
            "place_monsters": entry['object']["place_monsters"],
            "place_vehicles": entry['object']["place_vehicles"],
            "place_liquids": entry['object']["place_liquids"],
            "place_corpses": entry['object']["place_corpses"],
            "place_rubble": entry['object']["place_rubble"],
            "place_nested": entry['object']["place_nested"],
            "place_items": entry['object']["place_items"],
            "place_item": entry['object']["place_item"],
            "place_loot": entry['object']["place_loot"],
            "sealed_item": entry['object']["sealed_item"],
            "computers": entry['object']["computers"],
            "graffiti": entry['object']["graffiti"],
            "toilets": entry['object']['toilets'],
            "traps": entry['object']["traps"],
            "zones": entry['object']["zones"]
        };
    };
};
class CDDAMapEntry {
    constructor(om_terrain) {
        this.type = "mapgen";
        this.method = "json";
        this.om_terrain = om_terrain;
        this.weight = 1000;
        this.object = {
            "fill_ter": "",
            "palettes": [],
            "rows": [],
            "flags": [],
            "terrain": {},
            "furniture": {},
            "place_loot": [],
            "items": [],
            "place_item": [],
            "place_items": [],
            "place_monsters": [],
            "place_vehicles": []
        };
    };
};
class extensionConfig {
    constructor(pathToProject,pathToCDDA = "~/cdda") {
        this.filename = configfilename;
        this.pathToExtras = pathToExtras;
        this.pathToCustomTileset = FileInfo.toNativeSeparators(this.pathToExtras + "/cdda_custom_tileset.tsx");
        this.pathToProject = pathToProject;
        this.pathToTSX = FileInfo.toNativeSeparators(pathToProject + "/tsx");
        this.pathToTMX = FileInfo.toNativeSeparators(pathToProject + "/tmx");
        this.pathToCDDA = pathToCDDA;
        this.pathToTilesets = FileInfo.toNativeSeparators(pathToCDDA + "/gfx");
        this.pathToPalettes = FileInfo.toNativeSeparators(pathToCDDA + "/data/json/mapgen_palettes");
        this.chosenTileset = "ChibiUltica";
        this.pathToChosenTileset = FileInfo.toNativeSeparators(this.pathToTilesets + "/" + this.chosenTileset);
        this.pathToChosenTilesetTSX = FileInfo.toNativeSeparators(pathToProject + "/tsx/"+this.chosenTileset)
        this.pathToJSON = FileInfo.toNativeSeparators(this.pathToChosenTileset + "/tile_config.json");
        this.pathToFavoritesTSX = FileInfo.toNativeSeparators(pathToProject + "/tsx/favorites/favorites.tsx");
};
};
// tiled.log(tiled.actions)
// tiled.trigger(tiled.actions)

//import CDDA Tileset
const action_importTileset = tiled.registerAction("CustomAction_importTileset", function(action_importTileset) {
    tiled.log(`${action_importTileset.text} was run.`)
    initialize()
    importTilesets()
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
    exportMap()
});
//Find tile in tileset by CDDA ID
const action_findTileInTilemap = tiled.registerAction("CustomAction_CDDA_map_findTileInTileset", function(action_findTileInTilemap) {
    tiled.log(`${action_findTileInTilemap.text} was run.`)
    initialize() ? findTileInTilesets() : tiled.log("Action aborted.")
});
//Add sprite to favorites tileset
const action_add_sprite_to_favotires = tiled.registerAction("CustomAction_CDDA_add_sprite_to_favotires", function(action_add_sprite_to_favotires) {
    tiled.log(`${action_add_sprite_to_favotires.text} was run.`)
    initialize() ? addSpriteToFavotires() : tiled.log("Action aborted.")
    
});
//change path to project
const action_changeProjectPath = tiled.registerAction("CustomAction_changeProjectPath", function(action_changeProjectPath) {
    tiled.log(`${action_changeProjectPath.text} was run.`)
    initialize() ? changeProjectPath() : tiled.log("Action aborted.")
});
//test action for debug
const action_cdda_debug = tiled.registerAction("CustomAction_cdda_debug", function(action_cdda_debug) {
    tiled.log(`${action_cdda_debug.text} was run.`)
    // tiled.log(tiled.actions)
    tiled.trigger("CustomAction_CDDA_add_sprite_to_favotires")
    // initialize()
    // findTileInTilesets(cdda_id_tofind)
});

action_importTileset.text = "Import CDDA tileset"
action_createNewMap.text = "Create new CDDA map"
action_importMap.text = "Import CDDA map"
action_exportMap.text = "Export to CDDA map"
action_findTileInTilemap.text = "Find CDDA Tile"
action_findTileInTilemap.shortcut = "CTRL+SHIFT+F"
action_add_sprite_to_favotires.text = "Add Sprite to Favorites"
action_add_sprite_to_favotires.shortcut = "CTRL+SHIFT+D"
action_changeProjectPath.text = "Change project path"

action_cdda_debug.text = "run associated debug action"
action_cdda_debug.shortcut = "CTRL+D"

//tiled.log(tiled.menus)
tiled.extendMenu("File", [
    { separator: true },
    { action: "CustomAction_importTileset", before: "Close" },
    { action: "CustomAction_importMap", before: "Close" },
    { action: "CustomAction_createNewMap", before: "Close" },
    { action: "CustomAction_changeProjectPath", before: "Close" },
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
    { action: "CustomAction_CDDA_add_sprite_to_favotires", after: "Terrain Sets" },
    { separator: true }
]);
tiled.extendMenu("Help", [
    { separator: true },
    { action: "CustomAction_cdda_debug", after: "Terrain Sets" },
    { separator: true }
]);