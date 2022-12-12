/// <reference types="@mapeditor/tiled-api" />import_map
//ChibiUltica
//0x400 | 0x2000 | 0x4000 qdir filter for dir no dot and dotdot
//0x002 | 0x2000 | 0x4000 qdir filter for file no dot and dotdot
//JSON.stringify(m, null, 2) sringify with formatting
var verbose = false
var use_pretty_symbols = true

const pathToUserFolder = FileInfo.toNativeSeparators(tiled.extensionsPath.match(/(.*?(?:Users|home)(?:\/|\\|\\\\)\w+)/i)[1])
const pathToExtras = FileInfo.toNativeSeparators(tiled.extensionsPath + "/cdda_map_extension_extras");
const pathToMainConfig = FileInfo.toNativeSeparators(pathToExtras + "/cdda_map_extension_main_config.json")
const configfilename = "tiled_cdda_extension_config.json";

const mapLayerTypes = ["terrain","furniture","traps","vehicles","items"]
const entityLayerTypes = ["place_items", "place_item", "place_loot", "place_monsters", "place_vehicles", "place_fields", "place_zones"]
const flags = ["ERASE_ALL_BEFORE_PLACING_TERRAIN","ALLOW_TERRAIN_UNDER_OTHER_DATA","NO_UNDERLYING_ROTATE","AVOID_CREATURES"]
const utf_ramps = {
    "utf8_shortlist" : `#$%&'()*+,-.:;<=>@ABCDEFGHIJKLMNOPQRSTUVWXYZ^_abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§©ª«¬®¯°±²³µ¶·¹º»¼½¾¿0123456789`,
    "greyscale_ramp" : `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,^'.`,
    "us_keyboard" : {
        "groundcover": ` ._,':-;`,
        "soil": `, ._':-;`,
        "floor" : ` ._,':-;`,
        "sidewalk" : `s.,='_`,
        "pavement" : `_.~=',`,
        "pavement_y": `y:,`,
        "thconc_y": `y:,`,
        "column" : `I1`,
        "pillar" : `I1`,
        "solid" : `#@|-I!`,
        "wall_wood" : `wW|I`,
        "wall_log" : `wW|I`,
        "wall" : `|#-I!`,
        "mound" : `DO#()%`,
        "fence" : `fF%#Ŧ`,
        "door_glass" : `gG:+D`,
        "door_locked" : `*L+D`,
        "door" : `+D-`,
        "open": `-'o`,
        "gate": `gG+-`,
        "t_door_metal_locked": `=M`,
        "window_open" : `oO'wW`,
        "window" : `wWoOvV`,
        "downspout" : `^4`,
        "_up" : `<^`,
        "_down" : `>v`,
        "water" : `Ww~≈`,
        "sewage" : `~wW`,
        "box" : `xX`,
        "f_crate_o" : `oO`,
        "f_crate_c" : `xX`,
        "sand" : `s~`,
        "telep" : `o`,
        "toilet" : `tT`,
        "table" : `ntT`,
        "locker" : `lL`,
        "rack" : `rRH`,
        "sink" : `Ss`,
        "chair" : `hc`,
        "sofa" : `H?`,
        "bench" : `bB`,
        "bookcase" : `BR{`,
        "dresser" : `dD`,
        "flower" : `!i`,
        "tree" : `7/T!`,
        "bush" : `$#%/&`,
        "underbrush" : `$#%/&`,
        "shrub" : `$#%/&`,
        "rubble" : `rRzZ^&#`,
        "console" : `6X`,
        "t_null" : `│`
    },
    "pretty" : {
        "t_soil" : `░`,
        "wall" : `▓▒░$@B%&WM#/|(){}[]!I`,
        "fence" : `‡ǂ#H`,
        "door" : `D`,
        "window" : `o◦`,
        "pavement" : `'^,:;_-+`,
        "sidewalk" : `'^,:;_-+`,
        "floor" : `'^,:;_-+`,
        "_up" : `<Λ↑⇑⇡⇧`,
        "_down" : `>V↓⇓⇣⇩`,
        "ladder" : `ʭΞ`,
        "water" : `~≈w`,
        "box" : `□▫⬞`,
        "sandbag" : `⬝▪■`,
        "trap" : `♣♠♦*ϗ`,
        "telep" : `◌●◙`,
        "table" : `πΠ`,
        "chair" : `h`,
        "others" : `⧫ᒤᒦᒌᕈҐᖗᖙᖘᖚ⅄♪♫ʬ♥♣♠♦`
    }
}
const no_id_objects = ["rows","palettes","fill_ter","//","id","type"]

var skipOverwrite = true;
var overwriteExisting = true;
var config = {};
var mainConfig = {};
var imageCache = {};

const cte = { // helper functions
    replaceNewlines: function replaceNewlines(str) {
        // Use the regular expression to find objects with 4 or fewer entries
        var regex = /\{\n(?:.*?,(\n)){0,4}(?:.*?(\n)).*?},?/gm;
        var matches = str.match(regex);
      
        // Replace newlines in each match with spaces
        if (matches) {
          matches.forEach((match) => {
            str = str.replace(match, match.replace(/\n\t*/g, " ")).trim();
          });
        }
      
        // Return the updated string
        return str;
    },
    filePicker: function filePicker(func,filepath){
        let dialog = new Dialog()
        // if(dialog===undefined){dialog = new Dialog();}
        filepath == undefined ? filepath = FileInfo.fromNativeSeparators(mainconfig.pathToProject) : filepath = FileInfo.fromNativeSeparators(filepath)
        let newFilepath;
        let fileEdit = dialog.addFilePicker();
        dialog.addNewRow();
        fileEdit.fileUrl = filepath;
        tiled.log(fileEdit.fileUrl)
        tiled.log(fileEdit.fileUrl.toString())
        tiled.log(filepath)
        let acceptButton = dialog.addButton(`Accept`);
        let cancelButton = dialog.addButton(`Cancel`);
        acceptButton.clicked.connect(function(){
            dialog.accept();
        })
        cancelButton.clicked.connect(function(){
            dialog.reject();
        })
        dialog.accepted.connect(()=>{
            newFilepath = fileEdit.fileUrl.toString().replace(/^file\:\/\/\//,"")
            // tiled.log(fileEdit.fileUrl.toString());
            // tiled.log(newFilepath);
            func(newFilepath)
            return newFilepath
        })
        dialog.show()
    },
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
    },
    getSortedKeys : function getSortedKeys(dict){
        var sorted = [];
        for(var key in dict) {
            sorted[sorted.length] = key;
        }
        return sorted.sort((a,b) => a.length - b.length);
    },
    goToTile : function goToTile(id,filepath){
        let asset = ""
        if(tiled.activeAsset.isTileMap){
            let map = tiled.activeAsset
            for( let tileset of tiled.activeAsset.tilesets.concat(tiled.openAssets)){
                if(tileset.fileName == FileInfo.fromNativeSeparators(filepath)){
                    asset = tileset
                    break
                }
            }
            if(asset === ""){
                let mapasset = tiled.activeAsset
                let mappath = tiled.activeAsset.fileName
                asset = tiled.open(filepath)
                let map = tiled.open(mappath)
                tiled.mapEditor.currentBrush.addTileset(asset)
            }
            tiled.mapEditor.tilesetsView.currentTileset = asset
            tiled.mapEditor.tilesetsView.selectedTiles = [asset.findTile(id)]
        }  else {
            asset = tiled.open(filepath)
            asset.selectedTiles = [asset.findTile(id)]
        }
    },
    updateConfig : function updateConfig(){
        var pathToConfig = FileInfo.toNativeSeparators(mainConfig.pathToProject+"/"+configfilename)
        var configfile = new TextFile(FileInfo.cleanPath(pathToConfig), TextFile.WriteOnly); 
        configfile.write(JSON.stringify(config,null,2));
        configfile.commit();
    },
    getFilesInPath : function getFilesInPath(path){ return File.directoryEntries(path, 0x002 | 0x2000 | 0x4000);},
    getFoldersInPath : function getFoldersInPath(path){ return File.directoryEntries(path, 0x400 | 0x2000 | 0x4000);},
    flattenDict : function flattenDict(dict, result) {
        if (typeof result === "undefined") {
            result = [];
        }
        for (let i in dict) {
            if ((dict[i].constructor == Object)) {
                cte.flattenDict(dict[i], result);
            } else {
                if (Array.isArray(dict[i])) {
                    let flat = cte.flattenArray(dict[i])
                    for(var a = 0; a < flat.length; a++){
                        result.push(flat[a]);
                    }
                }
            }
        }
        return result;
    },
    flattenDictKeys : function flattenDictKeys(dict, result) {
        if (typeof result === "undefined") {
            result = [];
        }
        for (let i in dict) {
            if ((dict[i].constructor == Object)) {
                result.push(i);
                cte.flattenDictKeys(Object.keys(dict[i]), result);
            }
        }
        return result;
    },
    flattenArray : function flattenArray(arr, result) {
        if (typeof result === "undefined") {
            result = [];
        }
        for (var i = 0; i < arr.length; i++) {
            if (Array.isArray(arr[i])) {
                cte.flattenArray(arr[i], result);
            } else {
                result.push(arr[i]);
            }
        }
        return result;
    }
}

function initialize(){
    if( !File.exists(pathToMainConfig)){
        action_cdda_verbose.checked = true
        mainConfig = { "pathToProject" : "~/cdda_tiled_project" }
        // let pathToProject = FileInfo.toNativeSeparators(FileInfo.path(tiled.prompt("Path to tiled project folder:",mainConfig.pathToProject,"project Path").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"").replace("~",pathToUserFolder)))
        prepareMainConfig(mainConfig.pathToProject)
        loadMainConfig()
        // let dialog = cte.filePicker(prepareMainConfig,mainConfig.pathToProject)
        // dialog.rejected.connect(function(){ return false;})
        // dialog.accepted.connect(function(){
        //     return true
        // })
    } else {
        loadMainConfig()
        return true
    }
    function prepareMainConfig(filepath){
        var mainConfigfile = new TextFile(FileInfo.cleanPath(pathToMainConfig), TextFile.WriteOnly); 
        
        mainConfigfile.write(JSON.stringify(mainConfig,null,2));
        mainConfigfile.commit();
        mainConfig = readJSONFile(pathToMainConfig)
        tiled.log(`generating main config file at '${pathToMainConfig}'`)
        changeProjectPath()
    }
    function loadMainConfig(){
        mainConfig = readJSONFile(pathToMainConfig)
        if(mainConfig.pathToProject.match(/\.json$/)){
            mainConfig.pathToProject = FileInfo.path(mainConfig.pathToProject)
        }
        var pathToConfig = FileInfo.toNativeSeparators(mainConfig.pathToProject+"/"+configfilename)
        if( !File.exists(mainConfig.pathToProject)){File.makePath(mainConfig.pathToProject);}
    
        if( !File.exists(pathToConfig)){
            tiled.log(`no config file found at ${pathToConfig}. Making new config file.`) 
            let givenPathToCDDA = FileInfo.toNativeSeparators(tiled.prompt("Path to CDDA folder:",config.pathToCDDA,"CDDA Path").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"").replace("~",pathToUserFolder))
            config = new extensionConfig(mainConfig.pathToProject,givenPathToCDDA);
            // config.pathToExtras = pathToExtras;
            cte.updateConfig()
        } else {
            if(verbose >= 2){tiled.log(`config file found at ${pathToConfig}`);}
            config = readJSONFile(pathToConfig)
        }
        if( !File.exists(config.pathToTSX) ){File.makePath(config.pathToTSX);}
        if( !File.exists(config.pathToTMX) ){File.makePath(config.pathToTMX);}
        if( !File.exists(config.pathToCustomTileset) ){tiled.log("Generating custom tileset.");generateMetaTileset();}
        return 1;
    }
}
function changeProjectPath(){
    var loggedPathToProject = mainConfig.pathToProject
    var pathToProject = FileInfo.toNativeSeparators(tiled.prompt("Path to Tile project:",loggedPathToProject,"Tiled Project Path").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"").replace("~",pathToUserFolder))
    if (pathToProject.match(/\.tiled-project$/)){pathToProject = FileInfo.path(pathToProject)}
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
function addSpriteToFavotires(){
    let originalAsset = tiled.activeAsset
    let tileset;
    let tiles;
    if(tiled.activeAsset.isTileset){
        if(verbose >= 1){tiled.log(`asset is tileset`)}
        tileset = tiled.activeAsset;
        tiles = tiled.activeAsset.selectedTiles;
    }
    if(tiled.activeAsset.isTileMap){
        if(verbose >= 1){tiled.log(`asset is tilemap`)}
        tileset = tiled.mapEditor.tilesetsView.currentTileset;
        tiles = tiled.mapEditor.tilesetsView.selectedTiles;
    }
    if(tiles.length < 1){ return tiled.log(`No tiles selected.`)}
    let pathToFavoriteImages = FileInfo.toNativeSeparators(FileInfo.path(config.pathToFavoritesTSX)+"/images");
    if(!File.exists(FileInfo.path(config.pathToFavoritesTSX))){File.makePath(FileInfo.path(config.pathToFavoritesTSX));};
    if(!File.exists(pathToFavoriteImages)){File.makePath(pathToFavoriteImages);};
    
    let favorites;
    if(!File.exists(config.pathToFavoritesTSX)){
        favorites = new Tileset("Favorites");
        tiled.tilesetFormat("tsx").write(favorites,config.pathToFavoritesTSX);
    }
    for(let asset of tiled.openAssets){
        if(asset.fileName == config.pathToFavoritesTSX){
            favorites = asset
            break
        }
    }
    if(favorites === undefined){
        favorites = tiled.open(config.pathToFavoritesTSX);
    }

    for(let tile of tiles){
        let pathToImage = FileInfo.toNativeSeparators(`${pathToFavoriteImages}/${tile.property(`cdda_id`)}.png`)
        let [x,y] = cte.getTileXY(tile)
        let croppedImage = cte.cropImage(tileset.image,x,y);
        croppedImage.save(pathToImage);
        let img = new Image(pathToImage);
        let croppedImageTile = favorites.addTile()
        croppedImageTile.setProperty("cdda_id",tile.property(`cdda_id`))
        croppedImageTile.setImage(img)
        tiled.log(`'${tile.property(`cdda_id`)}' added to favorites.`)
    }
    // tiled.log(tiled.activeAsset.selectedTiles)
    tiled.tilesetFormat("tsx").write(favorites,config.pathToFavoritesTSX);
    tiled.reload(tiled.activeAsset)
    tiled.open(originalAsset.fileName)
}
function add_cdda_id_to_unknowns(cdda_id){
    let customTiles = tiled.open(config.pathToCustomTileset)
    // let customTilesData = TSXread(config.pathToCustomTileset)
    let unknown_tile;
    for(let tile of customTiles.tiles){
        if(tile.property("cdda_id") == "unknown_tile"){
            unknown_tile = tile
            break
        }
    }
    let pathToUnknownTileImage = unknown_tile.imageFileName
    tiled.close(customTiles)
    
    let unknowns;
    if(!config.hasOwnProperty(pathToUnknownsTSX)){
        config.pathToUnknownsTSX = FileInfo.toNativeSeparators(config.pathToChosenTilesetTSX+"/unknown_tiles.tsx")
        cte.updateConfig()
    }
    if(!File.exists(config.pathToUnknownsTSX)){
        unknowns = new Tileset("Unknown Tiles");
        tiled.tilesetFormat("tsx").write(favorites,config.pathToUnknownsTSX);
    }
    for(let asset of tiled.openAssets){
        if(asset.fileName == config.pathToUnknownsTSX){
            unknowns = asset
            break
        }
    }
    if(unknowns === undefined){
        unknowns = tiled.open(config.pathToUnknownsTSX);
    }

    if(!imageCache.hasOwnProperty(`unknown_tile_image`)){
        imageCache.unknown_tile_image = new Image(pathToUnknownTileImage);
    }
    let img = imageCache.unknown_tile_image

    let newUnknownTile = unknowns.addTile()
    newUnknownTile.setProperty("cdda_id",cdda_id)
    newUnknownTile.setImage(img)
    if(verbose >= 1){tiled.log(`'${tile.property(`cdda_id`)}' added to unknowns.`)}

    tiled.tilesetFormat("tsx").write(unknowns,config.pathToUnknownsTSX);
    // tiled.close(unknowns)
    return newUnknownTile
}

// meta tileset
function generateMetaTileset(){
    // File.exists(FileInfo.toNativeSeparators(tiled.extensionsPath+"/cdda_map_extension_extras"))
    if(!config.hasOwnProperty("pathToExtras")){return tiled.log(`Path to Extras not defined`)}
    if(!File.exists(config.pathToExtras)){tiled.makePath(config.pathToExtras);}
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
    let filePaths = cte.getFilesInPath(targetPath).map(a => FileInfo.toNativeSeparators(targetPath+"/"+a))
    let folderPaths = cte.getFoldersInPath(targetPath).map(a => targetPath+"/"+a);
    for (let folderPath in folderPaths){
        filePaths = filePaths.concat(cte.getFilesInPath(folderPath).map(a => folderPath+"/"+a));
        let subfolders = cte.getFoldersInPath(folderPath).map(a => folderPath+"/"+a)
        for (let subfolder in subfolders){
            if ( subfolders != null ) { folderPaths.push(subfolder); }
        }
    }
    if (verbose >= 2){tiled.log(`palette file paths`);};
    if (verbose >= 2){tiled.log(filePaths);};
    return filePaths;
}


function importTilesets(){
    
    config.pathToChosenTileset = FileInfo.toNativeSeparators(tiled.prompt("Path to Folder of Tileset to import:",config.pathToChosenTileset,"Tileset Path").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"").replace("~",pathToUserFolder))
    if(!config.pathToChosenTileset){return tiled.log("Action cancelled.")}
    if(config.pathToChosenTileset.match(/\.json$/)){config.pathToChosenTileset = FileInfo.path(config.pathToChosenTileset)}
    
    config.chosenTileset = config.pathToChosenTileset.match(/(?:\/|\\|\\\\)(?:(\.?.+$)|(?:(\.?.+)(?:\/|\\|\\\\).+\..+))/)[1]
    config.pathToJSON = FileInfo.toNativeSeparators(config.pathToChosenTileset + "/tile_config.json");
    
    config.pathToChosenTilesetTSX = FileInfo.toNativeSeparators(mainConfig.pathToProject + "/tsx/"+FileInfo.baseName(config.chosenTileset))
    if( !File.exists(config.pathToChosenTilesetTSX) ){File.makePath(config.pathToChosenTilesetTSX);}
    
    cte.updateConfig();
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
                            // if(cte.flattenDict(TSXread(config.pathToFavoritesTSX)).includes(tile.id[n])){
                            //     tiled.log(`!!!gotem`)
                            //     continue;
                            // }
                            let tileImg = new Image(pathToThisDupeImage);
                            let croppedImageTile = dupe_tileset.addTile()
                            croppedImageTile.setProperty("cdda_id",tile.id[n])
                            croppedImageTile.setImage(tileImg)
                        } else {
                            currentTile.setProperty('cdda_id', tile.id[n])
                        }



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
                        // if(cte.flattenDict(TSXread(config.pathToFavoritesTSX)).includes(tile.id)){
                        //     tiled.log(`!!!gotem`)
                        //     continue;
                        // }
                        let tileImg = new Image(pathToThisDupeImage);
                        let croppedImageTile = dupe_tileset.addTile()
                        croppedImageTile.setProperty("cdda_id",tile.id)
                        croppedImageTile.setImage(tileImg)
                    } else {
                        currentTile.setProperty('cdda_id', tile.id)
                    }
                    // currentTile.setProperty('CDDA_ID_'+propertyIndex.toString(), tile['id'])
                }
                if(currentTile.property("cdda_id").match(/^mon_/)){
                    currentTile.setProperty("density",0.5)
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
    f.codec = "UTF-8"
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
function prepareTilemap(tmname = 'CDDA_map_24x24',mapsize = [24,24]){
    let tm = new TileMap()
    tm.setSize(mapsize[0],mapsize[1]);
    tm.setTileSize(32, 32);
    tm.orientation = TileMap.Orthogonal;
    if(verbose >= 1){tiled.log(`tilemap name: ${tmname}`)}
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
                        tiled.log(`\t${key} > ${thisPalette[mapLayerType][key]}\tadded to palette '${mapLayerType}'.`)
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

function importMapChoiceDialog(filepath){
    if([`linux`,`unix`,`macos`].includes(tiled.platform)){if(verbose >=1){tiled.log(`nix system`);};filepath = `/${filepath}`;}
    let f = new TextFile(filepath, TextFile.ReadOnly);
    f.codec = "UTF-8"
    let c = f.readAll();
    f.close();
    let j = JSON.parse(c);
    
    let dialog = new Dialog()
    dialog.windowTitle = `Select Maps to Import`
    dialog.addLabel(`Select maps (om_terains or [n] nested) to import from map file '${FileInfo.fileName(filepath)}'.\n
Maps with different sizes will all import with largest size.
MouseOver tooltips not formatted - for preview only.\n
Don't forget to SAVE YOUR MAP`,true)
    dialog.addNewRow()
    dialog.addSeparator(`Maps`)
    let mapEntriesToImport = {}
    for(let i in j){
        if(j[i].type != "mapgen" || j[i].method != "json"){continue;}
        let name;
        let height;
        let width;
        let tooltiptext;
        if(j[i].hasOwnProperty(`om_terrain`)){
            name = j[i].om_terrain
        }
        if(j[i].hasOwnProperty(`nested_mapgen_id`)){
            name = j[i].nested_mapgen_id
        }
        if(verbose >= 1){tiled.log(`pre-loading map '${name}'`);}
        if(j[i].object.hasOwnProperty(`mapgensize`)){
            height = j[i].object.mapgensize[1]
            width = j[i].object.mapgensize[0]
            tooltiptext = `No preview for map type 'mapgensize'`
        }
        if(j[i].object.hasOwnProperty(`rows`)){
            height = j[i].object.rows.length
            width = j[i].object.rows[0].length
            tooltiptext = JSON.stringify(j[i].object.rows).replace(/,/g,"\n").replace(/[\[\]]/g,"")
        }
        // if(j[i].object.rows.length < 1){continue;}
        let checkboxdisplay = `${name}`.length < 63 ? name : `${name}`.slice(0,60)+"..."
        if(j[i].hasOwnProperty(`nested_mapgen_id`)){
            checkboxdisplay = `[n] ${checkboxdisplay}`
        };
        let checkbox = dialog.addCheckBox(`${checkboxdisplay} (${width}x${height})`,true)
        checkbox.toolTip = tooltiptext

        if(j[i].hasOwnProperty(`om_terrain`)){
            mapEntriesToImport[j[i].om_terrain] = {
                "index" : i,
                "checkbox" : checkbox,
                "entry" : j[i]
            }
        }
        if(j[i].hasOwnProperty(`nested_mapgen_id`)){
            mapEntriesToImport[j[i].nested_mapgen_id] = {
                "index" : i,
                "checkbox" : checkbox,
                "entry" : j[i]
            }
        }
        // mapEntriesToImport.push(entry)
        dialog.addNewRow()
    }
    let backButton = dialog.addButton(`Back`);
    backButton.clicked.connect(function(){
        cte.filePicker(importMapChoiceDialog,filepath)
        dialog.reject();
    })
    
    let acceptButton = dialog.addButton(`Accept`);
    let cancelButton = dialog.addButton(`Cancel`);
    acceptButton.clicked.connect(function(){
        dialog.accept();
    })
    cancelButton.clicked.connect(function(){
        dialog.reject();
    })
    dialog.accepted.connect(()=>{
        let testentries = []
        let chosenEntries = []
        for(let entry in mapEntriesToImport){
            // tiled.log(mapEntriesToImport[entry].checkbox.checked)
            if(mapEntriesToImport[entry].checkbox.checked){
                chosenEntries.push(mapEntriesToImport[entry].entry)
                testentries.push(mapEntriesToImport[entry].index)
            }
        }
        importMap(filepath,chosenEntries)
    })
    dialog.show()
}
function importMap(pathToMap,j){
    // if(!pathToMap){
    //     pathToMap = FileInfo.toNativeSeparators(config.pathToCDDA + "/data/json/mapgen/house/house_detatched1.json")
    // }
    let originalOpenAssets = tiled.openAssets
    config.pathToLastImportMap = pathToMap;
    cte.updateConfig();
    tiled.log(`Importing '${pathToMap}'`)
    //File.makePath(config.pathtoProject+'\\importedtsx')
    
    //read map file
    let f = new TextFile(pathToMap, TextFile.ReadOnly);
    f.codec = "UTF-8"
    let c = f.readAll();
    f.close();
    let old_j = JSON.parse(c);
    let tm;
    let mapwidth = 0
    let mapheight = 0
    for(let i in j){ // find valid entry for size
        let xy;
        let name;
        if (j[i].object.hasOwnProperty("rows")){
            xy = [j[i]['object']['rows'][0].length,j[i]['object']['rows'].length]
        }
        if (j[i].object.hasOwnProperty("mapgensize")){
            xy = j[i].object.mapgensize
        }
        if(j[i].type != "mapgen" || j[i].method != "json"){continue;} // must be mapgen and json
        if(xy[0] > mapwidth){ mapwidth = xy[0]}
        if(xy[1] > mapheight){ mapheight = xy[1]}
        if(j[i].hasOwnProperty("om_terrain")){
            name = j[i].om_terrain
        }
        if(j[i].hasOwnProperty(`nested_mapgen_id`)){
            name = j[i].nested_mapgen_id
        }
        tm = prepareTilemap(name,[mapwidth,mapheight])
        break;
    }

    let layergroups = [];

    for(let i in j){
        if(j[i].type != "mapgen" || j[i].method != "json"){continue;} // must be mapgen and json
        var import_map = j[i];

        var importMapName;
        
        if(j[i].hasOwnProperty("om_terrain")){
            importMapName = j[i].om_terrain
        }
        if(j[i].hasOwnProperty(`nested_mapgen_id`)){
            importMapName = j[i].nested_mapgen_id
        }
        // var importMapSize = import_map.object.rows[0].length;
        let mapArray;
        tiled.log(`Working on map '${importMapName}'`)
        // check if has fill_ter, TODO remove later
        if (import_map.object.hasOwnProperty("fill_ter")){if(verbose>=1){tiled.log(`Has fill_ter: ${import_map.object.fill_ter}`);};}

        if (import_map.object.hasOwnProperty("mapgensize")){
            for(let y; y < import_map.object.mapgensize[1]; y++){
                mapArray.push(" ".repeat(import_map.object.mapgensize[0]))
            }
        }
        if (import_map.object.hasOwnProperty("rows")){
            mapArray = import_map['object']['rows'];
        }

        // init mapPallete
        let mapPalette = buildTilePaletteDict(import_map);

        if(verbose >= 1){
            tiled.log(`Original Map`)
            for (let row of mapArray){
                tiled.log(row)
            }
        }
        function getPalettesJSON(map){
            if(!map.hasOwnProperty("palettes")){return;}
            if(verbose >= 1){tiled.log(`#### importing preset palette cdda ids`);}
            
            let palettePaths = getRecursiveFilePathsInFolder(config.pathToPalettes);
            let tempPaletteDict = {}
            for(let filepath of palettePaths){
                if(verbose >= 2){tiled.log(`checking palette '${filepath}'`);}
                const file = new TextFile(filepath, TextFile.ReadOnly)
                file.codec = "UTF-8"
                const file_data = file.readAll()
                file.close()
                let paletteFileJSON = JSON.parse(file_data)
                for(let palette of paletteFileJSON){
                    if (palette.type != "palette" || !map.palettes.includes(palette.id)){continue;};
                    tempPaletteDict[palette.id] = palette
                }
            }
            return tempPaletteDict
        }

        // make dict of all tiles in use
        let all_tileDict = {}
        // all_tileDict.unknown = {}
        all_tileDict.unknown_tile = {}
        all_tileDict = fillTileDict(import_map.object,all_tileDict)
        let mapPalettes = getPalettesJSON(import_map.object)
        for(let palette in mapPalettes){
            all_tileDict = fillTileDict(mapPalettes[palette],all_tileDict)
        }
        function fillTileDict(map,dict){
            for(let obj in map){
                if(obj == "fill_ter"){dict[obj.fill_ter] = {};}
                if(no_id_objects.includes(obj)){continue;}
                for(let index in map[obj]){
                    // if(!symbols_in_use.includes(index)){continue;}
                    let entry = map[obj][index]
                    if(obj == "parameters"){
                        for(let meta_tiles in map[obj]){
                            dict[meta_tiles] = {}
                        }
                    }

                    if(obj == "terrain"){
                        if(typeof entry === "string"){
                            dict[entry] = {}
                        }
                        if(Array.isArray(entry)){
                            for(let entr of cte.flattenArray(entry)){
                                if(typeof entr == "string"){
                                    dict[entr] = {}
                                }
                            }
                        }
                    }
                    if(obj == "furniture"){
                        if(typeof entry === "string"){
                            dict[entry] = {}
                        }
                        if(Array.isArray(entry)){
                            for(let entr of cte.flattenArray(entry)){
                                if(typeof entr == "string"){
                                    dict[entr] = {}
                                }
                            }
                        }
                    }
                    if(obj == "items"){
                        if(Array.isArray(entry)){
                            for(let entr of entry){
                                dict[entr.item] = {}
                            }
                        } else {
                            dict[entry.item] = {}
                        }
                    }
                    if(obj == "traps"){
                        if(typeof entry === "string"){
                            dict[entry] = {}
                        }
                        if(Array.isArray(entry)){
                            for(let entr of cte.flattenArray(entry)){
                                if(typeof entr == "string"){
                                    dict[entr] = {}
                                }
                            }
                        }
                    }
                    if(obj == "place_loot"){
                        if(entry.hasOwnProperty("item")){
                            dict[entry.item] = {}
                        }
                        if(entry.hasOwnProperty("group")){
                            dict[entry.group] = {}
                        }
                    }
                    if(obj == "monster"){
                        dict[entry.monster] = {}
                    }
                    if(obj == "liquids"){
                        dict[entry.liquid] = {}
                    }
                    if(obj == "vehicles"){
                        dict[entry.vehicle] = {}
                    }
                    if(obj == "place_items"){
                        dict[entry.item] = {}
                    }
                    if(obj == "place_item"){
                        dict[entry.item] = {}
                    }
                    if(obj == "place_zones"){
                        dict[entry.item] = {}
                    }
                    if(obj == "place_fields"){
                        dict[entry.field] = {}
                    }
                    if(obj == "place_monsters"){
                        dict[entry.monster] = {}
                    }
                }
            }
            return dict
        }
        delete all_tileDict.undefined
        if(verbose >= 1){tiled.log(`all cdda_ids: '${Object.keys(all_tileDict)}'`);}


        // get tile locations known for cdda ids in map
        let tsxs = getRecursiveFilePathsInFolder(config.pathToChosenTilesetTSX);
        if(config.hasOwnProperty(`pathToUnknownsTSX`)){tsxs.push(config.pathToUnknownsTSX)} // add custom tsx to the mix
        if(config.hasOwnProperty(`pathToCustomTileset`)){tsxs.push(config.pathToCustomTileset)} // add custom tsx to the mix
        
        for(let filepath of tsxs){
            if (!filepath.match(/\.tsx$/)){continue;};

            let tsxTiles = TSXread(filepath) //  filepath returns { tiles: { id: { class, probabiltiy, properties: { property: value }}}}
            let tilesetname = FileInfo.baseName(filepath);

            for ( let tsxTileID in tsxTiles.tiles ){
                if (!tsxTiles.tiles[tsxTileID].properties["cdda_id"]){continue;}; // continue if no cdda id
                let tile_cdda_id = tsxTiles.tiles[tsxTileID].properties.cdda_id
                if(tile_cdda_id == "unknown_tile"){
                    all_tileDict[tile_cdda_id].id = tsxTileID
                    all_tileDict[tile_cdda_id].filepath = filepath
                    if(verbose >= 1){tiled.log(`adding '${tile_cdda_id}' with id '${all_tileDict[tile_cdda_id].id}'to all_tileDict`)}
                    continue
                }
                if(all_tileDict.hasOwnProperty(tile_cdda_id)){
                    if(all_tileDict[tile_cdda_id].hasOwnProperty("id")){continue;}
                    all_tileDict[tile_cdda_id].id = tsxTileID
                    all_tileDict[tile_cdda_id].filepath = filepath
                    if(verbose >= 1){tiled.log(`adding '${tile_cdda_id}' with id '${all_tileDict[tile_cdda_id].id}'to all_tileDict`)}
                }
            }
        }
        
        // get tile numbers, cdda IDs, and tilset file ??
        let mapArrays = {};


        // get tiles
        let tileset_cache = {};
        for(let cdda_id in all_tileDict){
            if(all_tileDict[cdda_id].filepath === undefined){continue;}
            let tileset;
            if(all_tileDict[cdda_id].hasOwnProperty("tile")){continue;}
            if(!tileset_cache.hasOwnProperty(all_tileDict[cdda_id].filepath)){
                tileset_cache[all_tileDict[cdda_id].filepath] = tiled.open(all_tileDict[cdda_id].filepath)
                if(verbose >= 1){tiled.log(`adding '${all_tileDict[cdda_id].filepath}' to tileset cache`)}
            }
            tileset = tileset_cache[all_tileDict[cdda_id].filepath]
            all_tileDict[cdda_id].tile = tileset.findTile(all_tileDict[cdda_id].id)
            if(verbose >= 1){tiled.log(`cdda id '${cdda_id}' has tile '${all_tileDict[cdda_id].tile}'`)}
        }


        for (let entityLayerType of entityLayerTypes){
            tiled.log(`mapArrays["${entityLayerType}"]`);
            for (let e in mapArrays[entityLayerType]){
                tiled.log(`${mapArrays[entityLayerType][e]}`);
            };
        };

        function prepareEntitiesArrayForTiled(import_map,entityLayerType,all_tileDict){
            if (mapArrays.hasOwnProperty(entityLayerType)){
                let tMapArray = mapArrays[entityLayerType]
                
                for (let entry in mapArrays[entityLayerType]){
                    if(all_tileDict.hasOwnProperty(mapArrays[entityLayerType][entry][2])){
                        if(verbose >= 2){tiled.log(`( ${tMapArray[entry][0]}, ${tMapArray[entry][1]} ) '${mapArrays[entityLayerType][entry][2]}' > '${all_tileDict[mapArrays[entityLayerType][entry][2]]}'`)}
                        tMapArray[entry][2] = all_tileDict[mapArrays[entityLayerType][entry][2]].tile
                    } else {
                        if(verbose){tiled.log(`Entity '${mapArrays[entityLayerType][entry][2]}' not found in tile dictionary`);}
                        continue;
                    }
                }
                return tMapArray
            }
        }
        // prepare map for tiled
        function prepareMapArrayForTiled(import_map,mapLayerName,all_tileDict){
            if (verbose){tiled.log(`working on map layer '${mapLayerName}'`);}
            // if (mapLayerName == "fill_ter"){return;};
            let tMapArray = []
            if (!mapPalette.hasOwnProperty(mapLayerName) && mapLayerName != "fill_ter"){tiled.log(`missing ${mapLayerName}`);return;}
            for (let y in mapArray){
                for (let x in mapArray[y]){
                    let thiscell = mapArray[y][x]
                    let newcell = 0
                    // terrain fill
                    if (mapLayerName == "fill_ter" && import_map.object.hasOwnProperty("fill_ter")){
                            if(all_tileDict.hasOwnProperty(import_map.object.fill_ter)){
                                if (verbose >= 3){tiled.log(`( ${x}, ${y} ) - fill_ter: '${import_map.object.fill_ter}'`);}
                                newcell = all_tileDict[import_map.object.fill_ter].tile
                                tMapArray.push([x,y,newcell])
                                continue;
                            };
                        continue;
                    };
                    // if(thiscell === " "){continue;}
                    if(mapPalette[mapLayerName][thiscell] === undefined){continue;};
                    // items
                    if(mapLayerName == "items" && import_map.object.hasOwnProperty("items")){
                        if (verbose >= 1){tiled.log(`( ${x}, ${y} ) - item: '${mapPalette[mapLayerName][thiscell].item}'`);}
                        let entries = []
                        
                        if(all_tileDict.hasOwnProperty(mapPalette[mapLayerName][thiscell].item)){
                            if (verbose >= 1){tiled.log(`( ${x}, ${y} ) - item: '${mapPalette[mapLayerName][thiscell].item}'`);}
                            newcell = all_tileDict[mapPalette[mapLayerName][thiscell].item].tile
                            tMapArray.push([x,y,newcell])
                            continue;
                        }
                        continue;
                    }

                    if (mapPalette[mapLayerName].hasOwnProperty(thiscell)) {
                        if(typeof mapPalette[mapLayerName][thiscell] === "object"){
                            let entry = mapPalette[mapLayerName][thiscell]
                            for(let e of entry){
                                if(all_tileDict.hasOwnProperty(e)){
                                    if(verbose >= 1){tiled.log(`\t( ${x}, ${y} )\tAssigning ID '${e}' TO SYMBOL '${thiscell}'`);}
                                    newcell = all_tileDict[e].tile
                                    break;
                                }
                            }
                        } else{
                            if(all_tileDict.hasOwnProperty(mapPalette[mapLayerName][thiscell])){
                                if(verbose >= 1){tiled.log(`\t( ${x}, ${y} )\tAssigning ID '${mapPalette[mapLayerName][thiscell]}' TO symbol '${thiscell}' with tile '${all_tileDict[mapPalette[mapLayerName][thiscell]].tile}'`);}
                                newcell = all_tileDict[mapPalette[mapLayerName][thiscell]].tile
                            } else {
                                if(verbose >= 2){tiled.log(`no sprite for ${mapPalette[mapLayerName][thiscell]}`)}
                            }
                        }
                        if(verbose >= 2){tiled.log(`( ${x}, ${y} ) '${thiscell}' > '${mapPalette[mapLayerName][thiscell]}' - '${newcell}'`)}
                        tMapArray.push([x,y,newcell])
                        continue;
                    } else {
                        if(all_tileDict.hasOwnProperty("unknown_tile")){
                            // all_tileDict.unknown_tile.tile = add_cdda_id_to_unknowns(mapPalette[mapLayerName][thiscell])
                            newcell = add_cdda_id_to_unknowns(mapPalette[mapLayerName][thiscell])
                            tMapArray.push([x,y,newcell])
                            continue;
                        }

                    }
                }
            }
            return tMapArray;
        }

        if (import_map.object.hasOwnProperty("fill_ter")){
            mapArrays["fill_ter"] = prepareMapArrayForTiled(import_map,"fill_ter",all_tileDict)
        }
        for (let mapLayerType of mapLayerTypes){
            tiled.log(`preparing map array for layer '${mapLayerType}'`)
            mapArrays[mapLayerType] = prepareMapArrayForTiled(import_map,mapLayerType,all_tileDict)
        }

        for(let layerType in import_map.object){
            if(no_id_objects.concat(mapLayerTypes).some(a => a === layerType)){continue}
            tiled.log(`preparing object array for layer ${layerType}`)
            mapArrays[layerType] = prepareEntitiesArrayForTiled(import_map,layerType,all_tileDict)
        }


        // Prepare tiled layer
        function prepareTiledLayer(import_map,layername,all_tileDict){

            // tile layers
            if(mapLayerTypes.some(a => a === layername) || layername == "fill_ter"){
                let tl = new TileLayer(layername);
                if (import_map.object.hasOwnProperty("mapgensize")){
                    tl.width = import_map.object.mapgensize[0];
                    tl.height = import_map.object.mapgensize[1]
                }
                if (import_map.object.hasOwnProperty("rows")){
                    tl.width = import_map.object.rows[0].length;
                    tl.height = import_map.object.rows.length
                }
                tl.setProperty("cdda_layer", layername)
                let tle = tl.edit()
                tiled.log(`editing layer ${tle.target.name}`)
                if(layername == "fill_ter" && all_tileDict.hasOwnProperty(import_map.object.fill_ter)){
                    // tiled.log(`fill_ter mapentry: '${mapArrays["fill_ter"]}'`)
                    tl.setProperty("cdda_id", import_map.object.fill_ter)
                    for (let entry in mapArrays["fill_ter"]){
                        if(verbose >= 1){tiled.log(`( ${mapArrays["fill_ter"][entry][0]}, ${mapArrays["fill_ter"][entry][1]} ) - ${mapArrays["fill_ter"][entry][2]}`)}
                        tle.setTile(mapArrays["fill_ter"][entry][0],mapArrays["fill_ter"][entry][1],mapArrays["fill_ter"][entry][2])
                    }
                    tle.apply();
                    return tl;
                }

                if(mapLayerTypes.includes(layername)){
                    for (let entry in mapArrays[layername]){
                        if(verbose >= 1){tiled.log(`adding to layer: '${entry}' - ( ${mapArrays[layername][entry][0]}, ${mapArrays[layername][entry][1]} ) - ${mapArrays[layername][entry][2]}`)}
                        tle.setTile(mapArrays[layername][entry][0],mapArrays[layername][entry][1],mapArrays[layername][entry][2])
                    }
                }
                tle.apply();
                return tl;
            }
            // entitiy layers
            if(entityLayerTypes.some(a => a === layername)){
                if(!import_map.object.hasOwnProperty(layername)){
                    if(verbose >= 1){ tiled.log(`layer not present '${layername}'`);}
                    return
                }
                let og = new ObjectGroup(layername)
                if (import_map.object.hasOwnProperty("mapgensize")){
                    og.width = import_map.object.mapgensize[0];
                    og.height = import_map.object.mapgensize[1]
                }
                if (import_map.object.hasOwnProperty("rows")){
                    og.width = import_map.object.rows[0].length;
                    og.height = import_map.object.rows.length;
                }
                og.setProperty("cdda_layer", layername)
                // let oge = og.edit()
                if(verbose >= 1){ tiled.log(`editing layer '${og.name}' - '${layername}'`);}


                for(let entity of import_map.object[layername]){
                    if(verbose >= 1){tiled.log(`entity entry: '${cte.flattenDict(entity)}'`);}
                    let obj = new MapObject()
                    let x = entity.x
                    let y = entity.y
                    let objname; 
                    // obj.tile = mapArrays[layername][entry][2]\

                    for(let property in entity){
                        if(["x","y","monsters","item","vehicle"].includes(property)){
                            continue;
                        }
                        obj.setProperty(property,entity[property])
                    }

                    // if(layername == "items"){objname = entity.item;}
                    if(layername == "place_fields"){objname = entity.field;}
                    if(layername == "place_item"){objname = entity.item;}
                    if(layername == "place_items"){objname = entity.item;}
                    if(layername == "place_vehicles"){objname = entity.vehicle;}
                    if(layername == "place_monsters"){objname = entity.monster;}
                    if(layername == "place_zones"){objname = entity.type;}
                    if(layername == "place_loot"){
                        if(entity.hasOwnProperty("item")){
                            objname = entity.item;
                            obj.setProperty("group",false)
                        }
                        if(entity.hasOwnProperty("group")){
                            objname = entity.group;
                            obj.setProperty("group",true)
                        }
                    }
                    

                    obj.setProperty("cdda_id",objname)
                    obj.name = objname;
                    obj.width = Array.isArray(x) ? (x[1] - x[0]+1)*32 : 32
                    obj.height = Array.isArray(y) ? (y[1] - y[0]+1)*32 : 32
                    obj.x = Array.isArray(x) ? x[0]*32 : x*32
                    obj.y = Array.isArray(y) ? y[0]*32 : y*32
                    if(verbose >= 1){tiled.log(`adding object '${obj.name}' at ( ${obj.x/32}, ${obj.y/32} ) to '${og.name}'`);}
                    // get object tile
                    if(all_tileDict.hasOwnProperty(objname)){
                        if(all_tileDict[objname].hasOwnProperty("tile")){
                            if(verbose >= 1){tiled.log(`tile found for '${objname}'`);}
                            obj.tile = all_tileDict[objname].tile;
                            obj.y += 32
                        }
                    }
                    og.addObject(obj);

                }
                return og;
            }

            // setTile(x: number, y: number, tile: null | Tile, flags?: number): void
        }
        var layergroup = new GroupLayer(importMapName)


        // add palettes to properties layer
        if(import_map.object.hasOwnProperty("palettes")){
            if (Array.isArray(import_map.object.palettes)){
                for(let p in import_map.object.palettes){
                    layergroup.setProperty("cdda_palette_"+p ,import_map.object.palettes[p])
                }
            } else {
                layergroup.setProperty("cdda_palette_0",import_map.object.palettes)
            }
        }
        // add flags to properties layer
        for(let flag of flags){layergroup.setProperty( flag, false); };
        if(import_map.object.hasOwnProperty("flags")){
            if (Array.isArray(import_map.object.flags)){
                for(let p in import_map.object.flags){
                    layergroup.setProperty(import_map.object.flags[p] , true);
                }
            } else {
                layergroup.setProperty(import_map.object.flags, true);
            }
        }
        // add fill_ter to properties layer
        if(import_map.object.hasOwnProperty("fill_ter")){
            layergroup.setProperty("fill_ter", import_map.object.fill_ter,all_tileDict);
        }
        // if (layername == 'fill_ter'){tl.locked = true;}

        if (import_map.object.hasOwnProperty("fill_ter")){
            layergroup.addLayer(prepareTiledLayer(import_map,"fill_ter",all_tileDict));
        };
        for (let mapLayerType of mapLayerTypes){
            // if(import_map.object.hasOwnProperty(mapLayerType)){
                let layer = prepareTiledLayer(import_map,mapLayerType,all_tileDict)
                if(layer != undefined){
                    layergroup.addLayer(layer)
                }
            // }
        }
        for (let entityLayerType of entityLayerTypes){
            if(import_map.object.hasOwnProperty(entityLayerType)){
                let layer = prepareTiledLayer(import_map,entityLayerType,all_tileDict)
                if(layer != undefined){
                    layergroup.addLayer(layer)
                }
            }
        }
        layergroups.push(layergroup)
    }
    for (let lg in layergroups.reverse()){
        tm.addLayer(layergroups[lg]);
    }
    tm.setProperty("import_tileset",config.chosenTileset)
    
    let pathToTMX = config.pathToTMX +"/"+ FileInfo.baseName(pathToMap) +".tmx"
    for(let openAsset of tiled.openAssets){
        if(originalOpenAssets.includes(openAsset)){continue;}
        if(openAsset == tm){continue;}
        tiled.close(openAsset)
    }
    tiled.activeAsset = tm
    if(config.snaptogrid){tiled.trigger("SnapToGrid")}
    // let outputFileResults = tiled.mapFormat("tmx").write(tm, pathToTMX);
    // let outputFileResults = writeToFile(pathToTMX,tm);
    // (outputFileResults == null) ? tiled.log(FileInfo.baseName(pathToMap) + " file created successfully.") : tiled.log(FileInfo.baseName(pathToMap) + " - FAILED to create file. Error: " + outputFileResults)
    // tiled.open(pathToTMX);
}
function addNewOmTerrainToMap(){
    return tiled.activeAsset.isTileMap ? tiled.activeAsset.addLayer(makeNewOmTerrain([tiled.activeAsset.width,tiled.activeAsset.height])) : tiled.log(`No tilemap found to add layer.`)
}
function makeNewOmTerrain(width,height){
    width = parseInt(width,10)
    height = parseInt(height,10)
    let layergroup = new GroupLayer("My_om_terrain")
    for(let prop of ["cdda_palette_0","fill_ter"]){
        layergroup.setProperty(prop, "")
    }
    for(let flag of flags){
        layergroup.setProperty(flag, false)
    }
    for(let layertype of mapLayerTypes){
        let layer = new TileLayer(layertype)
        layer.setProperty("cdda_layer",layertype)
        layer.width = width
        layer.height = height
        layergroup.addLayer(layer)
    }
    for(let layertype of entityLayerTypes){
        let layer = new ObjectGroup(layertype)
        layer.setProperty("cdda_layer",layertype)
        layer.width = width
        layer.height = height
        layergroup.addLayer(layer)
    }
    return layergroup
}
function makeEmptyMap(){
    let mapsize = tiled.prompt("Map is square. Length of side in tiles:",24,"Map Size")
    let tmname = `CDDA_map_${mapsize}x${mapsize}`
    let tm = prepareTilemap(tmname,[mapsize,mapsize]);

    tm.addLayer(makeNewOmTerrain([mapsize,mapsize]))


    let filepath = FileInfo.toNativeSeparators(config.pathToTMX+"/"+tmname+".tmx")
        // return tiled.mapFormat(format[1]).write(data, filepath);
    let outputFileResults = tiled.mapFormat("tmx").write(tm, filepath);
    (outputFileResults == null) ? tiled.log(FileInfo.baseName(filepath) + " file created successfully.") : tiled.log(FileInfo.baseName(filepath) + " - FAILED to create file. Error: " + outputFileResults)
    tiled.open(filepath);
    if(config.snaptogrid){tiled.trigger("SnapToGrid")}
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
            if(verbose >= 1){tiled.log(`'${layer.name}' has palettes.`);};
            for(let p of Object.keys(layer.properties())){
                if(p.match(/palette/)){
                    if(verbose >= 1){tiled.log(`'${layer.name}' has palette '${layer.properties()[p]}'`);};
                    mapEntry.object.palettes.push(layer.properties()[p]);
                };
            };
        };
        // fill_ter
        if(Object.keys(layer.properties()).includes("fill_ter")){
            mapEntry.object.fill_ter = layer.property("fill_ter")
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

        let assigned_symbols = []; // array of used symbols

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
            if(verbose >= 1){tiled.log(`working on layer '${sublayer.property("cdda_layer")}'`)}
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
            if(!sublayer.isTileLayer){
                for(let obj of sublayer.objects){
                    let json_entry = {};
                    let cdda_id_name;
                    // if(sublayer.property("cdda_layer") == "items"){
                    //     if(obj.resolvedProperties().hasOwnProperty("cdda_id")){cdda_id_name = "item";}
                    // }
                    if(sublayer.property("cdda_layer") == "place_item"){
                        if(obj.resolvedProperties().hasOwnProperty("cdda_id")){cdda_id_name = "item";}
                    }
                    if(sublayer.property("cdda_layer") == "place_items"){
                        if(obj.resolvedProperties().hasOwnProperty("cdda_id")){cdda_id_name = "item";}
                    }
                    if(sublayer.property("cdda_layer") == "place_vehicles"){
                        if(obj.resolvedProperties().hasOwnProperty("cdda_id")){cdda_id_name = "vehicle";}
                    }
                    if(sublayer.property("cdda_layer") == "place_monsters"){
                        if(obj.resolvedProperties().hasOwnProperty("cdda_id")){cdda_id_name = "monster";}
                    }
                    if(sublayer.property("cdda_layer") == "place_fields"){
                        if(obj.resolvedProperties().hasOwnProperty("cdda_id")){cdda_id_name = "field";}
                    }
                    if(sublayer.property("cdda_layer") == "place_zones"){
                        if(obj.resolvedProperties().hasOwnProperty("cdda_id")){cdda_id_name = "type";}
                    }
                    if(sublayer.property("cdda_layer") == "place_loot"){
                        if(obj.resolvedProperties().hasOwnProperty("group")){
                            obj.resolvedProperties().group ? cdda_id_name = "group" : cdda_id_name = "item"
                        }
                    }
                    json_entry[cdda_id_name] = obj.resolvedProperties()["cdda_id"]
                    for(let prop of Object.keys(obj.resolvedProperties())){
                        if(["cdda_id","group"].includes(prop) || obj.resolvedProperties()[prop] == ""){continue;}
                        json_entry[prop] = obj.resolvedProperties()[prop]
                    }
                    json_entry.x = obj.width > 32 ? [Math.floor(obj.x/32),Math.floor((obj.x+obj.width)/32)] : Math.floor(obj.x/32)
                    json_entry.y = obj.height > 32 ? [Math.floor(obj.y/32),(Math.floor(obj.y+obj.height)/32)] : Math.floor(obj.y/32)
                    if(obj.hasOwnProperty("tile")){ // offset objects containing tiles because of 
                        if(obj.tile != null){
                            json_entry.y = obj.height > 32 ? [Math.floor((obj.y/32))-1,Math.floor(((obj.y+obj.height)/32))-1] : Math.floor((obj.y/32))-1
                        }
                    }
                    if(!mapEntry.object.hasOwnProperty(sublayer.property("cdda_layer"))){
                        mapEntry.object[sublayer.property("cdda_layer")] = []
                    }
                    mapEntry.object[sublayer.property("cdda_layer")].push(json_entry)
                }
            }
        }
        
        for(let symbol in combined_symbols_dict){ // get palette symbols for exclusion
            if(!assigned_symbols.includes(symbol)){assigned_symbols.push(symbol);}
        }

        if(verbose >= 1){
            tiled.log(`coordinate assignemnts:`);
            for (let ca in coordinate_assignments){
                tiled.log(`${ca} > ${cte.flattenDict(coordinate_assignments[ca])} (${Object.keys(coordinate_assignments[ca]).length})`);
            }
        }
        if(verbose >= 1){
            tiled.log(`combined symbols assignemnts:`)
            for (let s in combined_symbols_dict){
                tiled.log(`${s} > ${combined_symbols_dict[s]} (${combined_symbols_dict[s].length})`)
            }
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
                    cte.flattenDict(coordinate_assignments[coordinate]).every(r => cte.flattenArray(combined_symbols_dict[possible_symbol]).includes(r))
                    ){
                    if(verbose >= 1){tiled.log(`[${x},${y}] palette assign '${possible_symbol}' > '${cte.flattenDict(coordinate_assignments[coordinate])}'`);}
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
                    cte.flattenDict(coordinate_assignments[coordinate]).every(r => cte.flattenDict(custom_symbols_dict[symbol]).includes(r))
                ){
                    if(verbose >= 1){tiled.log(`[${x}, ${y}] - previously assigned '${symbol}' > '${cte.flattenDict(coordinate_assignments[coordinate])}'`);}
                    layer_map_array[y] = layer_map_array[y].slice(0,x)+symbol+layer_map_array[y].slice(x+1)
                    
                    continue coordinate_entry_loop;
            }
            }
            // newly defined symbol
            let symbolstouse = ""
            let cdda_ids_in_tile = cte.flattenDict(coordinate_assignments[coordinate])
            let symbol_group_to_use = `pretty`
            if(!use_pretty_symbols){
                symbol_group_to_use = `us_keyboard`
            }
            for(let searchTerm in utf_ramps[symbol_group_to_use]){
                let re = new RegExp(`(${searchTerm})`)
                if(cdda_ids_in_tile.join("").match(re)){
                    symbolstouse = utf_ramps[symbol_group_to_use][searchTerm]
                }
            }
            symbolstouse += utf_ramps.utf8_shortlist
            for(let symbol of symbolstouse){
                if(assigned_symbols.includes(symbol)){continue;} else { assigned_symbols.push(symbol);}
                if(verbose >= 1){tiled.log(`( ${x}, ${y} ) - newly assigned '${symbol}' > '${cte.flattenDict(coordinate_assignments[coordinate])}'`);}
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
        if(verbose >= 1){
            tiled.log("complete symbol map")
            for (let y = 0; y < layer_map_array.length; y++){
                tiled.log(layer_map_array[y])
                for (let x = 0; x < layer_map_array[y].length; x++){
                };
            };
        }
        mapEntry.object.rows = layer_map_array

        if(verbose >= 1){
            tiled.log("assigned symbols = "+assigned_symbols)
        };
        for (let d in mapEntry.object){ // cleanup empty 'objects'
            if (mapEntry.object[d].length === 0){ delete mapEntry.object[d]; };
        };
        return mapEntry;
    }
    for (let layer of currentMap_tm.layers){
        mapEntries.push(prepareEntry(layer))
    }
    
    // delete unused fields from map entry
    // tiled.log(mapEntries[0].object.rows[4])
    tiled.log(`Map export complete`)
    return mapEntries.reverse();
}

function TSXread(filepath){ // { tiles: { id: { properties: { property: value }}}}
    const file = new TextFile(filepath, TextFile.ReadOnly)
    file.codec = "UTF-8"
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
    let lastsearch;
    config.hasOwnProperty("last_search_cdda_id") ? lastsearch = config.last_search_cdda_id : lastsearch = "t_floor"
    let cdda_id_tofind = tiled.prompt(`Find tile with corresponding CDDA ID:`,lastsearch,"Find Tile by CDDA ID").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g,"")
    if(cdda_id_tofind == ""){return;}
    config.last_search_cdda_id = cdda_id_tofind
    cte.updateConfig();
    tiled.log(`Searching for '${cdda_id_tofind}'.`)
    let asset = tiled.activeAsset

    let matching_tiles = getMatchingTiles(cdda_id_tofind,asset);
    // let sorted = cte.getSortedKeys(matching_tiles)
    if(Object.keys(matching_tiles).length === 0){
        return tiled.log(`No matches found for '${cdda_id_tofind}'.`)
    }
    if(Object.keys(matching_tiles).length === 1){
        if(verbose >= 1){tiled.log(`'${cdda_id_tofind}' - found in '${Object.keys(matching_tiles).length}' match.`);}
        cte.goToTile(matching_tiles[Object.keys(matching_tiles)[0]].id,matching_tiles[Object.keys(matching_tiles)[0]].filepath)
    }
    if(Object.keys(matching_tiles).length > 1){
        if(verbose >= 1){tiled.log(`'${cdda_id_tofind}' - found in '${Object.keys(matching_tiles).length}' matches.`);}
        selectionDialog(cdda_id_tofind,matching_tiles,asset)
    }



    // tiled.log(`matches ${Object.keys(matching_tiles)} - found '${Object.keys(matching_tiles).length}' matches`)
    
    function selectionDialog(cdda_id_tofind,matching_tiles,asset){
        // let asset = tiled.activeAsset
        let sorted = cte.getSortedKeys(matching_tiles)
        let dialog = new Dialog()
        dialog.windowTitle = `Matches for '${cdda_id_tofind}'`
        let selection = dialog.addComboBox(`Select match:`,sorted)
        let doneButton = dialog.addButton(`select tile`)
        doneButton.clicked.connect(function(){
            let selected_cdda_id_tofind = sorted[selection.currentIndex]
            cte.goToTile(matching_tiles[selected_cdda_id_tofind].id,matching_tiles[selected_cdda_id_tofind].filepath)
            dialog.accept()
        })
        dialog.show()

    }

    function getMatchingTiles(cdda_id_tofind,asset){
        let tsxs = cte.getFilesInPath(config.pathToChosenTilesetTSX)
        let matching_tiles = {}
        for(let filename of tsxs){
            if (!filename.match(/\.tsx$/)){
                continue
            }
            let filepath = FileInfo.toNativeSeparators(config.pathToChosenTilesetTSX+ "/" +filename)
            if(verbose >= 2){tiled.log(`${filepath}`);}
            let tsxData = TSXread(filepath);
            for ( let tileid in tsxData.tiles ){
                if( tsxData.tiles[tileid].hasOwnProperty("properties")){
                    for ( let property in tsxData.tiles[tileid].properties ){
                        if( verbose >= 3){tiled.log(`checking '${property}' : '${tsxData.tiles[tileid].properties[property]}' for '${cdda_id_tofind}' in id '${tileid}'`);}
                        if(tsxData.tiles[tileid].properties[property].includes(cdda_id_tofind)){
                            if(verbose >= 2){tiled.log(`'${tsxData.tiles[tileid].properties[property]}' found. '${tileid}' in '${filename}'`);}
                            matching_tiles[tsxData.tiles[tileid].properties[property]] = {
                                "id" : tileid,
                                "filepath" : filepath
                            }
                        }
                    }
                }
            }
        }
        return matching_tiles;
    }
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
            "place_zones": entry['object']["place_zones"],
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
            "place_zones": [],
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
        this.snaptogrid = true;
};
};
var CDDAMapFormat = {
    name: "CDDA map format",
    extension: "json",

    write: function(map, fileName) {
        var m = exportMap(map);

        var file = new TextFile(fileName, TextFile.WriteOnly);
        let text = JSON.stringify(m, null, `\t`);
        text = cte.replaceNewlines(text)
        // text = text.replace(/\n/gm, r => "")
        file.write(text);
        file.codec = "UTF-8";
        file.commit();
    }
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
// Add new om_terrain layergroup
const action_newCDDAGroupLayer = tiled.registerAction("CustomAction_newCDDAGroupLayer", function(action_newCDDAGroupLayer) {
    tiled.log(`${action_newCDDAGroupLayer.text} was run.`)
    initialize() ? addNewOmTerrainToMap() : tiled.log(`Failed to initialize.`)
});
//Import CDDA Map
const action_importMap = tiled.registerAction("CustomAction_importMap", function(action_importMap) {
    tiled.log(`${action_importMap.text} was run.`)
    initialize()
    if(config.pathToLastImportMap == undefined){config.pathToLastImportMap = FileInfo.toNativeSeparators(config.pathToCDDA + "/data/json/mapgen/house/house_detatched1.json")}
    // cte.filePicker(importMap,config.pathToLastImportMap)
    cte.filePicker(importMapChoiceDialog,config.pathToLastImportMap)
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
    changeProjectPath()
});
//test action for debug
const action_cdda_debug = tiled.registerAction("CustomAction_cdda_debug", function(action_cdda_debug) {
    tiled.log(`${action_cdda_debug.text} was run.`)
    // tiled.log(tiled.actions)
    // tiled.trigger("CustomAction_CDDA_add_sprite_to_favotires")
    initialize()
    let filepath = config.pathToTMX
    // let dialog = new Dialog()
    filepath = cte.filePicker(importMapChoiceDialog,filepath)
    // filepath = filePicker(filepath)
    // cte.filePicker(filepath);
    // dialog.show();
    tiled.log(`!!!!!end file: ${filepath}`)
    // findTileInTilesets(cdda_id_tofind)
});
// toggle verbose mode
const action_cdda_verbose = tiled.registerAction("CustomAction_cdda_verbose", function(action_cdda_verbose) {
    tiled.log(action_cdda_verbose.text + " was " + (action_cdda_verbose.checked ? "checked" : "unchecked"))
    action_cdda_verbose.checked ? verbose = true : verbose = false
});
// toggle unicode character usage
const action_cdda_unicode_set_toggle = tiled.registerAction("CustomAction_cdda_unicode_set_toggle", function(action_cdda_unicode_set_toggle) {
    tiled.log(action_cdda_unicode_set_toggle.text + " was " + (action_cdda_unicode_set_toggle.checked ? "checked" : "unchecked"))
    action_cdda_unicode_set_toggle.checked ? use_pretty_symbols = true : use_pretty_symbols = false
});

action_importTileset.text = "Import CDDA tileset"
action_createNewMap.text = "Create new CDDA map"
action_newCDDAGroupLayer.text = "Add new om_terrain to map"
action_importMap.text = "Import CDDA map"
action_exportMap.text = "Export to CDDA map"
action_findTileInTilemap.text = "Find CDDA Tile"
action_findTileInTilemap.shortcut = "CTRL+F"
action_add_sprite_to_favotires.text = "Add Sprite to Favorites"
action_add_sprite_to_favotires.shortcut = "CTRL+SHIFT+F"
action_changeProjectPath.text = "Change project path"
action_cdda_verbose.text = "Verbose Logging (slower performance)"
action_cdda_verbose.checkable = true
action_cdda_unicode_set_toggle.text = "Pretty symbols for map export"
action_cdda_unicode_set_toggle.checkable = true
action_cdda_unicode_set_toggle.checked = true

action_cdda_debug.text = "run associated debug action"
action_cdda_debug.shortcut = "CTRL+D"

//tiled.log(tiled.menus)
tiled.registerMapFormat("CDDAmap", CDDAMapFormat)
tiled.extendMenu("File", [
    { separator: true },
    { action: "CustomAction_importTileset", before: "Close" },
    { action: "CustomAction_importMap", before: "Close" },
    { action: "CustomAction_createNewMap", before: "Close" },
    { action: "CustomAction_changeProjectPath", before: "Close" },
    { separator: true }
]);
tiled.extendMenu("Map", [
    { separator: true },
    { action: "CustomAction_newCDDAGroupLayer", after: "Terrain Sets" },
    { action: "CustomAction_cdda_unicode_set_toggle", after: "Terrain Sets" },
    { separator: true }
]);
tiled.extendMenu("Edit", [
    { separator: true },
    { action: "CustomAction_CDDA_map_findTileInTileset", before: "Cut" },
    { action: "CustomAction_CDDA_add_sprite_to_favotires", before: "Cut" },
    { separator: true }
]);
tiled.extendMenu("Help", [
    { separator: true },
    { action: "CustomAction_cdda_verbose", after: "Terrain Sets" },
    { action: "CustomAction_cdda_debug", after: "Terrain Sets" },
    { separator: true }
]);


//-----------------------------------
const watchForStateChange = function (widget, stateKey, state) {

    if (widget.valueChanged) {
        widget.valueChanged.connect((newValue) => {
            tiled.log(`The new ${stateKey} value is ${newValue}`);
            state[stateKey] = widget.value;
        });
    }
    if (widget.colorChanged) {
        widget.colorChanged.connect((newValue) => {
            tiled.log(`The new ${stateKey} color is ${newValue}`);
            state[stateKey] = newValue;
        });
    }
    if (widget.textChanged) {
        widget.textChanged.connect((newValue) => {
            tiled.log(`The new ${stateKey} text is ${newValue}`);
            state[stateKey] = newValue;
        });
    }
    if (widget.currentTextChanged) {
        widget.currentTextChanged.connect((newValue) => {
            tiled.log(`The new ${stateKey} text is ${newValue}`);
            state[stateKey] = newValue;
        });
    }


    if (widget.stateChanged) {
        widget.stateChanged.connect((newValue) => {
            tiled.log(`The new ${stateKey} value is ${newValue}`);
            state[stateKey] = newValue;
        });
    }
};

// https://github.com/dogboydog/tiled-dialog-scripts/blob/main/SelectFile.mjs
var SelectFileDialog = {};
// import {DialogUtils} from 'DialogUtils.mjs';
SelectFileDialog.testPromptAction = tiled.registerAction("SelectFileDialog", function (action) {

    var dialog = new Dialog();
    dialog.addHeading("Select your file please.", true);
    var filePicker1 = dialog.addFilePicker("Your file: ");
    filePicker1.fileUrlChanged.connect((newUrl) => {
        tiled.log(`The new file is ${filePicker1.fileUrl}`);
    });
    var secondDialog;
    var submitButton = dialog.addButton("Submit");
    submitButton.clicked.connect(() => {
        if (!secondDialog) {
            var fileSchemeReplace = tiled.platform == "windows" ? "file:///" : "file://";
            var fileUrl = filePicker1.fileUrl.toString().replace(fileSchemeReplace, "");
            var text = '';
            secondDialog = new Dialog();
            secondDialog.addLabel("File Contents (Excerpt)");
            secondDialog.addSeparator();

            try {
                var textFile = new TextFile(fileUrl, TextFile.ReadOnly);
                text = textFile.readAll();
                // take an excerpt of the file contents to display
                text = text.substring(0, Math.min(text.length, 255));
                textFile.close();
            }
            catch (e) {
                text = `Couldn't read your file ${fileUrl}:\n${e.message}`;
            }
            secondDialog.finished.connect(() => {
                secondDialog = undefined;
            });
            secondDialog.addHeading(text, true);
            secondDialog.show();
        } else {
            tiled.log("Second dialog already open.")
        }
    });

    dialog.finished.connect(() => {
        if (secondDialog) {
            secondDialog.accept();
        }
    });
    dialog.show();
});
SelectFileDialog.testPromptAction.text = "Select File Dialog";

tiled.extendMenu("Edit", [
    { action: "SelectFileDialog", before: "SelectAll" },
    { separator: true }
]);
