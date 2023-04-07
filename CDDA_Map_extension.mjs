/// <reference types="@mapeditor/tiled-api" />import_map
//ChibiUltica
//0x400 | 0x2000 | 0x4000 qdir filter for dir no dot and dotdot
//0x002 | 0x2000 | 0x4000 qdir filter for file no dot and dotdot
//JSON.stringify(m, null, 2) sringify with formatting
if(tiled.versionLessThan(`1.9.91`)){
    tiled.log(`WARNING: version less than 1.9.91`)
}
var verbose = false
var use_pretty_symbols = false

const pathToExtras = `${tiled.extensionsPath}/cdda_map_extension_extras`
const configfilename = "cdda_tiled_extension_config.json";

const mapLayerTypes = ["terrain", "furniture", "traps", "vehicles"] // , "items"
const entityLayerTypes = ["place_items", "place_item", "place_loot", "place_monsters", "place_vehicles", "place_fields", "place_zones"]
const flags = ["ERASE_ALL_BEFORE_PLACING_TERRAIN", "ALLOW_TERRAIN_UNDER_OTHER_DATA", "NO_UNDERLYING_ROTATE", "AVOID_CREATURES"]
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
    "pretty": {
        "t_soil": `░`,
        "wall": `▓▒░$@B%&WM#/|(){}[]!I`,
        "fence": `‡ǂ#H`,
        "door": `D`,
        "window": `o◦`,
        "pavement": `'^,:;_-+`,
        "sidewalk": `'^,:;_-+`,
        "floor": `'^,:;_-+`,
        "_up": `<Λ↑⇑⇡⇧`,
        "_down": `>V↓⇓⇣⇩`,
        "ladder": `ʭΞ`,
        "water": `~≈w`,
        "box": `□▫⬞`,
        "sandbag": `⬝▪■`,
        "trap": `♣♠♦*ϗ`,
        "telep": `◌●◙`,
        "table": `πΠ`,
        "chair": `h`,
        "others": `⧫ᒤᒦᒌᕈҐᖗᖙᖘᖚ⅄♪♫ʬ♥♣♠♦`
    }
}
const no_id_objects = ["rows", "palettes", "fill_ter", "//", "id", "type"]

// let checkmarkImage = new Image();
// checkmarkImage.loadFromData(Base64.decode("PHN2ZyB3aWR0aD0iMTkuMjEzMTUiIGhlaWdodD0iMTguMjk0OTk0IiB2ZXJzaW9uPSIxLjAiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xOTIuOTA1LC01MTYuMDIwNjQpIj48cGF0aCBzdHlsZT0iZmlsbDojMDBmZjAwIiBkPSJNIDE5Ny42Nzk2OCw1MzQuMzE1NjMgQyAxOTcuNDA0NjgsNTM0LjMxMjA4IDE5Ni4yMTc4OCw1MzIuNTM3MTkgMTk1LjA0MjM0LDUzMC4zNzE0MyBMIDE5Mi45MDUsNTI2LjQzMzY4IEwgMTkzLjQ1OTAxLDUyNS44Nzk2OCBDIDE5My43NjM3MSw1MjUuNTc0OTcgMTk0LjU4MjY5LDUyNS4zMjU2NyAxOTUuMjc4OTYsNTI1LjMyNTY3IEwgMTk2LjU0NDksNTI1LjMyNTY3IEwgMTk3LjE4MTI5LDUyNy4zMzA3NiBMIDE5Ny44MTc2OCw1MjkuMzM1ODQgTCAyMDIuODgyMTUsNTIzLjc5NDUxIEMgMjA1LjY2NzYxLDUyMC43NDY3OCAyMDguODg1MjIsNTE3Ljc1MDg1IDIxMC4wMzIzOSw1MTcuMTM2OTEgTCAyMTIuMTE4MTUsNTE2LjAyMDY0IEwgMjA3LjkwODcxLDUyMC44MDI4MiBDIDIwNS41OTM1MSw1MjMuNDMzMDIgMjAyLjQ1NzM1LDUyNy41NTA4NSAyMDAuOTM5NDcsNTI5Ljk1MzU1IEMgMTk5LjQyMTU5LDUzMi4zNTYyNSAxOTcuOTU0NjgsNTM0LjMxOTE5IDE5Ny42Nzk2OCw1MzQuMzE1NjMgeiIvPjwvZz48L3N2Zz4="), "svg");
// let checkMark = dialog.addImage('', checkmarkImage);



var skipOverwrite = true;
var overwriteExisting = true;
var config = {};
var imageCache = {};
var cache = {};

const cte = { // helper functions
    adjustTSJ: (filepath) => {
        let json = JSONread(filepath);
        json.tileheight = 32
        json.tilewidth = 32
        var update_json = new TextFile(filepath, TextFile.WriteOnly);
        update_json.write(JSON.stringify(json, null, 2));
        update_json.commit();
    },
    replaceNewlines: function replaceNewlines(str) {
        // Use the regular expression to find objects with 4 or fewer entries
        var regex = /\[\n(?:.*?,(\n)){0,4}(?:.*?(\n)).*?],?/gm;
        var matches = str.match(regex);
        // Replace newlines in each match with spaces
        if (matches) {
            matches.forEach((match) => {
                str = str.replace(match, match.replace(/\n\t*/g, " ")).trim();
            });
        }
        // Use the regular expression to find objects with 4 or fewer entries
        regex = /\{\n(?:.*?,(\n)){0,4}(?:.*?(\n)).*?},?/gm;
        matches = str.match(regex);
        // Replace newlines in each match with spaces
        if (matches) {
            matches.forEach((match) => {
                str = str.replace(match, match.replace(/\n\t*/g, " ")).trim();
            });
        }

        // Return the updated string
        return str;
    },
    folderPicker: (filepath, title) => {
        let dialog = new Dialog();
        title ? dialog.windowTitle = title : dialog.windowTitle;
        dialog.addLabel(`Select any file within the desired folder.`)
        dialog.addNewRow()
        let cont = false;
        // if(dialog===undefined){dialog = new Dialog();}
        filepath === undefined ? filepath = FileInfo.fromNativeSeparators(FileInfo.path(tiled.projectFilePath)) : filepath = FileInfo.fromNativeSeparators(filepath);
        let newFilepath;
        let fileEdit = dialog.addFilePicker();
        dialog.addNewRow();
        fileEdit.fileUrl = filepath;
        let acceptButton = dialog.addButton(`Accept`);
        let cancelButton = dialog.addButton(`Cancel`);
        fileEdit.fileUrlChanged.connect(() => {
            fileEdit.fileUrl = FileInfo.path(fileEdit.fileUrl)
        })
        acceptButton.clicked.connect(function () {
            dialog.accept();
        });
        cancelButton.clicked.connect(function () {
            dialog.reject();
        });
        dialog.accepted.connect(() => {
            if (tiled.platform === "windows") {
                newFilepath = fileEdit.fileUrl.toString().replace(/^file\:\/\/\//, "");
            } else {
                newFilepath = fileEdit.fileUrl.toString().replace(/^file\:\//, "");
            }
            cont = true;
        });
        if(verbose){tiled.log(newFilepath)}
        dialog.show();
        dialog.exec();
        return cont ? newFilepath : false;
    },
    filePicker: (filepath, title) => {
        let dialog = new Dialog();
        title ? dialog.windowTitle = title : dialog.windowTitle;
        let cont = false;
        filepath === undefined ? filepath = FileInfo.fromNativeSeparators(FileInfo.path(tiled.projectFilePath)) : filepath = FileInfo.fromNativeSeparators(filepath);
        let newFilepath;
        let fileEdit = dialog.addFilePicker();
        dialog.addNewRow();
        fileEdit.fileUrl = filepath;
        let acceptButton = dialog.addButton(`Accept`);
        let cancelButton = dialog.addButton(`Cancel`);
        acceptButton.clicked.connect(function () {
            dialog.accept();
        });
        cancelButton.clicked.connect(function () {
            dialog.reject();
        });
        dialog.accepted.connect(() => {
            if (tiled.platform === "windows") {
                newFilepath = fileEdit.fileUrl.toString().replace(/^file\:\/\/\//, "");
            } else {
                newFilepath = fileEdit.fileUrl.toString().replace(/^file\:\//, "");
            }
            cont = true;
        });
        dialog.show();
        dialog.exec();
        return cont ? newFilepath : false;
    },
    getTileXY: function getTileXY(tile) {
        let tileset = tile.asset;
        if (tileset.isCollection) { return [[0, tile.width], 0, tile.height]; }
        let x = [parseInt(((tile.id * tileset.tileWidth) % tileset.imageWidth), 10), parseInt((tile.id * tileset.tileWidth) % tileset.imageWidth + tileset.tileWidth, 10)]
        let y = [parseInt(Math.floor((tile.id * tileset.tileWidth) / tileset.imageWidth) * tileset.tileHeight, 10), parseInt(Math.floor((tile.id * tileset.tileWidth) / tileset.imageWidth) * tileset.tileHeight + tileset.tileHeight, 10)]
        tileset = undefined;
        return [x, y];
    },
    cropImage: function cropImage(image, importX, importY) {
        if (!imageCache.hasOwnProperty(image)) {
            imageCache[image] = new Image(image);
        }
        // let originalImage = new Image(image);
        let croppedImage = new Image(importX[1] - importX[0], importY[1] - importY[0]);
        if (verbose >= 2) { tiled.log(`'${originalImage}, ${croppedImage}'`); }
        if (verbose >= 2) { tiled.log(`'${importX}, ${importY}'`); }
        for (let py = importY[0]; py < importY[1]; py++) {
            let y = py - importY[0];
            for (let px = importX[0]; px < importX[1]; px++) {
                let x = px - importX[0];
                if (verbose >= 2) { tiled.log(`'${x},${y}'`); }
                if (verbose >= 4) { tiled.log(`'${imageCache[image].pixel(px, py)}'`); }
                // if(verbose >= 1){tiled.log(`'${px}, ${py}'`);}
                croppedImage.setPixel(x, y, imageCache[image].pixel(px, py))
            };
        };
        // originalImage = undefined;
        return croppedImage;
    },
    getSortedKeys: function getSortedKeys(dict) {
        var sorted = [];
        for (var key in dict) {
            sorted[sorted.length] = key;
        }
        return sorted.sort((a, b) => a.length - b.length);
    },
    goToTile: function goToTile(id, filepath) {
        let asset = ""
        if (tiled.activeAsset.isTileMap) {
            let map = tiled.activeAsset
            for (let tileset of tiled.activeAsset.tilesets.concat(tiled.openAssets)) {
                if (tileset.fileName == FileInfo.fromNativeSeparators(filepath)) {
                    asset = tileset
                    break
                }
            }
            if (asset === "") {
                let mapasset = tiled.activeAsset
                let mappath = tiled.activeAsset.fileName
                asset = tiled.open(filepath)
                let map = tiled.open(mappath)
                tiled.mapEditor.currentBrush.addTileset(asset)
            }
            tiled.mapEditor.tilesetsView.currentTileset = asset
            tiled.mapEditor.tilesetsView.selectedTiles = [asset.findTile(id)]
        } else {
            asset = tiled.open(filepath)
            asset.selectedTiles = [asset.findTile(id)]
        }
    },
    load_config: () => {
        let loaded_config;
        var pathToConfig = `${FileInfo.path(tiled.projectFilePath)}/${configfilename}`
        if(File.exists(pathToConfig)){
            config = JSONread(pathToConfig)
        } else {
            config = {
                chosen_tileset: `ChibiUltica`,
                snaptogrid: true
            } // new extensionConfig(FileInfo.path(tiled.projectFilePath));
        }
        add_config_properties()
        // for(let key in loaded_config){
        //     config[key] = loaded_config[key]
        //     tiled.log(`'${key} (${typeof key})': '${config[key]} (${typeof config[key]})'`)
        //     // config[`set_${key}`] = loaded_config[key]
        // }
        // tiled.log(config.path_to_cdda_palettes)
    },
    updateConfig: function updateConfig() {
        var pathToConfig = `${FileInfo.path(tiled.projectFilePath)}/${configfilename}`
        var configfile = new TextFile(pathToConfig, TextFile.WriteOnly);
        for(let key in config){
            if(key.match(/(?:\"get|\"set)/)){delete config[key]()}
        }
        configfile.write(JSON.stringify(config, null, 2));
        configfile.commit();
    },
    getFilesInPath: function getFilesInPath(path) { return File.directoryEntries(path, 0x002 | 0x2000 | 0x4000); },
    getFoldersInPath: function getFoldersInPath(path) { return File.directoryEntries(path, 0x400 | 0x2000 | 0x4000); },
    flattenDict: function flattenDict(dict, result) {
        if (typeof result === "undefined") {
            result = [];
        }
        for (let i in dict) {
            if ((dict[i].constructor == Object)) {
                cte.flattenDict(dict[i], result);
            } else {
                if (Array.isArray(dict[i])) {
                    let flat = cte.flattenArray(dict[i])
                    for (var a = 0; a < flat.length; a++) {
                        result.push(flat[a]);
                    }
                }
            }
        }
        return result;
    },
    /**
     * 
     * @param {object} dict - a dictionary with nested objects
     * @returns {array} - a flat array of all the values in the dictionary
     */
    flattenDictKeys: function flattenDictKeys(dict, result) {
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
    /**
     * 
     * @param {array} arr - an array with nested arrays.
     * @returns {array} - a flat array with all the values from the nested arrays.
     */
    flattenArray: function flattenArray(arr, result) {
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

function initialize() {
    action_cdda_verbose.checked = true
    if (tiled.projectFilePath === undefined) {
        return tiled.log(`No project file loaded. Please load a project file.`)
    }
    var pathToConfig = `${ FileInfo.path(tiled.projectFilePath)}/${configfilename}`

    if (!File.exists(pathToConfig)) {
        tiled.log(`no config file found at ${pathToConfig}. Making new config file.`)
        config = new extensionConfig(FileInfo.path(tiled.projectFilePath));
        if(!config.hasOwnProperty(`path_to_cdda`)){
            return wizard()
        }
        if (!config.path_to_cdda) { return }
        cte.updateConfig()
        add_config_properties()
    } else {
        if (verbose >= 2) { tiled.log(`config file found at ${pathToConfig}`); }
        cte.load_config()
    }
    if (!File.exists(config.path_to_tilesets)) { File.makePath(config.path_to_tilesets); }
    if (!File.exists(config.path_to_maps)) { File.makePath(config.path_to_maps); }
    return 1;
}
function isPathToCddaValid(path){
    if (File.exists(`${path}/data/cataicon.ico`) && File.exists(`${path}/gfx/tile_config_template.json`)) {
        return true
    } else {
        return false
    }
}
function isTilesetInstalled(tileset){
    if(File.exists(`${FileInfo.path(tiled.projectFilePath)}/tilesets/${tileset}`)){
        return true
    } else {
        return false
    }
}
function isTilesetActive(tileset){
    if(config && config.chosen_tileset && config.chosen_tileset == tileset){
        return true
    } else {
        return false
    }
}
/**
 * 
 * @param {string} path - path starting with file://
 * @returns - path without file:// depending on OS
 */
function removeFileStringFromFileUrl(path){
    if (tiled.platform === "windows") {
        return path.toString().replace(/^file\:\/\/\//, "");
    } else {
        return path.toString().replace(/^file\:\//, "");
    }
}
function getInstalledTilesets(){
    if(File.exists(`${FileInfo.path(tiled.projectFilePath)}/tilesets`)){
        return cte.getFoldersInPath(`${FileInfo.path(tiled.projectFilePath)}/tilesets`);
    }
}
function getCurrentlyActiveTileset(){
    if(config && config.chosen_tileset && File.exists(`${FileInfo.path(tiled.projectFilePath)}/tilesets/${config.chosen_tileset}`)){
        return config.chosen_tileset;
    } else {
        return false;
    }
}
function wizard(){
    let wizard = new Dialog();
    wizard.windowTitle = `CDDA Tiled Extension Config`;
    let pathToCdda;
    let chosenTileset;
    let isPathValid;
    let installedTilesets = getInstalledTilesets()
    let deleteConfirmCounter = 0;


    let newPathToCDDA;
    let cddaPathCheckmark;
    let availableTilesetsList =[];
    let rememberChosenTilesetIndex;
    
    
    config.path_to_cdda ? pathToCdda = config.path_to_cdda : pathToCdda = FileInfo.path(tiled.projectFilePath)
    config.chosen_tileset ? chosenTileset = config.chosen_tileset : chosenTileset;
    
    // let img = new Image();
    // img.load("E:/tiledtest/tilesets/favorites/images/f_armchair.png")
    // wizard.addImage("", img)


    wizard.addSeparator(`Path to CDDA`);
    let currentlySavedPathToCdda = wizard.addLabel(`Current path: ${config.path_to_cdda}`);
    wizard.addNewRow();
    wizard.addLabel("New path:", true);
    let path_to_cdda_filepicker = wizard.addFilePicker();
    cddaPathCheckmark = wizard.addLabel(``);
    // cddaPathCheckmark.setStyleSheet("QLabel { background-color : red; color : blue; }"); 
    // cddaPathCheckmark.setStyleSheet("QLabel { color : red; }"); 
    path_to_cdda_filepicker.fileUrl = pathToCdda;
    updateCddaPathCheckmark(pathToCdda);
    wizard.addSeparator(`Tilesets`);
    let currentlyActiveTilesetText = wizard.addLabel(`Active tileset: ${getCurrentlyActiveTileset()}`);
    wizard.addNewRow();
    let tilesetSelector = wizard.addComboBox(``, availableTilesetsList);
    let cddaPathTilesetWarning = wizard.addLabel(`-not in root CDDA directory-`);
    wizard.addNewRow();
    let deleteTilesetButton = wizard.addButton(`Delete`);
    let installTilesetButton = wizard.addButton(`Install`);
    let activateTilesetButton = wizard.addButton(`Activate`);
    wizard.addSeparator();
    let readinessMessage = wizard.addLabel(`Not ready to import maps`);
    wizard.addNewRow();
    wizard.addLabel(``);
    wizard.addNewRow();
    wizard.addSeparator();
    let closeButton = wizard.addButton(`Close`);


    deleteTilesetButton.clicked.connect(function () {
        if(deleteConfirmCounter == 0){
            deleteConfirmCounter++
            deleteTilesetButton.text = `CONFIRM`
            return
        }
        if(deleteConfirmCounter == 1){
            deleteConfirmCounter = 0
            rememberChosenTilesetIndex = tilesetSelector.currentIndex;
            File.remove(`${FileInfo.path(tiled.projectFilePath)}/tilesets/${chosenTileset}`)
            updateTilesetSelector(isPathValid)
            updateTilesetList(isPathValid)
            updateTilesetButtons()
            deleteTilesetButton.text = `Deleted`;
            tilesetSelector.currentIndex = rememberChosenTilesetIndex;
            return
        }

    });
    installTilesetButton.clicked.connect(function () {
        installTilesetButton.text = `Installing...`;
        rememberChosenTilesetIndex = tilesetSelector.currentIndex;
        importTileset(`${newPathToCDDA}/gfx/${chosenTileset}`)
        installTilesetButton.text = `Installing...`;
        updateTilesetSelector(isPathValid)
        updateTilesetButtons()
        tilesetSelector.currentIndex = rememberChosenTilesetIndex;
        wizard.show()
    });
    activateTilesetButton.clicked.connect(function () {
        rememberChosenTilesetIndex = tilesetSelector.currentIndex;
        if(!isTilesetInstalled(chosenTileset)){
            importTileset(`${newPathToCDDA}/gfx/${chosenTileset}`)
        }
        config.chosen_tileset = chosenTileset;
        cte.updateConfig();
        updateTilesetSelector(isPathValid)
        updateTilesetButtons()
        tilesetSelector.currentIndex = rememberChosenTilesetIndex;
        currentlyActiveTilesetText.text = `Active tileset: ${config.chosen_tileset}`;
    });

    closeButton.clicked.connect(function () {
        wizard.reject();
    });



    isPathToCddaValid(pathToCdda) ? isPathValid = true : isPathValid = false;
    newPathToCDDA = pathToCdda;
    updateCddaPathCheckmark(isPathValid)
    updateTilesetSelector(isPathValid)
    updateTilesetButtons()

    function updateTilesetButtons(){
        if(isTilesetInstalled(chosenTileset) ){
            installTilesetButton.enabled = false;
            installTilesetButton.toolTip = `Already installed`;
            installTilesetButton.text = `Installed`;
            deleteTilesetButton.enabled = true;
            deleteTilesetButton.text = `Delete`;
        } else {
            installTilesetButton.enabled = true;
            installTilesetButton.toolTip = ``;
            installTilesetButton.text = `Install`;
            deleteTilesetButton.enabled = false;
            deleteTilesetButton.text = `Delete`;
        }
        if(isTilesetActive(chosenTileset)){
            activateTilesetButton.enabled = false;
            activateTilesetButton.toolTip = `Already active`;
            activateTilesetButton.text = `Active`;
        } else {
            activateTilesetButton.enabled = true;
            activateTilesetButton.toolTip = ``;
            activateTilesetButton.text = `Activate`;
        }
        if(["favorites"].includes(chosenTileset)){
            activateTilesetButton.enabled = false;
            activateTilesetButton.toolTip = `This is a meta tileset and not a CDDA tileset that can be imported.`;
            activateTilesetButton.text = `Wrong Type`;
        }
    }

    function updateTilesetSelector(valid){
        if(valid){
            updateTilesetList(valid);
        }
        isReadyForMapImport()
        if(valid || installedTilesets.length > 0){
            tilesetSelector.visible = true;
            deleteTilesetButton.visible = true;
            installTilesetButton.visible = true;
            activateTilesetButton.visible = true;
            cddaPathTilesetWarning.visible = false;
        }
        if(!valid && installedTilesets.length == 0){
            tilesetSelector.clear();
            tilesetSelector.visible = false;
            deleteTilesetButton.visible = false;
            installTilesetButton.visible = false;
            activateTilesetButton.visible = false;
            cddaPathTilesetWarning.visible = true;
        }
    }
    // ✅ ❌
    // font-variant: small-caps;
    function updateCddaPathCheckmark(valid){
        if(valid){
            cddaPathCheckmark.text = `✓`
            cddaPathCheckmark.toolTip = `This is a valid path to CDDA`
            cddaPathCheckmark.setStyleSheet("QLabel { color : #66FF99; }"); 
        } else {
            cddaPathCheckmark.text = `✗`
            cddaPathCheckmark.toolTip = `This is a not valid path to CDDA`
            cddaPathCheckmark.setStyleSheet("QLabel { color : red; }"); 
        }
    }

    path_to_cdda_filepicker.fileUrlChanged.connect(() => {
        deleteConfirmCounter = 0
        path_to_cdda_filepicker.fileUrl = FileInfo.path(path_to_cdda_filepicker.fileUrl)
        newPathToCDDA = removeFileStringFromFileUrl(path_to_cdda_filepicker.fileUrl)
        isPathToCddaValid(newPathToCDDA) ? isPathValid = true : isPathValid = false;
        if(isPathValid){
            config.path_to_cdda = newPathToCDDA;
            cte.updateConfig();
            currentlySavedPathToCdda = `Current path: ${config.path_to_cdda}`;
        };
        updateCddaPathCheckmark(isPathValid)
        updateTilesetSelector(isPathValid)
    })
    tilesetSelector.currentTextChanged.connect(() => {
        deleteConfirmCounter = 0
        chosenTileset = availableTilesetsList[tilesetSelector.currentIndex];
        updateTilesetButtons()
    })

    function updateTilesetList(valid){
        installedTilesets = getInstalledTilesets()
        tilesetSelector.clear()
        if(valid){
            availableTilesetsList = cte.getFoldersInPath(`${newPathToCDDA}/gfx`);
        } else {
            availableTilesetsList = installedTilesets
        }
        let displayAvailableTilesetsList;
        if(availableTilesetsList != null){
            displayAvailableTilesetsList = availableTilesetsList.map((t) => {
                if(t == `favorites`){ return `${t}  (not valid tileset)`}
                if(installedTilesets.includes(t)){
                    if(getCurrentlyActiveTileset() == t){ return`-${t}-  (-active-)` }
                    return `${t}  (installed)`;
                 } else {
                    return `${t}`
                 }
            })
        }
        tilesetSelector.addItems(displayAvailableTilesetsList)
        chosenTileset ? tilesetSelector.currentIndex = availableTilesetsList.indexOf(chosenTileset) : tilesetSelector.currentIndex = availableTilesetsList.indexOf(config.chosen_tileset);
    }
    function isReadyForMapImport(){
        if(isPathToCddaValid(pathToCdda) && config && config.chosen_tileset && isTilesetInstalled(config.chosen_tileset)){
            readinessMessage.text = `Ready to import maps`;
        } else {
            readinessMessage.text = `Not ready to import maps`;
        }
    }
    
    wizard.show()
}
function getpathToCDDA(){
    return cte.folderPicker(config.hasOwnProperty(`path_to_cdda`) ? config.path_to_cdda : FileInfo.path(tiled.projectFilePath), `Path to CDDA folder`)
}
function addSpriteToFavotires() {
    let originalAsset = tiled.activeAsset
    let tileset;
    let tiles;
    let is_image_collection = false;
    if (tiled.activeAsset.isTileset) {
        if (verbose >= 1) { tiled.log(`asset is tileset`) }
        tileset = tiled.activeAsset;
        tiles = tiled.activeAsset.selectedTiles;
        is_image_collection = tileset.collection
    }
    if (tiled.activeAsset.isTileMap) {
        if (verbose >= 1) { tiled.log(`asset is tilemap`) }
        tileset = tiled.mapEditor.tilesetsView.currentTileset;
        tiles = tiled.mapEditor.tilesetsView.selectedTiles;
    }
    if (tiles.length < 1) { return tiled.log(`No tiles selected.`) }
    let pathToFavoriteImages = `${FileInfo.path(config.path_to_favorites_tileset)}/images`
    if (!File.exists(FileInfo.path(config.path_to_favorites_tileset))) { File.makePath(FileInfo.path(config.path_to_favorites_tileset)); };
    if (!File.exists(pathToFavoriteImages)) { File.makePath(pathToFavoriteImages); };

    let favorites;
    if (!File.exists(config.path_to_favorites_tileset)) {
        favorites = new Tileset("Favorites");
        tiled.tilesetFormat("json").write(favorites, config.path_to_favorites_tileset);
        cte.adjustTSJ(config.path_to_favorites_tileset)
    }
    favorites = tiled.open(config.path_to_favorites_tileset);
    for (let tile of tiles) {
        let path_to_image;
        if (!is_image_collection) {
            path_to_image = `${pathToFavoriteImages}/${tile.property(`cdda_id`)}.png`
            if (!File.exists(path_to_image)) {
                let [x, y] = cte.getTileXY(tile)
                let croppedImage = cte.cropImage(tileset.image, x, y);
                croppedImage.save(path_to_image);
            };
        } else {
            path_to_image = tile.imageFileName
        }
        let new_image_tile = favorites.addTile()
        new_image_tile.setProperty("cdda_id", tile.property(`cdda_id`))
        new_image_tile.imageFileName = path_to_image
        tiled.log(`'${tile.property(`cdda_id`)}' added to favorites.`)
    }
    // tiled.log(tiled.activeAsset.selectedTiles)
    tiled.tilesetFormat("json").write(favorites, config.path_to_favorites_tileset);
    tiled.reload(tiled.activeAsset)
    tiled.open(originalAsset.fileName)
    // tiled.activeAsset = originalAsset
}
/**
 * 
 * @param {"string"} cdda_id 
 * @returns {"Tile"} - new unknown tile
 */
function add_cdda_id_to_unknowns(cdda_id) {
    if (cdda_id == `t_null`) { return }
    // tiled.log(`Working on Unkown Tiles`)

    if (!config.hasOwnProperty(`path_to_unknowns_tileset`)) {
        config.path_to_unknowns_tileset = `${config.path_to_chosen_tileset_files}/unknown_tiles.tsj`
        cte.updateConfig()
    }
    if (!cache.hasOwnProperty(config.path_to_meta_tileset)) { cache[config.path_to_meta_tileset] = JSONread(config.path_to_meta_tileset) }
    let tsjTiles = cache[config.path_to_meta_tileset]
    function get_path_to_tile_image(cdda_id){
        for (let tile_i in tsjTiles.tiles) {
            let _this_tile = tsjTiles.tiles[tile_i]
            for (let property in _this_tile.properties) {
                let _this_property = _this_tile.properties[property]
                if (_this_property.value == cdda_id) {
                    let path;
                    if (FileInfo.isAbsolutePath(_this_tile.image)) {
                        path = _this_tile.image
                    } else {
                        path = `${FileInfo.path(config.path_to_meta_tileset)}/${_this_tile.image}`
                    }
                    cache.unknown_tile_image_path = path
                    tiled.log(`path to unknown tile image ${cache.unknown_tile_image_path}`)
                    return
                }
            }
        }
    }
    if (!cache.hasOwnProperty("unknown_tile_image_path")) {
        get_path_to_tile_image("unknown_tile")
    } else if (cache.unknown_tile_image_path === undefined){
        get_path_to_tile_image("unknown_tile")
    }
    if(cache.unknown_tile_image_path == undefined){ return }
    // return unknown tile if already made
    if (File.exists(config.path_to_unknowns_tileset)) {
        let unknown_tsj_tiles = JSONread(config.path_to_unknowns_tileset)
        for (let tile_i in unknown_tsj_tiles.tiles) {
            let _this_tile = unknown_tsj_tiles.tiles[tile_i]
            for (let property in _this_tile.properties) {
                let _this_property = _this_tile.properties[property]
                if (_this_property.value == cdda_id) {
                    return tiled.open(config.path_to_unknowns_tileset).findTile(unknown_tsj_tiles.tiles[tile_i].id);
                }
            }
        }
    }
    // make unknowns tileset if it doesn't exist
    let unknowns;
    if (!File.exists(config.path_to_unknowns_tileset)) {
        unknowns = new Tileset("unknowntiles");
        tiled.tilesetFormat("json").write(unknowns, config.path_to_unknowns_tileset);
        cte.adjustTSJ(config.path_to_unknowns_tileset)
    }
    unknowns = tiled.open(config.path_to_unknowns_tileset);

    // add tile and properties with unknown image filepath
    let newUnknownTile = unknowns.addTile()
    newUnknownTile.setProperty("cdda_id", cdda_id)
    newUnknownTile.imageFileName = cache.unknown_tile_image_path
    if (verbose >= 1) { tiled.log(`'${newUnknownTile.property(`cdda_id`)}' added to unknowns.`) }

    tiled.tilesetFormat("json").write(unknowns, config.path_to_unknowns_tileset);
    // tiled.close(unknowns)
    return newUnknownTile
}

// meta tileset
function generateMetaTileset() {
    // File.exists(FileInfo.toNativeSeparators(tiled.extensionsPath+"/cdda_map_extension_extras"))
    if (!config.hasOwnProperty("pathToExtras")) { return tiled.log(`Path to Extras not defined`) }
    // if(!File.exists(config.pathToExtras)){tiled.makePath(config.pathToExtras);}
    let tilesetname = "cdda_meta_tileset"
    let tileset = new Tileset(tilesetname)
    for (let filepath of getRecursiveFilePathsInFolder(config.pathToExtras)) {
        if (!filepath.match(/\.png$/)) { continue; }
        if (verbose >= 2) { tiled.log(`adding '${filepath}' to meta tileset.`); }
        let tile = tileset.addTile();
        tile.setProperty("cdda_id", FileInfo.baseName(filepath))
        tile.imageFileName = filepath
    }
    // tiled.log(`'${config.path_to_meta_tileset}' meta tileset.`)
    tiled.tilesetFormat("json").write(tileset, config.path_to_meta_tileset)
}

function JSONread(filepath) {
    const file = new TextFile(filepath, TextFile.ReadOnly)
    file.codec = "UTF-8"
    const file_data = file.readAll()
    file.close()
    return JSON.parse(file_data)
}
function getRecursiveFilePathsInFolder(targetPath) {
    if (verbose >= 2) { tiled.log(`getting paths files in folder`); };
    let filePaths = cte.getFilesInPath(targetPath).map(a => `${targetPath}/${a}`)
    let folderPaths = cte.getFoldersInPath(targetPath).map(a => `${targetPath}/${a}`);
    for (let folderPath in folderPaths) {
        filePaths = filePaths.concat(cte.getFilesInPath(folderPath).map(a => `${folderPath}/${a}`));
        let subfolders = cte.getFoldersInPath(folderPath).map(a => `${folderPath}/${a}`)
        for (let subfolder in subfolders) {
            if (subfolders != null) { folderPaths.push(subfolder); }
        }
    }
    if (verbose >= 2) { tiled.log(`palette file paths`); };
    if (verbose >= 2) { tiled.log(filePaths); };
    return filePaths;
}


function importTileset(pathToChosenTileset) {

    // config.set_path_to_cdda = !config.hasOwnProperty(`path_to_cdda`) ? getpathToCDDA() : config.path_to_cdda
    // if (!config.path_to_cdda) { return tiled.log("Action cancelled.") }
    // cte.updateConfig();
    // tiled.log(config.path_to_cdda_tilesets)
    // let dialogoutput = chooseTilesetDialog(config.path_to_cdda_tilesets)
    // if (!dialogoutput) { return tiled.log("Action cancelled.") }
    // config.path_to_chosen_cdda_tileset_files = dialogoutput

    config.path_to_chosen_cdda_tileset_files = pathToChosenTileset

    if (config.path_to_chosen_cdda_tileset_files.match(/\.json$/)) { config.path_to_chosen_cdda_tileset_files = FileInfo.path(config.path_to_chosen_cdda_tileset_files) }

    if (!File.exists(config.path_to_chosen_tileset_files)) { tiled.log(`Making path to chosen tileset '${config.path_to_chosen_tileset_files}'`);File.makePath(config.path_to_chosen_tileset_files); }
    if (!File.exists(config.path_to_meta_tileset)) { tiled.log("Generating meta tileset."); generateMetaTileset(); }

    // cte.updateConfig();
    let pathToDuplicateIDImages = `${config.path_to_chosen_tileset_files}/duplicate_id_images`
    if (!File.exists(pathToDuplicateIDImages)) { File.makePath(pathToDuplicateIDImages); }
    let pathToDuplicateIDTSJ = `${config.path_to_chosen_tileset_files}/duplicate_id_tiles.tsj`
    //duplicates tiled tileset
    var dupe_tileset = new Tileset("duplicate_cdda_ids");

    var filename = config.path_to_chosen_cdda_tileset_json



    function importSpriteData(ts, jts, j, i) {
        let tiles = j['tiles-new'][i]['tiles']
        for (let tile of tiles) {
            tiled.log('------')
            tiled.log(tile['id'])

            let cdda_IDs = []
            if (tile["animated"]) {
                tiled.log(`is animated`)
                for (let subtile of tile['fg']) {
                    for (let subtile in tile['fg']) {
                        if (typeof tile['fg'][subtile] != 'number') {
                            cdda_IDs.push(tile['fg'][subtile]['sprite'])
                        }
                    }
                }
            }
            if (tile["multitile"]) {
                tiled.log(`is multitile`)
                cdda_IDs.push(tile['fg'])
                for (let subtile in tile["additional_tiles"]) {
                    if (Array.isArray(tile["additional_tiles"][subtile]['fg'])) {
                        for (let subSubtile in tile["additional_tiles"][subtile]['fg']) {
                            if (typeof tile["additional_tiles"][subtile]['fg'][subSubtile] == 'number') {
                                cdda_IDs.push(tile["additional_tiles"][subtile]['fg'][subSubtile])
                            }

                            if (typeof tile["additional_tiles"][subtile]['fg'][subSubtile]['sprite'] == 'number') {
                                cdda_IDs.push(tile["additional_tiles"][subtile]['fg'][subSubtile]['sprite'])
                            } else {
                                for (let sprite in tile["additional_tiles"][subtile]['fg'][subSubtile]['sprite']) {
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
            if (!tile["animated"] && !tile["multitle"]) {
                if (Array.isArray(tile['fg'])) {
                    for (let subtile in tile['fg']) {
                        if (typeof tile['fg'][subtile] != 'number') {
                            cdda_IDs.push(tile['fg'][subtile]['sprite'])
                        } else {
                            cdda_IDs.push(tile['fg'][subtile])
                        }
                    }
                } else {
                    cdda_IDs.push(tile['fg'])
                }
                if (typeof tile['bg'] == 'number') {
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
            if (verbose >= 2) { tiled.log(`CDDA IDs found in range ${jts.range[0]} - ${jts.range[1]}`); };
            if (verbose >= 2) { tiled.log(cdda_IDs); }
            if (cdda_IDs === []) { continue }


            if (verbose >= 2) { tiled.log(`CDDA IDs:`); }
            if (verbose >= 2) { tiled.log(cdda_IDs); }
            let LocalID = 0;
            cddaidentryloop:
            for (let t in cdda_IDs) {
                //offset 1st tile in tileset range
                (jts.range[0] == 1) ? LocalID = cdda_IDs[t] - jts.range[0] + 1 : LocalID = cdda_IDs[t] - jts.range[0]
                tiled.log(`cdda id: ${cdda_IDs[t]} >>> Local tile ID: ${LocalID}`);
                let currentTile = ts.findTile(LocalID)

                let pathToThisDupeImage;
                if (Array.isArray(tile.id)) {
                    eachtileloop:
                    for (let n in tile.id) {
                        // handle duplicates from array
                        pathToThisDupeImage = `${pathToDuplicateIDImages}/${tile.id[n]}.png`
                        if (currentTile.properties().hasOwnProperty("cdda_id")) {
                            if (!File.exists(pathToThisDupeImage)) {
                                let [x, y] = cte.getTileXY(currentTile);
                                let croppedImage = cte.cropImage(currentTile.asset.image, x, y);
                                croppedImage.save(pathToThisDupeImage);
                            }
                            let croppedImageTile = dupe_tileset.addTile()
                            croppedImageTile.setProperty("cdda_id", tile.id[n])
                            croppedImageTile.imageFileName = pathToThisDupeImage
                        } else {
                            currentTile.setProperty('cdda_id', tile.id[n])
                        }

                        for (let p in currentTile.properties()) {
                            if (currentTile.properties()[p] == tile["id"][n]) { continue eachtileloop; }
                        }
                    }
                } else {
                    for (let p in currentTile.properties()) {
                        if (currentTile.properties()[p] == tile["id"]) { continue cddaidentryloop; }
                    }

                    // handle duplicates
                    pathToThisDupeImage = `${pathToDuplicateIDImages}/${tile.id}.png`
                    if (currentTile.properties().hasOwnProperty("cdda_id")) {
                        if (!File.exists(pathToThisDupeImage)) {
                            let [x, y] = cte.getTileXY(currentTile);
                            let croppedImage = cte.cropImage(currentTile.asset.image, x, y);
                            croppedImage.save(pathToThisDupeImage);
                            croppedImage = undefined;
                        }
                        let croppedImageTile = dupe_tileset.addTile()
                        croppedImageTile.setProperty("cdda_id", tile.id)
                        croppedImageTile.imageFileName = pathToThisDupeImage
                    } else {
                        currentTile.setProperty('cdda_id', tile.id)
                    }
                }
                if (currentTile.property("cdda_id").match(/^mon_/)) {
                    currentTile.setProperty("density", 0.5)
                }
                // // set export property
                // if (!currentTile.properties().hasOwnProperty("CDDA_ID_export")){
                //     currentTile.setProperty("CDDA_ID_export", "")
                // }
            }
        }
        return ts
    }
    function processTileset(j, i) {
        //tiled.log(`i: ${i}`)

        let jts = {};

        //get name of tileset image
        let imgFile = j['tiles-new'][i]['file']
        jts.name = FileInfo.baseName(imgFile)

        //skip existing ("just skip existing altogether bro") and 'fallback'
        let shouldSkip = !overwriteExisting && File.exists(`${config.path_to_chosen_tileset_files}/${jts.name}.tsj`) || skipOverwrite && imgFile.match(/(fallback)/);
        if (shouldSkip) {
            if (verbose >= 2) { tiled.log(`skipping ${jts.name}`); };
            return [0, 0];
        }
        tiled.log(`working on ${jts.name}`);

        //tileset parameters
        //dimensions
        jts.width = j['tiles-new'][i]['sprite_width'];
        jts.height = j['tiles-new'][i]['sprite_height'];
        //offsets
        (typeof j['tiles-new'][i]['sprite_offset_x'] == 'number') ? jts.xOffset = j['tiles-new'][i]['sprite_offset_x'] : jts.xOffset = 0;
        (typeof j['tiles-new'][i]['sprite_offset_y'] == 'number') ? jts.yOffset = j['tiles-new'][i]['sprite_offset_y'] : jts.yOffset = 0;
        if (j['tiles-new'][i].hasOwnProperty("//")) {
            jts.range = [Number(j['tiles-new'][i]['//'].match(/\d+/)[0]), Number(j['tiles-new'][i]['//'].match(/\d+$/)[0])]
            let localIDRange = jts.range[1] - jts.range[0]
        }

        if (verbose >= 2) { tiled.log(`tileset dimensions: ${jts.width}, ${jts.height}`); };
        if (verbose >= 2) { tiled.log(`tileset range: ${jts.range[0]} - ${jts.range[1]}`); };
        if (verbose >= 2) { tiled.log(`tileset offset: ${jts.xOffset}, ${jts.yOffset}`); };
        if (jts.height >= 64) {
            jts.offset = Qt.point(jts.xOffset, (32 + jts.yOffset));
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
        let path_to_chosen_cdda_tileset_files = `${config.path_to_chosen_cdda_tileset_files}/${imgFile}`
        img.load(path_to_chosen_cdda_tileset_files);
        if (verbose >= 2) { tiled.log(`Image is ${img.width} by ${img.height} - ${path_to_chosen_cdda_tileset_files}`); };

        //load tilesheet image into tilesheet (source not embed)
        ts.loadFromImage(img, path_to_chosen_cdda_tileset_files)

        if (verbose >= 1) { tiled.log(`tileset name: ${ts.name}`); };
        if (verbose >= 1) { tiled.log(`tileset image: ${ts.image}`); };
        if (verbose >= 1) { tiled.log(`number of sprites: ${ts.tileCount}`); };

        return { ts, jts };
    }

    //read tileset config file
    let f = new TextFile(filename, TextFile.ReadOnly);
    f.codec = "UTF-8"
    let c = f.readAll();
    f.close();
    let j = JSON.parse(c);

    var tilesetInfoWidth = j.tile_info[0].width
    var tilesetInfoHeight = j.tile_info[0].height
    var tilesetInfoPixelscale = j.tile_info[0].pixelscale

    tiled.log(`Importing '${config.chosen_tileset}' with dimensions w:${tilesetInfoWidth} h:${tilesetInfoHeight} pixelscale:${tilesetInfoPixelscale}`)

    //iterate over tilset config file entries

    for (let t in j['tiles-new']) {
        let { ts, jts } = processTileset(j, t)
        if (ts == null) { continue; }
        ts = importSpriteData(ts, jts, j, t)
        let path_to_tilesetsFile = config.path_to_chosen_tileset_files + "/" + ts.name + ".tsj"
        if (verbose >= 2) { tiled.log(`Preparing to write ${(ts.isTileset) ? `tilesheet` : `not a tilesheet`} '${ts.name}' to '${path_to_tilesetsFile}'`); };
        // let outputFileResults = writeToFile(path_to_tilesetsFile,ts);
        let outputFileResults = tiled.tilesetFormat("json").write(ts, path_to_tilesetsFile)
        // (outputFileResults == null) ? tiled.log(ts.name + " file created successfully.") : tiled.log(`FAILED to create file at '${path_to_tilesetsFile}'' - Error: ${outputFileResults}`)
        tiled.log('-------------------TSJ DONE-------------------')

    }
    // tiled.log(pathToDuplicateIDTSJ)
    tiled.tilesetFormat("json").write(dupe_tileset, pathToDuplicateIDTSJ)
    tiled.log('------------------------- Import Tileset DONE -------------------------')
}


function chooseIdFromSymbolObject(object,symbolObject){

    if (object == "terrain") {
        if (typeof symbolObject === "string") {
            return symbolObject
        }
        if(symbolObject.constructor.name === "Object"){
            if (symbolObject.param){
                return symbolObject.param
            }
        }
        if (Array.isArray(symbolObject)) {
            for (let entry of cte.flattenArray(symbolObject)) {
                if (typeof entry == "string") {
                    return entry
                }
            }
        }
    }
    if (object == "furniture") {
        if (typeof symbolObject === "string") {
            return symbolObject;
        }
        if (Array.isArray(symbolObject)) {
            for (let entry of cte.flattenArray(symbolObject)) {
                if (typeof entry == "string") {
                    return symbolObject;
                }
            }
        }
    }
    if (object == "items") {
        if (Array.isArray(entry)) {
            for (let entry of symbolObject) {
                return entry.item
            }
        } else {
            return symbolObject.item
        }
    }
    if (object == "traps") {
        if (typeof symbolObject === "string") {
            return symbolObject
        }
        if (Array.isArray(symbolObject)) {
            for (let entry of cte.flattenArray(symbolObject)) {
                if (typeof entry == "string") {
                    return entry
                }
            }
        }
    }
    if (object == "monster") {
        return symbolObject.monster
    }
    if (object == "liquids") {
        return symbolObject.liquid
    }
    if (object == "vehicles") {
        return symbolObject.vehicle
    }
}

function new_importMapsDialog(){

    config.pathToLastImportMap = filepath;
    cte.updateConfig();
    for (let map in maps){
        if (maps[i].type != "mapgen" || maps[i].method != "json") { continue; } // must be mapgen and json
    }
}
/**
 * 
 * @param {"string"} filename 
 * @returns asset | null
 */
function getOpenAssetByFilename(filename){
    for (let i = 0; i < tiled.openAssets.length; i++) {
        if (tiled.openAssets[i].fileName == filename) {
            return tiled.openAssets[i];
        }
    }
    return null;
}


/**
 * 
 * @param {"string"} cddaId 
 * @returns tile, id, filepath
 */
function new_getTileForCddaId(cddaId){
    
    // TODO guarantee special tilesets are generated?
    // get tile locations known for cdda ids in map
    let tilesetFilepaths = getRecursiveFilePathsInFolder(config.path_to_chosen_tileset_files);
    if (config.path_to_meta_tileset && File.exists(config.path_to_meta_tileset)) { tilesetFilepaths.push(config.path_to_meta_tileset) } // add meta tsj to the mix
    if (config.path_to_unknowns_tileset && File.exists(config.path_to_unknowns_tileset)) { tilesetFilepaths.push(config.path_to_unknowns_tileset) } // add unknown tsj to the mix

    for (let filepath of tilesetFilepaths) { // fill all tile dict
        if (FileInfo.suffix(filepath) !=`tsj`) { continue; };
        // if(!cache[filepath]){
        //     cache[filepath] = {}
        // }
        // if(!cache[filepath].asset){
        //     cache[filepath].asset = tiled.open(filepath);
        // }
        let assetcheck = getOpenAssetByFilename(filepath)
        let tilesetAsset;
        if (tiled.isTileset(assetcheck)) {
            tilesetAsset = assetcheck;
        } else {
            tilesetAsset = tiled.open(filepath);
        }
        let tilesetname = FileInfo.baseName(filepath);

        for (let tile_i in tilesetAsset.tiles) {
            let tile = tilesetAsset.tiles[tile_i]
            let properties = tile.resolvedProperties()
            for (let property_i in properties) {
                if (properties[property_i].name != "cdda_id") { continue; }; // continue if not cdda id
                if (properties[property_i].value == cddaId) {
                    let id = properties[property_i].id
                    return tile//, id, filepath
                };
            }
        }
        let tile = add_cdda_id_to_unknowns(cddaId)
        return tile//, tile.id, tile.filepath
    }

    // return tile

}

function new_buildTilePaletteDict(import_map) {
    tiled.log(`------- Palette Loading Area ---------`);

    function getPaletteFileData(mapFilePalettes, filepath) {
        if (verbose) { tiled.log(`checking palette '${filepath}'`); }
        const file = new TextFile(filepath, TextFile.ReadOnly)
        file.codec = "UTF-8"
        const file_data = file.readAll()
        file.close()
        let paletteFileJSON = JSON.parse(file_data)

        let thisPalette = {}
        for (let p of paletteFileJSON) {
            // let thisPalette = paletteFileData[p]
            // tiled.log(`palette id '${p['id']}'`)
            if (p['type'] != "palette") { continue; };
            if (mapFilePalettes.includes(p['id'])) {
                if (verbose) { tiled.log(`id '${p['id']}' found in ${FileInfo.fileName(filepath)}. Importing...`); }
                // mapPalette['terrain'] = Object.assign(mapPalette['terrain'], p['terrain']);
                for (let mapLayerType of mapLayerTypes) {
                    thisPalette[mapLayerType] = {}
                    for (let key in p[mapLayerType]) {
                        let temparray = []
                        // if string
                        if (typeof p[mapLayerType][key] === "string") {
                            thisPalette[mapLayerType][key] = p[mapLayerType][key]
                        }
                        // if array
                        if (Array.isArray(p[mapLayerType][key])) {
                            if (Array.isArray(p[mapLayerType][key][0])) {
                                temparray = []
                                for (let subarray of p[mapLayerType][key]) {
                                    (Array.isArray(subarray)) ? temparray.push(subarray[0]) : temparray.push(subarray);

                                }
                                thisPalette[mapLayerType][key] = temparray
                            } else {
                                thisPalette[mapLayerType][key] = p[mapLayerType][key]
                            }
                        }
                        // if object (dict)
                        if (p[mapLayerType][key].constructor == Object) {
                            if (p[mapLayerType][key].hasOwnProperty("param")) {
                                if (typeof p[mapLayerType][key].param === "string") {
                                    thisPalette[mapLayerType][key] = p[mapLayerType][key].param
                                }
                            }
                            if (p[mapLayerType][key].hasOwnProperty("switch")) {
                                if (p[mapLayerType][key].switch.hasOwnProperty("param")) {
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
    function getMapfileCustomPalette(import_map) {
        if (verbose) { tiled.log(`getting data from map file`); }
        let thisPalette = {}
        for (let mapLayerType of mapLayerTypes) {
            tiled.log(`map layer '${mapLayerType}'`)
            thisPalette[mapLayerType] = {}
            for (let key in import_map.object[mapLayerType]) {
                // if string
                if (typeof import_map.object[mapLayerType][key] === "string") {
                    thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key]
                    continue
                }
                // TODO import items as objects
                // if array
                if (Array.isArray(import_map.object[mapLayerType][key])) {
                    if(import_map.object[mapLayerType][key][0].hasOwnProperty("constructor")){
                        if(import_map.object[mapLayerType][key][0].constructor = Object){
                            if(import_map.object[mapLayerType][key][0].hasOwnProperty("item")){
                                thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][0].item
                                continue
                            }
                        }
                    }
                    if(Array.isArray(import_map.object[mapLayerType][key][0])){
                        if (typeof import_map.object[mapLayerType][key][0][0] === "string") {
                            thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][0][0]
                            continue
                        }
                    }
                    if (typeof import_map.object[mapLayerType][key][0] === "string") {
                        thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][0]
                        continue
                    }
                    continue
                    // thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][Math.floor(Math.random() * import_map.object[mapLayerType][key].length)]
                }
                // if object
                if(import_map.object[mapLayerType][key].constructor = Object){
                    if(import_map.object[mapLayerType][key].hasOwnProperty("field")){
                        thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key].field
                        continue
                    }
                    if(import_map.object[mapLayerType][key].hasOwnProperty("monster")){
                        thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key].monster
                        continue
                    }
                    if(import_map.object[mapLayerType][key].hasOwnProperty("item")){
                        thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key].item
                        continue
                    }
                }

                tiled.log(`custom key '${key}' > '${thisPalette[mapLayerType][key]}'\tadded to palette'${mapLayerType}'.`)
            }
        }
        return thisPalette;
    }

    // init map palette
    let mapPalette = {}
    let tempPaletteDict = {}
    for (let mapLayerType of mapLayerTypes) {
        mapPalette[mapLayerType] = {};
    };

    if (import_map.object.hasOwnProperty("palettes")) {
        tiled.log(`------- importing preset palette symbols ----`);
        let palettePaths = getRecursiveFilePathsInFolder(config.path_to_cdda_palettes);
        for (let filepath of palettePaths) {
            let tempPaletteDict = getPaletteFileData(import_map['object']['palettes'], filepath);
            for (let mapLayerType of mapLayerTypes) {
                for (let key in tempPaletteDict[mapLayerType]) {
                    if (Array.isArray(tempPaletteDict[mapLayerType][key])) {
                        mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]//[Math.floor(Math.random() * tempPaletteDict[mapLayerType][key].length)]
                    } else {
                        mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]
                    }
                    if (verbose) { tiled.log(`true assign '${key}' >> '${mapPalette[mapLayerType][key]}'`) }
                }
            }
        }
    }

    tiled.log(`------- importing mapfile symbols ---------`)
    tempPaletteDict = getMapfileCustomPalette(import_map);
    for (let mapLayerType of mapLayerTypes) {
        for (let key in tempPaletteDict[mapLayerType]) {
            mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]
            if (verbose) { tiled.log(`true assign '${key}' >> ${mapPalette[mapLayerType][key]}`) }
        }
    }

    tiled.log(`------- mapfile total custom palette import results---------`)
    for (let mapLayerType of mapLayerTypes) {
        tiled.log(`mapLayerType: ${mapLayerType}`)
        for (let n in mapPalette[mapLayerType]) {
            tiled.log(`${n} > ${mapPalette[mapLayerType][n]}\t\tin palette'${mapLayerType}'.`)
        }
    }

    return mapPalette;
}
function importMaps(filepath,maps){
    let originalOpenAssets = tiled.openAssets
    let tiledMap;
    let tileMapName = FileInfo.baseName(filepath)

    let mapwidth = 0
    let mapheight = 0
    for (let i in maps) { // find largest dimensions neccessary for map size
        let map = maps[i]
        let xy;
        if (map.object.rows) {
            xy = [map.object.rows[0].length, map.object.rows.length]
        }
        if (map.object.hasOwnProperty("mapgensize")) {
            xy = map.object.mapgensize
        }
        if (map.type != "mapgen" || map.method != "json") { continue; } // must be mapgen and json
        if (xy[0] > mapwidth) { mapwidth = xy[0] }
        if (xy[1] > mapheight) { mapheight = xy[1] }

        // break; // Why break here?
    }
    tiledMap = prepareTilemap(tileMapName, [mapwidth, mapheight])
    
    // let tm = new TileMap()
    // tm.setSize(mapsize[0], mapsize[1]);
    // tm.setTileSize(32, 32);
    // tm.orientation = TileMap.Orthogonal;
    // if (verbose >= 1) { tiled.log(`tilemap name: ${tmname}`) }

    function new_prepareTiledLayer(import_map, layername) {

        // tile layers
        if (mapLayerTypes.includes(layername)) {
            let tileLayer = new TileLayer(layername);
            if (import_map.object.hasOwnProperty("mapgensize")) {
                tileLayer.width = import_map.object.mapgensize[0];
                tileLayer.height = import_map.object.mapgensize[1]
            }
            if (import_map.object.hasOwnProperty("rows")) {
                tileLayer.width = import_map.object.rows[0].length;
                tileLayer.height = import_map.object.rows.length
            }
            tileLayer.setProperty("cdda_layer", layername)
            let tileLayerEdit = tileLayer.edit()
            
            if (mapLayerTypes.includes(layername)) {
                tiled.log(`editing layer ${tileLayerEdit.target.name}`)
                for (let i in new_mapArrays[layername]) {
                    let entry = new_mapArrays[layername][i]
                    if (verbose >= 1) { tiled.log(`adding to layer: '${entry}' - ( ${mapArrays[layername][entry][0]}, ${mapArrays[layername][entry][1]} ) - ${mapArrays[layername][entry][2]}`) }
                    tileLayerEdit.setTile(parseInt(entry.x,10), parseInt(entry.y,10), entry.tile)
                }
            }
            tileLayerEdit.apply();
            return tileLayer;
        }
        
        // entitiy layers
        if (entityLayerTypes.includes(layername)) {
            if (!import_map.object[layername]) {
                // if (verbose >= 1) { tiled.log(`layer not present '${layername}'`); }
                return
            }
            let objectGroup = new ObjectGroup(layername)
            if (import_map.object.hasOwnProperty("mapgensize")) {
                objectGroup.width = import_map.object.mapgensize[0];
                objectGroup.height = import_map.object.mapgensize[1]
            }
            if (import_map.object.hasOwnProperty("rows")) {
                objectGroup.width = import_map.object.rows[0].length;
                objectGroup.height = import_map.object.rows.length;
            }
            objectGroup.setProperty("cdda_layer", layername)
            // let oge = og.edit()
            if (verbose >= 1) { tiled.log(`editing layer '${objectGroup.name}' - '${layername}'`); }


            for (let entity of import_map.object[layername]) {
                if (verbose >= 1) { tiled.log(`entity entry: '${cte.flattenDict(entity)}'`); }
                let obj = new MapObject()
                let x = entity.x
                let y = entity.y
                let objname;
                // obj.tile = mapArrays[layername][entry][2]\

                for (let property in entity) {
                    if (["x", "y", "monsters", "item", "vehicle"].includes(property)) {
                        continue;
                    }
                    obj.setProperty(property, entity[property])
                }

                // if(layername == "items"){objname = entity.item;}
                if (layername == "place_fields") { objname = entity.field; }
                if (layername == "place_item") { objname = entity.item; }
                if (layername == "place_items") { objname = entity.item; }
                if (layername == "place_vehicles") { objname = entity.vehicle; }
                if (layername == "place_monsters") { objname = entity.monster; }
                if (layername == "place_zones") { objname = entity.type; }
                if (layername == "place_loot") {
                    if (entity.hasOwnProperty("item")) {
                        objname = entity.item;
                        obj.setProperty("group", false)
                    }
                    if (entity.hasOwnProperty("group")) {
                        objname = entity.group;
                        obj.setProperty("group", true)
                    }
                }


                obj.setProperty("cdda_id", objname)
                obj.name = objname;
                obj.width = Array.isArray(x) ? (x[1] - x[0] + 1) * 32 : 32
                obj.height = Array.isArray(y) ? (y[1] - y[0] + 1) * 32 : 32
                obj.x = Array.isArray(x) ? x[0] * 32 : x * 32
                obj.y = Array.isArray(y) ? y[0] * 32 : y * 32
                if (verbose >= 1) { tiled.log(`adding object '${obj.name}' at ( ${obj.x / 32}, ${obj.y / 32} ) to '${objectGroup.name}'`); }
                // get object tile
                if (all_tileDict.hasOwnProperty(objname)) {
                    if (all_tileDict[objname].hasOwnProperty("tile")) {
                        if (verbose >= 1) { tiled.log(`tile found for '${objname}'`); }
                        obj.tile = all_tileDict[objname].tile;
                        obj.y += 32
                    }
                }
                objectGroup.addObject(obj);

            }
            return objectGroup;
        }

    }
    let layergroups = [];
    const new_allTileDict = {}


    for (let i in maps) { // get map array
        var map = maps[i];
        var importMapName;

        if (map.om_terrain) {
            importMapName = map.om_terrain
        }
        if (map.nested_mapgen_id) {
            importMapName = map.nested_mapgen_id
        }
        var layergroup = new GroupLayer(importMapName)
        let mapArray;
        tiled.log(`Working on map '${importMapName}'`)

        let new_mapEntries = []


        for(let property in map.object){
            if (map.om_terrain){
                if (mapLayerTypes.includes(property)){
                    let tiledLayer = new TileLayer(property)
                    for ( let y in map.object.rows){
                        let row = map.object.rows[y]
                        for (let x in row){
                            let symbol = row[x]
                            tiled.log(`found symbol '${symbol}'`)
                            if (map.object[property] && map.object[property][symbol]){
                                tiled.log(`looking for cddaId`)
                                let cddaId = chooseIdFromSymbolObject(property,map.object[property][symbol])
                                if(!cddaId){tiled.log(`cddaId not found`)}
                                if(cddaId){tiled.log(`cddaId '${cddaId}' found`)}
                                if(!new_allTileDict[cddaId]){
                                    new_allTileDict[cddaId].tile = new_getTileForCddaId(cddaId);
                                    // new_allTileDict[cddaId].id = id;
                                    // new_allTileDict[cddaId].filepath = filepath;
                                }

                                let tiledLayerEdit = tiledLayer.edit();
                                tiledLayerEdit.setTile( x, y, new_allTileDict[cddaId].tile )
                                tiledLayerEdit.apply()

                                // let newentry = {
                                //     'x': x,
                                //     'y': y,
                                //     'layer': property,
                                //     'cddaId': cddaId,
                                //     'tile': new_allTileDict[cddaId].tile,
                                //     'id': new_allTileDict[cddaId].id,
                                //     'filepath': new_allTileDict[cddaId].filepath
                                // }
                                // new_mapEntries.push(newentry);
                            }
                        }
                    }
                    layergroup.addLayer(tiledLayer);
                }
            }
        }
        layergroups.push(layergroup)
        continue;


        // find this map size
        if (map.object.mapgensize) {
            for (let y; y < map.object.mapgensize[1]; y++) {
                mapArray.push(" ".repeat(map.object.mapgensize[0]))
            }
        }
        if (map.object.rows) {
            mapArray = map.object.rows;
        }
        
        if (verbose >= 1) {
            tiled.log(`Original Map`)
            for (let row of mapArray) {
                tiled.log(row)
            }
        }


        // let mapPalette = new_buildTilePaletteDict(map); // TODO delete

        /**
         * Retrieves a dictionary of palette objects from a folder of palette files that
         * match the IDs specified in `map.palettes`.
         *
         * @param {any} paletteIds - The list of palette IDs to retrieve.
         * @returns {object} A dictionary of palette objects keyed by their ID.
         */
        function getPalettesJSON(paletteIds) {
            if (!paletteIds) {
            return;
            }
            if(typeof paletteIds === "string"){
                paletteIds = [paletteIds]
            }
        
            if (verbose >= 1) {
            tiled.log(`#### importing preset palette cdda ids`);
            }
        
            const paletteFilepaths = getRecursiveFilePathsInFolder(config.path_to_cdda_palettes);
            const paletteDict = {};
        
            for (const filepath of paletteFilepaths) {
            if (verbose >= 2) {
                tiled.log(`checking palette '${filepath}'`);
            }
        
            const file = new TextFile(filepath, TextFile.ReadOnly);
            file.codec = "UTF-8";
            const file_data = file.readAll();
            file.close();
        
            const paletteFileJSON = JSON.parse(file_data);
            

            for (let palette of paletteFileJSON) {
                if (palette.type !== "palette" || !paletteIds.filter((a) => {a == palette.id})) {
                    continue;
                }
                paletteDict[palette.id] = palette;
                }
            }
        
            return paletteDict;
        }
  

        // make dict of all tiles in use
        let all_tileDict = {}
        // all_tileDict.unknown = {}
        all_tileDict.unknown_tile = {}
        all_tileDict = prepareTileDict(map.object, all_tileDict)
        let mapPalettes = getPalettesJSON(map.object.palettes)
        for (let palette in mapPalettes) {
            all_tileDict = prepareTileDict(mapPalettes[palette], all_tileDict)
        }
        
        /**
         * Retrieves a dictionary of palette objects from a folder of palette files that
         * match the IDs specified in `map.palettes`.
         *
         * @param {Object} map - maps.map
         * @param {Object} dict - The list of palette IDs to retrieve.
         * @returns {object} A dictionary of palette objects keyed by their ID.
         */
        function prepareTileDict(map, dict) {
            if(!dict.idtotile){dict.idtotile = {}}
            for (let object in map) {
                if (object == "fill_ter") { dict[object.fill_ter] = {}; }
                if (no_id_objects.includes(object)) { continue; }
                for (let index in map[object]) {
                    // if(!symbols_in_use.includes(index)){continue;}
                    let entry = map[object][index]
                    if (object == "parameters") {
                        for (let meta_tiles in map[object]) {
                            dict[meta_tiles] = {}
                            dict[meta_tiles].symbol = index
                            dict.idtotile[meta_tiles] = {}
                        }
                    }

                    if (object == "terrain") {
                        if(!dict[object]){dict[object] = {}}
                        if (typeof entry === "string") {
                            dict[object][index] = {'cddaId': entry}
                            dict.idtotile[entry] = {}
                        }
                        if(entry.constructor.name === "Object"){
                            if (entry.param){
                                dict[object][index] = {'cddaId': entry.param}
                                dict.idtotile[entry.param] = {}
                            }
                        }
                        if (Array.isArray(entry)) {
                            for (let entr of cte.flattenArray(entry)) {
                                if (typeof entr == "string") {
                                    dict[object][index] = {'cddaId': entr}
                                    dict.idtotile[entr] = {}
                                }
                            }
                        }
                    }
                    if (object == "furniture") {
                        if(!dict[object]){dict[object] = {}}
                        if (typeof entry === "string") {
                            dict[object][index] = {'cddaId': entry}
                            dict.idtotile[entry] = {}
                        }
                        if (Array.isArray(entry)) {
                            for (let entr of cte.flattenArray(entry)) {
                                if (typeof entr == "string") {
                                    dict[object][index] = {'cddaId': entr}
                                    dict.idtotile[entr] = {}
                                }
                            }
                        }
                    }
                    if (object == "items") {
                        if(!dict[object]){dict[object] = {}}
                        if (Array.isArray(entry)) {
                            for (let entr of entry) {
                                dict[object][index] = {'cddaId': entr.item}
                                dict.idtotile[entr.item] = {}
                            }
                        } else {
                            dict[object][index] = {'cddaId': entry.item}
                            dict.idtotile[entry.item] = {}
                        }
                    }
                    if (object == "traps") {
                        if(!dict[object]){dict[object] = {}}
                        if (typeof entry === "string") {
                            dict[object][index] = {'cddaId': entry}
                            dict.idtotile[entry] = {}
                        }
                        if (Array.isArray(entry)) {
                            for (let entr of cte.flattenArray(entry)) {
                                if (typeof entr == "string") {
                                    dict[object][index] = {'cddaId': entr}
                                    dict.idtotile[entr] = {}
                                }
                            }
                        }
                    }
                    if (object == "place_loot") {
                        if(!dict[object]){dict[object] = {}}
                        if (entry.hasOwnProperty("item")) {
                            dict[object][entry.item] = {}
                            dict.idtotile[entry.item] = {}
                        }
                        if (entry.hasOwnProperty("group")) {
                            dict[object][entry.group] = {}
                            dict.idtotile[entry.group] = {}
                        }
                    }
                    if (object == "monster") {
                        if(!dict[object]){dict[object] = {}}
                        dict[object][entry.monster] = {}
                        dict.idtotile[entry.monster] = {}
                    }
                    if (object == "liquids") {
                        if(!dict[object]){dict[object] = {}}
                        dict[object][entry.liquid] = {}
                        dict.idtotile[entry.liquid] = {}
                    }
                    if (object == "vehicles") {
                        if(!dict[object]){dict[object] = {}}
                        dict[object][entry.vehicle] = {}
                        dict.idtotile[entry.vehicle] = {}
                    }
                    if (object == "place_items") {
                        if(!dict[object]){dict[object] = {}}
                        dict[object][entry.item] = {}
                        dict.idtotile[entry.item] = {}
                    }
                    if (object == "place_item") {
                        if(!dict[object]){dict[object] = {}}
                        dict[object][entry.item] = {}
                        dict.idtotile[entry.item] = {}
                    }
                    if (object == "place_zones") {
                        if(!dict[object]){dict[object] = {}}
                        dict[object][entry.item] = {}
                        dict.idtotile[entry.item] = {}
                    }
                    if (object == "place_fields") {
                        if(!dict[object]){dict[object] = {}}
                        dict[object][entry.field] = {}
                        dict.idtotile[entry.field] = {}
                    }
                    if (object == "place_monsters") {
                        if(!dict[object]){dict[object] = {}}
                        dict[object][entry.monster] = {}
                        dict.idtotile[entry.monster] = {}
                    }
                }
            }
            return dict
        }
        // function prepareTileDict(map, dict) { // old
        //     for (let object in map) {
        //         if (object == "fill_ter") { dict[object.fill_ter] = {}; }
        //         if (no_id_objects.includes(object)) { continue; }
        //         for (let index in map[object]) {
        //             // if(!symbols_in_use.includes(index)){continue;}
        //             let entry = map[object][index]
        //             if (object == "parameters") {
        //                 for (let meta_tiles in map[object]) {
        //                     dict[meta_tiles] = {}
        //                     dict[meta_tiles].symbol = index
        //                 }
        //             }

        //             if (object == "terrain") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 if (typeof entry === "string") {
        //                     dict[object][index] = {'cddaId': entry}
        //                     dict[entry] = {}
        //                     dict[entry].symbol = index
        //                     dict[entry].layer = object
        //                 }
        //                 if(entry.constructor.name === "Object"){
        //                     if (entry.param){
        //                         dict[object][index] = {'cddaId': entry.param}
        //                         dict[entry.param] = {}
        //                         dict[entry.param].symbol = index
        //                         dict[entry.param].layer = object
        //                     }
        //                 }
        //                 if (Array.isArray(entry)) {
        //                     for (let entr of cte.flattenArray(entry)) {
        //                         if (typeof entr == "string") {
        //                             dict[object][index] = {'cddaId': entr}
        //                             dict[entr] = {}
        //                             dict[entr].symbol = index
        //                             dict[entr].layer = object
        //                         }
        //                     }
        //                 }
        //             }
        //             if (object == "furniture") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 if (typeof entry === "string") {
        //                     dict[object][index] = {'cddaId': entry}
        //                     dict[entry] = {}
        //                     dict[entry].symbol = index
        //                     dict[entry].layer = object
        //                 }
        //                 if (Array.isArray(entry)) {
        //                     for (let entr of cte.flattenArray(entry)) {
        //                         if (typeof entr == "string") {
        //                             dict[object][index] = {'cddaId': entr}
        //                             dict[entr] = {}
        //                             dict[entr].symbol = index
        //                             dict[entr].layer = object
        //                         }
        //                     }
        //                 }
        //             }
        //             if (object == "items") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 if (Array.isArray(entry)) {
        //                     for (let entr of entry) {
        //                         dict[object][index] = {'cddaId': entr.item}
        //                         dict[entr.item] = {}
        //                         dict[entr.item].symbol = index
        //                         dict[entr.item].layer = object
        //                     }
        //                 } else {
        //                     dict[object][index] = {'cddaId': entry.item}
        //                     dict[entry.item] = {}
        //                     dict[entry.item].symbol = index
        //                     dict[entry.item].layer = object
        //                 }
        //             }
        //             if (object == "traps") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 if (typeof entry === "string") {
        //                     dict[object][index] = {'cddaId': entry}
        //                     dict[entry] = {}
        //                     dict[entry].symbol = index
        //                     dict[entry].layer = object
        //                 }
        //                 if (Array.isArray(entry)) {
        //                     for (let entr of cte.flattenArray(entry)) {
        //                         if (typeof entr == "string") {
        //                             dict[object][index] = {'cddaId': entr}
        //                             dict[entr] = {}
        //                             dict[entr].symbol = index
        //                             dict[entr].layer = object
        //                         }
        //                     }
        //                 }
        //             }
        //             if (object == "place_loot") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 if (entry.hasOwnProperty("item")) {
        //                     dict[entry.item] = {}
        //                     dict[entry.item].layer = object
        //                 }
        //                 if (entry.hasOwnProperty("group")) {
        //                     dict[entry.group] = {}
        //                     dict[entry.group].layer = object
        //                 }
        //             }
        //             if (object == "monster") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 dict[entry.monster] = {}
        //                 dict[entry.monster].layer = object
        //             }
        //             if (object == "liquids") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 dict[entry.liquid] = {}
        //                 dict[entry.liquid].layer = object
        //             }
        //             if (object == "vehicles") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 dict[entry.vehicle] = {}
        //                 dict[entry.vehicle].layer = object
        //             }
        //             if (object == "place_items") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 dict[entry.item] = {}
        //                 dict[entry.item].layer = object
        //             }
        //             if (object == "place_item") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 dict[entry.item] = {}
        //                 dict[entry.item].layer = object
        //             }
        //             if (object == "place_zones") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 dict[entry.item] = {}
        //                 dict[entry.item].layer = object
        //             }
        //             if (object == "place_fields") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 dict[entry.field] = {}
        //                 dict[entry.field].layer = object
        //             }
        //             if (object == "place_monsters") {
        //                 if(!dict[object]){dict[object] = {}}
        //                 dict[entry.monster] = {}
        //                 dict[entry.monster].layer = object
        //             }
        //         }
        //     }
        //     return dict
        // }
        delete all_tileDict.undefined
        if (verbose >= 1) { tiled.log(`all cdda_ids: '${Object.keys(all_tileDict)}'`); }

        // TODO guarantee special tilesets are generated?
        // get tile locations known for cdda ids in map
        let tilesetFilepaths = getRecursiveFilePathsInFolder(config.path_to_chosen_tileset_files);
        if (config.path_to_meta_tileset && File.exists(config.path_to_meta_tileset)) { tilesetFilepaths.push(config.path_to_meta_tileset) } // add meta tsj to the mix
        if (config.path_to_unknowns_tileset && File.exists(config.path_to_unknowns_tileset)) { tilesetFilepaths.push(config.path_to_unknowns_tileset) } // add unknown tsj to the mix

        for (let filepath of tilesetFilepaths) { // fill all tile dict
            if (FileInfo.suffix(filepath) !=`tsj`) { continue; };
            if(!cache[filepath]){
                cache[filepath] = {}
            }
            if(!cache[filepath].json){
                cache[filepath].json = JSONread(filepath) // filepath returns { tiles: { id: { class, probabiltiy, properties: { property: value }}}}
            }
            let tilesetJson = cache[filepath].json
            let tilesetname = FileInfo.baseName(filepath);

            for (let tile_i in tilesetJson.tiles) {
                let tile = tilesetJson.tiles[tile_i]
                for (let property_i in tile.properties) {
                    if (tile.properties[property_i].name != "cdda_id") { continue; }; // continue if not cdda id
                    let tile_cdda_id = tile.properties[property_i].value
                    all_tileDict.idtotile[tile_cdda_id]

                    
                    if (all_tileDict.idtotile[tile_cdda_id] || tile_cdda_id == "unknown_tile") {
                        if (all_tileDict.idtotile[tile_cdda_id].id) { continue; }
                        all_tileDict.idtotile[tile_cdda_id].id = tile.id
                        all_tileDict.idtotile[tile_cdda_id].filepath = filepath
                        if (verbose >= 1) { tiled.log(`adding '${tile_cdda_id}' with id '${all_tileDict.idtotile[tile_cdda_id].id}'to all_tileDict`) }
                    }
                }
            }
        }
        // for (let filepath of tilesetFilepaths) { // fill all tile dict
        //     if (FileInfo.suffix(filepath) !=`tsj`) { continue; };
        //     if(!cache[filepath]){
        //         cache[filepath] = {}
        //     }
        //     if(!cache[filepath].json){
        //         cache[filepath].json = JSONread(filepath) // filepath returns { tiles: { id: { class, probabiltiy, properties: { property: value }}}}
        //     }
        //     let tilesetJson = cache[filepath].json
        //     let tilesetname = FileInfo.baseName(filepath);

        //     for (let tile_i in tilesetJson.tiles) {
        //         let tile = tilesetJson.tiles[tile_i]
        //         for (let property_i in tile.properties) {
        //             if (tile.properties[property_i].name != "cdda_id") { continue; }; // continue if not cdda id
        //             let tile_cdda_id = tile.properties[property_i].value
                    
        //             if (all_tileDict[tile_cdda_id] || tile_cdda_id == "unknown_tile") {
        //                 if (all_tileDict[tile_cdda_id].id) { continue; }
        //                 all_tileDict[tile_cdda_id].id = tile.id
        //                 all_tileDict[tile_cdda_id].filepath = filepath
        //                 if (verbose >= 1) { tiled.log(`adding '${tile_cdda_id}' with id '${all_tileDict[tile_cdda_id].id}'to all_tileDict`) }
        //             }
        //         }
        //     }
        // }

        // get tile numbers, cdda IDs, and tilset file ??
        let mapArrays = {};
        let new_mapArrays = {};

        for (let entityLayerType of entityLayerTypes) {
            new_mapArrays[entityLayerType] = [];
        }
        for (let mapLayerType of mapLayerTypes) {
            new_mapArrays[mapLayerType] = [];
        }

        // get tiles
        let thiscache = {}
        // for (let cdda_id in all_tileDict) {
        //     if (!all_tileDict[cdda_id].filepath) { continue; } // continue if there is no filepath
        //     if (all_tileDict[cdda_id].tile) { continue; } // continue if tile property already defined
        //     const tilesetFilepath = all_tileDict[cdda_id].filepath
        //     let tileset;
        //     if (!thiscache[tilesetFilepath]) {
        //         thiscache[tilesetFilepath] = {}
        //     }
        //     if (!thiscache[tilesetFilepath].loadedTileset) {
        //         thiscache[tilesetFilepath].loadedTileset = tiled.open(tilesetFilepath)
        //     }
        //     tileset = thiscache[tilesetFilepath].loadedTileset
        //     all_tileDict[cdda_id].tile = tileset.findTile(all_tileDict[cdda_id].id)
        //     if (verbose >= 1) { tiled.log(`cdda id '${cdda_id}' has tile '${all_tileDict[cdda_id].tile}'`) }
        // }
        for (let cddaId in all_tileDict.idtotile) {

            if (!all_tileDict.idtotile[cddaId].filepath) { continue; } // continue if there is no filepath
            const tilesetFilepath = all_tileDict.idtotile[cddaId].filepath
            let tileset;
            if (!thiscache[tilesetFilepath]) {
                thiscache[tilesetFilepath] = {}
            }
            if (!thiscache[tilesetFilepath].loadedTileset) {
                thiscache[tilesetFilepath].loadedTileset = tiled.open(tilesetFilepath)
            }
            tileset = thiscache[tilesetFilepath].loadedTileset
            all_tileDict.idtotile[cddaId].tile = tileset.findTile(all_tileDict.idtotile[cddaId].id)
            if (verbose >= 1) { tiled.log(`cdda id '${cddaId}' has tile '${all_tileDict.idtotile[cddaId].tile}'`) }
        }
        for(let key in all_tileDict.idtotile){
            tiled.log(`alltiledict key: '${key}' tile: '${all_tileDict.idtotile[key].tile}'`)
        }

        // tiled.log(`in '${filepath}' tile id ${tile.id}`)

        /**
         * Retrieves a dictionary of palette objects from a folder of palette files that
         * match the IDs specified in `map.palettes`.
         *
         * @param {Object} map - map json
         * @param {String} layerType - name of layer type
         * 
         * @returns {Array} An array of objects [ { x, y, id, tile } ]
        */
        function getTilesForSymbolLocations(thisMap,layerType){
            let listOfLayerItems = []
            let allMapLayerEntries = {}
            let palettes;
            if(thisMap.object[layerType]){
                allMapLayerEntries = Object.assign({}, allMapLayerEntries, thisMap.object[layerType])
            }
            if(thisMap.object.palettes){
                palettes = getPalettesJSON(thisMap.object.palettes)
                for(let palette of thisMap.object.palettes){
                    if(palettes[palette][layerType]){
                        allMapLayerEntries = Object.assign({}, allMapLayerEntries, palettes[palette][layerType])
                    }
                }
            }
            tiled.log(`allMapLayerEntries`)
            tiled.log(allMapLayerEntries)
            for (let y in thisMap.object.rows){
                for (let x in thisMap.object.rows[y]){
                    const symbol = thisMap.object.rows[y][x]
                    let layerItem = {}

                    if(all_tileDict[layerType] && all_tileDict[layerType][symbol]){
                        layerItem.y = y
                        layerItem.x = x
                        layerItem.id = all_tileDict[layerType][symbol].cddaId
                        layerItem.tile = all_tileDict[all_tileDict[layerType][symbol].cddaId].tile
                    }

                    // // if(allMapLayerEntries[symbol]){
                    //     // let chosenid = chooseIdFromSymbolObject(allMapLayerEntries[symbol])
                    //     // let chosenid = allMapLayerEntries[symbol];
                    //     // if(typeof allMapLayerEntries[symbol] === "object" && allMapLayerEntries[symbol] != null){
                    //     //     chosenid = chooseIdFromSymbolObject(allMapLayerEntries[symbol])
                    //     // } 

                    //     if(typeof chosenid != "string"){
                    //         continue
                    //     }
                    //     layerItem.y = y
                    //     layerItem.x = x
                    //     if(!all_tileDict[chosenid]){
                    //         all_tileDict[chosenid] = {}
                    //         all_tileDict[chosenid].tile = add_cdda_id_to_unknowns(chosenid)
                    //         tiled.log(`Adding cdda id '${chosenid}' to unknowns. tile: '${all_tileDict[chosenid].tile}'`)
                    //         // all_tileDict[allMapLayerEntries[symbol]].id = all_tileDict[allMapLayerEntries[symbol]].tile.id
                    //     }
                    //     layerItem.id = chosenid
                    //     layerItem.tile = all_tileDict[chosenid].tile

                    // } else {
                    //     // tiled.log(`No cdda id found for symbol '${symbol}'`)
                    // }
                    if(layerItem){
                        listOfLayerItems.push(layerItem);
                    }
                }
            }
            return listOfLayerItems;
        }


        for (let entityLayerType of entityLayerTypes) {
            let newArray = getTilesForSymbolLocations(map, entityLayerType)
            for (let a in newArray){
                new_mapArrays[entityLayerType].push(newArray[a])
            }
        }
        for (let mapLayerType of mapLayerTypes) {
            let newArray = getTilesForSymbolLocations(map, mapLayerType)
            for (let a in newArray){
                new_mapArrays[mapLayerType].push(newArray[a])
            }
        }
        // tiled.log(`JSON.stringify(new_mapArrays)`)
        // for(let a in new_mapArrays){
        //     tiled.log(JSON.stringify(new_mapArrays[a]))

        // }

        // Prepare tiled layer
        function prepareTiledLayer(import_map, layername, all_tileDict) {

            // tile layers
            if (mapLayerTypes.includes(layername)) {
                let tileLayer = new TileLayer(layername);
                if (import_map.object.hasOwnProperty("mapgensize")) {
                    tileLayer.width = import_map.object.mapgensize[0];
                    tileLayer.height = import_map.object.mapgensize[1]
                }
                if (import_map.object.hasOwnProperty("rows")) {
                    tileLayer.width = import_map.object.rows[0].length;
                    tileLayer.height = import_map.object.rows.length
                }
                tileLayer.setProperty("cdda_layer", layername)
                let tileLayerEdit = tileLayer.edit()
                
                if (mapLayerTypes.includes(layername)) {
                    tiled.log(`editing layer ${tileLayerEdit.target.name}`)
                    for (let i in new_mapArrays[layername]) {
                        let entry = new_mapArrays[layername][i]
                        if (verbose >= 1) { tiled.log(`adding to layer: '${entry}' - ( ${mapArrays[layername][entry][0]}, ${mapArrays[layername][entry][1]} ) - ${mapArrays[layername][entry][2]}`) }
                        tileLayerEdit.setTile(parseInt(entry.x,10), parseInt(entry.y,10), entry.tile)
                    }
                }
                tileLayerEdit.apply();
                return tileLayer;
            }
            // entitiy layers
            if (entityLayerTypes.includes(layername)) {
                if (!import_map.object[layername]) {
                    // if (verbose >= 1) { tiled.log(`layer not present '${layername}'`); }
                    return
                }
                let objectGroup = new ObjectGroup(layername)
                if (import_map.object.hasOwnProperty("mapgensize")) {
                    objectGroup.width = import_map.object.mapgensize[0];
                    objectGroup.height = import_map.object.mapgensize[1]
                }
                if (import_map.object.hasOwnProperty("rows")) {
                    objectGroup.width = import_map.object.rows[0].length;
                    objectGroup.height = import_map.object.rows.length;
                }
                objectGroup.setProperty("cdda_layer", layername)
                // let oge = og.edit()
                if (verbose >= 1) { tiled.log(`editing layer '${objectGroup.name}' - '${layername}'`); }


                for (let entity of import_map.object[layername]) {
                    if (verbose >= 1) { tiled.log(`entity entry: '${cte.flattenDict(entity)}'`); }
                    let obj = new MapObject()
                    let x = entity.x
                    let y = entity.y
                    let objname;
                    // obj.tile = mapArrays[layername][entry][2]\

                    for (let property in entity) {
                        if (["x", "y", "monsters", "item", "vehicle"].includes(property)) {
                            continue;
                        }
                        obj.setProperty(property, entity[property])
                    }

                    // if(layername == "items"){objname = entity.item;}
                    if (layername == "place_fields") { objname = entity.field; }
                    if (layername == "place_item") { objname = entity.item; }
                    if (layername == "place_items") { objname = entity.item; }
                    if (layername == "place_vehicles") { objname = entity.vehicle; }
                    if (layername == "place_monsters") { objname = entity.monster; }
                    if (layername == "place_zones") { objname = entity.type; }
                    if (layername == "place_loot") {
                        if (entity.hasOwnProperty("item")) {
                            objname = entity.item;
                            obj.setProperty("group", false)
                        }
                        if (entity.hasOwnProperty("group")) {
                            objname = entity.group;
                            obj.setProperty("group", true)
                        }
                    }


                    obj.setProperty("cdda_id", objname)
                    obj.name = objname;
                    obj.width = Array.isArray(x) ? (x[1] - x[0] + 1) * 32 : 32
                    obj.height = Array.isArray(y) ? (y[1] - y[0] + 1) * 32 : 32
                    obj.x = Array.isArray(x) ? x[0] * 32 : x * 32
                    obj.y = Array.isArray(y) ? y[0] * 32 : y * 32
                    if (verbose >= 1) { tiled.log(`adding object '${obj.name}' at ( ${obj.x / 32}, ${obj.y / 32} ) to '${objectGroup.name}'`); }
                    // get object tile
                    if (all_tileDict.hasOwnProperty(objname)) {
                        if (all_tileDict[objname].hasOwnProperty("tile")) {
                            if (verbose >= 1) { tiled.log(`tile found for '${objname}'`); }
                            obj.tile = all_tileDict[objname].tile;
                            obj.y += 32
                        }
                    }
                    objectGroup.addObject(obj);

                }
                return objectGroup;
            }

            // setTile(x: number, y: number, tile: null | Tile, flags?: number): void
        }

        var layergroup = new GroupLayer(importMapName)


        // add palettes to properties layer
        if (map.object.hasOwnProperty("palettes")) {
            if (Array.isArray(map.object.palettes)) {
                for (let p in map.object.palettes) {
                    layergroup.setProperty("cdda_palette_" + p, map.object.palettes[p])
                }
            } else {
                layergroup.setProperty("cdda_palette_0", map.object.palettes)
            }
        }
        // add flags to properties layer
        for (let flag of flags) { layergroup.setProperty(flag, false); };
        if (map.object.hasOwnProperty("flags")) {
            if (Array.isArray(map.object.flags)) {
                for (let p in map.object.flags) {
                    layergroup.setProperty(map.object.flags[p], true);
                }
            } else {
                layergroup.setProperty(map.object.flags, true);
            }
        }
        // add fill_ter to properties layer
        if (map.object.hasOwnProperty("fill_ter")) {
            layergroup.setProperty("fill_ter", map.object.fill_ter, all_tileDict);
        }
        // if (layername == 'fill_ter'){tl.locked = true;}

        // if (map.object.hasOwnProperty("fill_ter")) {
        //     layergroup.addLayer(prepareTiledLayer(map, "fill_ter", all_tileDict));
        // };
        for (let mapLayerType of mapLayerTypes) {
            // if(import_map.object.hasOwnProperty(mapLayerType)){
            let layer = prepareTiledLayer(map, mapLayerType, all_tileDict)
            if (layer != undefined) {
                layergroup.addLayer(layer)
            }
            // }
        }
        for (let entityLayerType of entityLayerTypes) {
            if (map.object.hasOwnProperty(entityLayerType)) {
                let layer = prepareTiledLayer(map, entityLayerType, all_tileDict)
                if (layer != undefined) {
                    layergroup.addLayer(layer)
                }
            }
        }
        layergroups.push(layergroup)
    }

    for (let layerGroup in layergroups.reverse()) {
        tiledMap.addLayer(layergroups[layerGroup]);
    }
    tiledMap.setProperty("import_tileset", config.chosen_tileset)

    let path_to_maps = `${config.path_to_maps}/${FileInfo.baseName(filepath)}.tmj`
    for (let openAsset of tiled.openAssets) {
        if (originalOpenAssets.includes(openAsset)) { continue; }
        if (openAsset == tiledMap) { continue; }
        tiled.close(openAsset)
    }
    tiled.activeAsset = tiledMap
    if (config.snaptogrid) { tiled.trigger("SnapToGrid") }


}



function prepareTilemap(tmname = 'CDDA_map_24x24', mapsize = [24, 24]) {
    let tm = new TileMap()
    tm.setSize(mapsize[0], mapsize[1]);
    tm.setTileSize(32, 32);
    tm.orientation = TileMap.Orthogonal;
    if (verbose >= 1) { tiled.log(`tilemap name: ${tmname}`) }
    return tm
}

function buildTilePaletteDict(import_map) {
    tiled.log(`------- Palette Loading Area ---------`);

    function getPaletteFileData(mapFilePalettes, filepath) {
        if (verbose) { tiled.log(`checking palette '${filepath}'`); }
        const file = new TextFile(filepath, TextFile.ReadOnly)
        file.codec = "UTF-8"
        const file_data = file.readAll()
        file.close()
        let paletteFileJSON = JSON.parse(file_data)

        let thisPalette = {}
        for (let p of paletteFileJSON) {
            // let thisPalette = paletteFileData[p]
            // tiled.log(`palette id '${p['id']}'`)
            if (p['type'] != "palette") { continue; };
            if (mapFilePalettes.includes(p['id'])) {
                if (verbose) { tiled.log(`id '${p['id']}' found in ${FileInfo.fileName(filepath)}. Importing...`); }
                // mapPalette['terrain'] = Object.assign(mapPalette['terrain'], p['terrain']);
                for (let mapLayerType of mapLayerTypes) {
                    thisPalette[mapLayerType] = {}
                    for (let key in p[mapLayerType]) {
                        let temparray = []
                        // if string
                        if (typeof p[mapLayerType][key] === "string") {
                            thisPalette[mapLayerType][key] = p[mapLayerType][key]
                        }
                        // if array
                        if (Array.isArray(p[mapLayerType][key])) {
                            if (Array.isArray(p[mapLayerType][key][0])) {
                                temparray = []
                                for (let subarray of p[mapLayerType][key]) {
                                    (Array.isArray(subarray)) ? temparray.push(subarray[0]) : temparray.push(subarray);

                                }
                                thisPalette[mapLayerType][key] = temparray
                            } else {
                                thisPalette[mapLayerType][key] = p[mapLayerType][key]
                            }
                        }
                        // if object (dict)
                        if (p[mapLayerType][key].constructor == Object) {
                            if (p[mapLayerType][key].hasOwnProperty("param")) {
                                if (typeof p[mapLayerType][key].param === "string") {
                                    thisPalette[mapLayerType][key] = p[mapLayerType][key].param
                                }
                            }
                            if (p[mapLayerType][key].hasOwnProperty("switch")) {
                                if (p[mapLayerType][key].switch.hasOwnProperty("param")) {
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
    function getMapfileCustomPalette(import_map) {
        if (verbose) { tiled.log(`getting data from map file`); }
        let thisPalette = {}
        for (let mapLayerType of mapLayerTypes) {
            tiled.log(`map layer '${mapLayerType}'`)
            thisPalette[mapLayerType] = {}
            for (let key in import_map.object[mapLayerType]) {
                // if string
                if (typeof import_map.object[mapLayerType][key] === "string") {
                    thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key]
                    continue
                }
                // TODO import items as objects
                // if array
                if (Array.isArray(import_map.object[mapLayerType][key])) {
                    if(import_map.object[mapLayerType][key][0].hasOwnProperty("constructor")){
                        if(import_map.object[mapLayerType][key][0].constructor = Object){
                            if(import_map.object[mapLayerType][key][0].hasOwnProperty("item")){
                                thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][0].item
                                continue
                            }
                        }
                    }
                    if(Array.isArray(import_map.object[mapLayerType][key][0])){
                        if (typeof import_map.object[mapLayerType][key][0][0] === "string") {
                            thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][0][0]
                            continue
                        }
                    }
                    if (typeof import_map.object[mapLayerType][key][0] === "string") {
                        thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][0]
                        continue
                    }
                    continue
                    // thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key][Math.floor(Math.random() * import_map.object[mapLayerType][key].length)]
                }
                // if object
                if(import_map.object[mapLayerType][key].constructor = Object){
                    if(import_map.object[mapLayerType][key].hasOwnProperty("field")){
                        thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key].field
                        continue
                    }
                    if(import_map.object[mapLayerType][key].hasOwnProperty("monster")){
                        thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key].monster
                        continue
                    }
                    if(import_map.object[mapLayerType][key].hasOwnProperty("item")){
                        thisPalette[mapLayerType][key] = import_map.object[mapLayerType][key].item
                        continue
                    }
                }

                tiled.log(`custom key '${key}' > '${thisPalette[mapLayerType][key]}'\tadded to palette'${mapLayerType}'.`)
            }
        }
        return thisPalette;
    }

    // init map palette
    let mapPalette = {}
    let tempPaletteDict = {}
    for (let mapLayerType of mapLayerTypes) {
        mapPalette[mapLayerType] = {};
    };

    if (import_map.object.hasOwnProperty("palettes")) {
        tiled.log(`------- importing preset palette symbols ----`);
        let palettePaths = getRecursiveFilePathsInFolder(config.path_to_cdda_palettes);
        for (let filepath of palettePaths) {
            let tempPaletteDict = getPaletteFileData(import_map['object']['palettes'], filepath);
            for (let mapLayerType of mapLayerTypes) {
                for (let key in tempPaletteDict[mapLayerType]) {
                    if (Array.isArray(tempPaletteDict[mapLayerType][key])) {
                        mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]//[Math.floor(Math.random() * tempPaletteDict[mapLayerType][key].length)]
                    } else {
                        mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]
                    }
                    if (verbose) { tiled.log(`true assign '${key}' >> '${mapPalette[mapLayerType][key]}'`) }
                }
            }
        }
    }

    tiled.log(`------- importing mapfile symbols ---------`)
    tempPaletteDict = getMapfileCustomPalette(import_map);
    for (let mapLayerType of mapLayerTypes) {
        for (let key in tempPaletteDict[mapLayerType]) {
            mapPalette[mapLayerType][key] = tempPaletteDict[mapLayerType][key]
            if (verbose) { tiled.log(`true assign '${key}' >> ${mapPalette[mapLayerType][key]}`) }
        }
    }

    tiled.log(`------- mapfile total custom palette import results---------`)
    for (let mapLayerType of mapLayerTypes) {
        tiled.log(`mapLayerType: ${mapLayerType}`)
        for (let n in mapPalette[mapLayerType]) {
            tiled.log(`${n} > ${mapPalette[mapLayerType][n]}\t\tin palette'${mapLayerType}'.`)
        }
    }

    return mapPalette;
}

function chooseTilesetDialog(filepath) {
    if (!filepath) { return tiled.log("Action cancelled.") }

    let folder_list = cte.getFoldersInPath(filepath)
    tiled.log(folder_list)
    let response
    let dialog = new Dialog()
    dialog.windowTitle = "select a tileset"
    dialog.addLabel("Select a tileset from the list.", true)
    dialog.addNewRow()

    let selection = dialog.addComboBox(`Tilesets:`, folder_list)

    let cancelButton = dialog.addButton(`Cancel`);
    let acceptButton = dialog.addButton(`Select`);
    acceptButton.clicked.connect(function () {
        response = `${filepath}/${folder_list[selection.currentIndex]}`
        dialog.accept();
    })
    cancelButton.clicked.connect(function () {
        dialog.reject();
    })
    dialog.accepted.connect(() => {
    })
    dialog.show()
    dialog.exec()
    return response
}


/**
 * 
 * @param {string} filepath 
 * @returns {string} - filepath
 * @returns {Array.<object>} - selected maps of mapfile
 */
function importMapChoiceDialog(filepath) {
    // if([`linux`,`unix`,`macos`].includes(tiled.platform)){if(verbose >=1){tiled.log(`nix system`);};filepath = `/${filepath}`;}
    if (!filepath) { return tiled.log("Action cancelled.") }
    let cont = false
    let chosenEntries = []
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
Don't forget to SAVE YOUR MAP`, true)
    dialog.addNewRow()
    dialog.addSeparator(`Maps`)
    let mapEntriesToImport = {}
    for (let i in j) {
        if (j[i].type != "mapgen" || j[i].method != "json") { continue; }
        let name;
        let height;
        let width;
        let tooltiptext;
        if (j[i].hasOwnProperty(`om_terrain`)) {
            name = j[i].om_terrain
        }
        if (j[i].hasOwnProperty(`nested_mapgen_id`)) {
            name = j[i].nested_mapgen_id
        }
        if (verbose >= 1) { tiled.log(`pre-loading map '${name}'`); }
        if (j[i].object.hasOwnProperty(`mapgensize`)) {
            height = j[i].object.mapgensize[1]
            width = j[i].object.mapgensize[0]
            tooltiptext = `No preview for map type 'mapgensize'`
        }
        if (j[i].object.hasOwnProperty(`rows`)) {
            height = j[i].object.rows.length
            width = j[i].object.rows[0].length
            tooltiptext = JSON.stringify(j[i].object.rows).replace(/,/g, "\n").replace(/[\[\]]/g, "")
        }
        // if(j[i].object.rows.length < 1){continue;}
        let checkboxdisplay = `${name}`.length < 63 ? name : `${name}`.slice(0, 60) + "..."
        if (j[i].hasOwnProperty(`nested_mapgen_id`)) {
            checkboxdisplay = `[n] ${checkboxdisplay}`
        };
        let checkbox = dialog.addCheckBox(`${checkboxdisplay} (${width}x${height})`, true)
        checkbox.toolTip = tooltiptext

        if (j[i].hasOwnProperty(`om_terrain`)) {
            mapEntriesToImport[j[i].om_terrain] = {
                "index": i,
                "checkbox": checkbox,
                "entry": j[i]
            }
        }
        if (j[i].hasOwnProperty(`nested_mapgen_id`)) {
            mapEntriesToImport[j[i].nested_mapgen_id] = {
                "index": i,
                "checkbox": checkbox,
                "entry": j[i]
            }
        }
        // mapEntriesToImport.push(entry)
        dialog.addNewRow()
    }
    let backButton = dialog.addButton(`Back`);
    backButton.clicked.connect(() => {
        dialog.reject();
    })
    // dialog.rejected.connect(() => {
    //     importMapChoiceDialog(cte.filePicker(filepath))
    // })

    let acceptButton = dialog.addButton(`Accept`);
    let cancelButton = dialog.addButton(`Cancel`);
    acceptButton.clicked.connect(function () {
        dialog.accept();
    })
    cancelButton.clicked.connect(function () {
        dialog.reject();
    })
    dialog.accepted.connect(() => {
        chosenEntries = []
        let testentries = []
        for (let entry in mapEntriesToImport) {
            // tiled.log(mapEntriesToImport[entry].checkbox.checked)
            if (mapEntriesToImport[entry].checkbox.checked) {
                chosenEntries.push(mapEntriesToImport[entry].entry)
                testentries.push(mapEntriesToImport[entry].index)
            }
        }
        cont = true
    })
    dialog.show();
    dialog.exec();
    return cont ? [removeFileStringFromFileUrl(filepath), chosenEntries] : false;
}
function importMap(filepath, j) {
    if (!filepath) { return tiled.log("Action cancelled.") }
    let choiceresult = importMapChoiceDialog(filepath)
    if (!choiceresult) { return tiled.log("Action cancelled.") }
    [filepath, j] = choiceresult
    let originalOpenAssets = tiled.openAssets
    config.pathToLastImportMap = filepath;
    cte.updateConfig();
    tiled.log(`Importing '${filepath}'`)

    //read map file
    let f = new TextFile(filepath, TextFile.ReadOnly);
    f.codec = "UTF-8"
    let c = f.readAll();
    f.close();
    let old_j = JSON.parse(c);
    let tm;
    let mapwidth = 0
    let mapheight = 0
    for (let i in j) { // find valid entry for size
        let xy;
        let name;
        if (j[i].object.hasOwnProperty("rows")) {
            xy = [j[i].object.rows[0].length, j[i].object.rows.length]
        }
        if (j[i].object.hasOwnProperty("mapgensize")) {
            xy = j[i].object.mapgensize
        }
        if (j[i].type != "mapgen" || j[i].method != "json") { continue; } // must be mapgen and json
        if (xy[0] > mapwidth) { mapwidth = xy[0] }
        if (xy[1] > mapheight) { mapheight = xy[1] }
        if (j[i].hasOwnProperty("om_terrain")) {
            name = j[i].om_terrain
        }
        if (j[i].hasOwnProperty(`nested_mapgen_id`)) {
            name = j[i].nested_mapgen_id
        }
        tm = prepareTilemap(name, [mapwidth, mapheight])
        break;
    }

    let layergroups = [];

    for (let i in j) {
        if (j[i].type != "mapgen" || j[i].method != "json") { continue; } // must be mapgen and json
        var import_map = j[i];

        var importMapName;

        if (j[i].hasOwnProperty("om_terrain")) {
            importMapName = j[i].om_terrain
        }
        if (j[i].hasOwnProperty(`nested_mapgen_id`)) {
            importMapName = j[i].nested_mapgen_id
        }
        // var importMapSize = import_map.object.rows[0].length;
        let mapArray;
        tiled.log(`Working on map '${importMapName}'`)
        // check if has fill_ter, TODO remove later
        if (import_map.object.hasOwnProperty("fill_ter")) { if (verbose >= 1) { tiled.log(`Has fill_ter: ${import_map.object.fill_ter}`); }; }

        // find map size
        if (import_map.object.hasOwnProperty("mapgensize")) {
            for (let y; y < import_map.object.mapgensize[1]; y++) {
                mapArray.push(" ".repeat(import_map.object.mapgensize[0]))
            }
        }
        if (import_map.object.hasOwnProperty("rows")) {
            mapArray = import_map.object.rows;
        }

        // init mapPallete
        let mapPalette = buildTilePaletteDict(import_map);

        if (verbose >= 1) {
            tiled.log(`Original Map`)
            for (let row of mapArray) {
                tiled.log(row)
            }
        }
        function getPalettesJSON(map) {
            if (!map.hasOwnProperty("palettes")) { return; }
            if (verbose >= 1) { tiled.log(`#### importing preset palette cdda ids`); }

            let palettePaths = getRecursiveFilePathsInFolder(config.path_to_cdda_palettes);
            let tempPaletteDict = {}
            for (let filepath of palettePaths) {
                if (verbose >= 2) { tiled.log(`checking palette '${filepath}'`); }
                const file = new TextFile(filepath, TextFile.ReadOnly)
                file.codec = "UTF-8"
                const file_data = file.readAll()
                file.close()
                let paletteFileJSON = JSON.parse(file_data)
                for (let palette of paletteFileJSON) {
                    if (palette.type != "palette" || !map.palettes.includes(palette.id)) { continue; };
                    tempPaletteDict[palette.id] = palette
                }
            }
            return tempPaletteDict
        }

        // make dict of all tiles in use
        let all_tileDict = {}
        // all_tileDict.unknown = {}
        all_tileDict.unknown_tile = {}
        all_tileDict = fillTileDict(import_map.object, all_tileDict)
        let mapPalettes = getPalettesJSON(import_map.object)
        for (let palette in mapPalettes) {
            all_tileDict = fillTileDict(mapPalettes[palette], all_tileDict)
        }
        function fillTileDict(map, dict) {
            for (let obj in map) {
                if (obj == "fill_ter") { dict[obj.fill_ter] = {}; }
                if (no_id_objects.includes(obj)) { continue; }
                for (let index in map[obj]) {
                    // if(!symbols_in_use.includes(index)){continue;}
                    let entry = map[obj][index]
                    if (obj == "parameters") {
                        for (let meta_tiles in map[obj]) {
                            dict[meta_tiles] = {}
                        }
                    }

                    if (obj == "terrain") {
                        if (typeof entry === "string") {
                            dict[entry] = {}
                        }
                        if (Array.isArray(entry)) {
                            for (let entr of cte.flattenArray(entry)) {
                                if (typeof entr == "string") {
                                    dict[entr] = {}
                                }
                            }
                        }
                    }
                    if (obj == "furniture") {
                        if (typeof entry === "string") {
                            dict[entry] = {}
                        }
                        if (Array.isArray(entry)) {
                            for (let entr of cte.flattenArray(entry)) {
                                if (typeof entr == "string") {
                                    dict[entr] = {}
                                }
                            }
                        }
                    }
                    if (obj == "items") {
                        if (Array.isArray(entry)) {
                            for (let entr of entry) {
                                dict[entr.item] = {}
                            }
                        } else {
                            dict[entry.item] = {}
                        }
                    }
                    if (obj == "traps") {
                        if (typeof entry === "string") {
                            dict[entry] = {}
                        }
                        if (Array.isArray(entry)) {
                            for (let entr of cte.flattenArray(entry)) {
                                if (typeof entr == "string") {
                                    dict[entr] = {}
                                }
                            }
                        }
                    }
                    if (obj == "place_loot") {
                        if (entry.hasOwnProperty("item")) {
                            dict[entry.item] = {}
                        }
                        if (entry.hasOwnProperty("group")) {
                            dict[entry.group] = {}
                        }
                    }
                    if (obj == "monster") {
                        dict[entry.monster] = {}
                    }
                    if (obj == "liquids") {
                        dict[entry.liquid] = {}
                    }
                    if (obj == "vehicles") {
                        dict[entry.vehicle] = {}
                    }
                    if (obj == "place_items") {
                        dict[entry.item] = {}
                    }
                    if (obj == "place_item") {
                        dict[entry.item] = {}
                    }
                    if (obj == "place_zones") {
                        dict[entry.item] = {}
                    }
                    if (obj == "place_fields") {
                        dict[entry.field] = {}
                    }
                    if (obj == "place_monsters") {
                        dict[entry.monster] = {}
                    }
                }
            }
            return dict
        }
        delete all_tileDict.undefined
        if (verbose >= 1) { tiled.log(`all cdda_ids: '${Object.keys(all_tileDict)}'`); }


        // get tile locations known for cdda ids in map
        let tsjs = getRecursiveFilePathsInFolder(config.path_to_chosen_tileset_files);
        if (config.hasOwnProperty(`path_to_meta_tileset`) && File.exists(config.path_to_meta_tileset)) { tsjs.push(config.path_to_meta_tileset) } // add meta tsj to the mix
        if (config.hasOwnProperty(`path_to_unknowns_tileset`) && File.exists(config.path_to_unknowns_tileset)) { tsjs.push(config.path_to_unknowns_tileset) } // add unknown tsj to the mix

        for (let filepath of tsjs) {
            if (!filepath.match(/\.tsj$/)) { continue; };

            let tsjTiles = JSONread(filepath) // filepath returns { tiles: { id: { class, probabiltiy, properties: { property: value }}}}
            let tilesetname = FileInfo.baseName(filepath);

            for (let tile_i in tsjTiles.tiles) {
                let _this_tile = tsjTiles.tiles[tile_i]
                for (let property_i in _this_tile.properties) {
                    let _this_property = _this_tile.properties[property_i]
                    if (_this_property.name != "cdda_id") { continue; }; // continue if no cdda id
                    let tile_cdda_id = _this_property.value

                    if (tile_cdda_id == "unknown_tile") {
                        all_tileDict[tile_cdda_id].id = _this_tile.id
                        all_tileDict[tile_cdda_id].filepath = filepath
                        if (verbose >= 1) { tiled.log(`adding '${tile_cdda_id}' with id '${all_tileDict[tile_cdda_id].id}'to all_tileDict`) }
                        continue
                    }
                    if (all_tileDict.hasOwnProperty(tile_cdda_id)) {
                        if (all_tileDict[tile_cdda_id].hasOwnProperty("id")) { continue; }
                        all_tileDict[tile_cdda_id].id = _this_tile.id
                        all_tileDict[tile_cdda_id].filepath = filepath
                        if (verbose >= 1) { tiled.log(`adding '${tile_cdda_id}' with id '${all_tileDict[tile_cdda_id].id}'to all_tileDict`) }
                    }
                }
            }
        }

        // get tile numbers, cdda IDs, and tilset file ??
        let mapArrays = {};


        // get tiles
        for (let cdda_id in all_tileDict) {
            if (all_tileDict[cdda_id].filepath === undefined) { continue; }
            let tileset;
            if (all_tileDict[cdda_id].hasOwnProperty("tile")) { continue; }
            if (!cache.hasOwnProperty(all_tileDict[cdda_id].filepath)) {
                cache[all_tileDict[cdda_id].filepath] = tiled.open(all_tileDict[cdda_id].filepath)
                if (verbose >= 1) { tiled.log(`adding '${all_tileDict[cdda_id].filepath}' to tileset cache`) }
            }
            tileset = cache[all_tileDict[cdda_id].filepath]
            all_tileDict[cdda_id].tile = tileset.findTile(all_tileDict[cdda_id].id)
            if (verbose >= 1) { tiled.log(`cdda id '${cdda_id}' has tile '${all_tileDict[cdda_id].tile}'`) }
        }


        for (let entityLayerType of entityLayerTypes) {
            if (verbose >= 1) { tiled.log(`mapArrays["${entityLayerType}"]`); }
            for (let e in mapArrays[entityLayerType]) {
                if (verbose >= 1) { tiled.log(`${mapArrays[entityLayerType][e]}`); }
            };
        };

        function prepareEntitiesArrayForTiled(import_map, entityLayerType, all_tileDict) {
            if (mapArrays.hasOwnProperty(entityLayerType)) {
                let tMapArray = mapArrays[entityLayerType]

                for (let entry in mapArrays[entityLayerType]) {
                    if (all_tileDict.hasOwnProperty(mapArrays[entityLayerType][entry][2])) {
                        if (verbose >= 2) { tiled.log(`( ${tMapArray[entry][0]}, ${tMapArray[entry][1]} ) '${mapArrays[entityLayerType][entry][2]}' > '${all_tileDict[mapArrays[entityLayerType][entry][2]]}'`) }
                        tMapArray[entry][2] = all_tileDict[mapArrays[entityLayerType][entry][2]].tile
                    } else {
                        if (verbose) { tiled.log(`Entity '${mapArrays[entityLayerType][entry][2]}' not found in tile dictionary`); }
                        continue;
                    }
                }
                return tMapArray
            }
        }
        // prepare map for tiled
        function prepareMapArrayForTiled(import_map, mapLayerName, all_tileDict) {
            if (verbose >= 1) { tiled.log(`working on map layer '${mapLayerName}'`); }
            // if (mapLayerName == "fill_ter"){return;};
            let tMapArray = []
            if (!mapPalette.hasOwnProperty(mapLayerName) && mapLayerName != "fill_ter") { tiled.log(`missing ${mapLayerName}`); return; }
            for (let y in mapArray) {
                for (let x in mapArray[y]) {
                    let thiscell = mapArray[y][x]
                    let newcell = 0
                    // terrain fill
                    if (mapLayerName == "fill_ter" && import_map.object.hasOwnProperty("fill_ter")) {
                        if (all_tileDict.hasOwnProperty(import_map.object.fill_ter)) {
                            if (verbose >= 3) { tiled.log(`( ${x}, ${y} ) - fill_ter: '${import_map.object.fill_ter}'`); }
                            newcell = all_tileDict[import_map.object.fill_ter].tile
                            tMapArray.push([x, y, newcell])
                            continue;
                        };
                        continue;
                    };
                    // if(thiscell === " "){continue;}
                    if (mapPalette[mapLayerName][thiscell] === undefined) { continue; };
                    // items
                    if (mapLayerName == "items" && import_map.object.hasOwnProperty("items")) {
                        if (verbose >= 1) { tiled.log(`( ${x}, ${y} ) - item: '${mapPalette[mapLayerName][thiscell].item}'`); }
                        let entries = []

                        if (all_tileDict.hasOwnProperty(mapPalette[mapLayerName][thiscell].item)) {
                            if (verbose >= 1) { tiled.log(`( ${x}, ${y} ) - item: '${mapPalette[mapLayerName][thiscell].item}'`); }
                            newcell = all_tileDict[mapPalette[mapLayerName][thiscell].item].tile
                            tMapArray.push([x, y, newcell])
                            continue;
                        }
                        continue;
                    }

                    if (mapPalette[mapLayerName].hasOwnProperty(thiscell)) {
                        if (typeof mapPalette[mapLayerName][thiscell] === "object") {
                            let entry = mapPalette[mapLayerName][thiscell]
                            for (let e of entry) {
                                if (all_tileDict.hasOwnProperty(e)) {
                                    if (verbose >= 1) { tiled.log(`\t( ${x}, ${y} )\tAssigning ID '${e}' TO SYMBOL '${thiscell}'`); }
                                    newcell = all_tileDict[e].tile
                                    break;
                                }
                            }
                        } else {
                            if (all_tileDict.hasOwnProperty(mapPalette[mapLayerName][thiscell])) {
                                newcell = all_tileDict[mapPalette[mapLayerName][thiscell]].tile
                                if (all_tileDict[mapPalette[mapLayerName][thiscell]].tile == undefined) {
                                    if (all_tileDict.hasOwnProperty("unknown_tile")) {
                                        tiled.log(`unknown tile to be assigned to cdda id '${mapPalette[mapLayerName][thiscell]}'`)
                                        // all_tileDict.unknown_tile.tile = add_cdda_id_to_unknowns(mapPalette[mapLayerName][thiscell])
                                        newcell = add_cdda_id_to_unknowns(mapPalette[mapLayerName][thiscell])
                                        // tMapArray.push([x,y,newcell])
                                        // continue;
                                    }
                                    // newcell = all_tileDict.unknown_tile.tile
                                }
                                if (verbose >= 1) { tiled.log(`\t( ${x}, ${y} )\tAssigning ID '${mapPalette[mapLayerName][thiscell]}' TO symbol '${thiscell}' with tile '${newcell}'`); }
                            } else {
                                if (verbose >= 2) { tiled.log(`no sprite for ${mapPalette[mapLayerName][thiscell]}`) }
                            }
                        }
                        if (verbose >= 2) { tiled.log(`( ${x}, ${y} ) '${thiscell}' > '${mapPalette[mapLayerName][thiscell]}' - '${newcell}'`) }
                        tMapArray.push([x, y, newcell])
                        continue;
                    } else {
                        if (all_tileDict.hasOwnProperty("unknown_tile")) {
                            tiled.log(`unknown tile assigned to cdda id.`)
                            // all_tileDict.unknown_tile.tile = add_cdda_id_to_unknowns(mapPalette[mapLayerName][thiscell])
                            newcell = add_cdda_id_to_unknowns(mapPalette[mapLayerName][thiscell])
                            tMapArray.push([x, y, newcell])
                            continue;
                        }
                    }
                }
            }
            return tMapArray;
        }

        if (import_map.object.hasOwnProperty("fill_ter")) {
            mapArrays["fill_ter"] = prepareMapArrayForTiled(import_map, "fill_ter", all_tileDict)
        }
        for (let mapLayerType of mapLayerTypes) {
            tiled.log(`preparing map array for layer '${mapLayerType}'`)
            mapArrays[mapLayerType] = prepareMapArrayForTiled(import_map, mapLayerType, all_tileDict)
        }

        for (let layerType in import_map.object) {
            if (no_id_objects.concat(mapLayerTypes).some(a => a === layerType)) { continue }
            tiled.log(`preparing object array for layer ${layerType}`)
            mapArrays[layerType] = prepareEntitiesArrayForTiled(import_map, layerType, all_tileDict)
        }


        // Prepare tiled layer
        function prepareTiledLayer(import_map, layername, all_tileDict) {

            // tile layers
            if (mapLayerTypes.some(a => a === layername) || layername == "fill_ter") {
                let tl = new TileLayer(layername);
                if (import_map.object.hasOwnProperty("mapgensize")) {
                    tl.width = import_map.object.mapgensize[0];
                    tl.height = import_map.object.mapgensize[1]
                }
                if (import_map.object.hasOwnProperty("rows")) {
                    tl.width = import_map.object.rows[0].length;
                    tl.height = import_map.object.rows.length
                }
                tl.setProperty("cdda_layer", layername)
                let tle = tl.edit()
                tiled.log(`editing layer ${tle.target.name}`)
                if (layername == "fill_ter" && all_tileDict.hasOwnProperty(import_map.object.fill_ter)) {
                    // tiled.log(`fill_ter mapentry: '${mapArrays["fill_ter"]}'`)
                    tl.setProperty("cdda_id", import_map.object.fill_ter)
                    for (let entry in mapArrays["fill_ter"]) {
                        if (verbose >= 1) { tiled.log(`( ${mapArrays["fill_ter"][entry][0]}, ${mapArrays["fill_ter"][entry][1]} ) - ${mapArrays["fill_ter"][entry][2]}`) }
                        tle.setTile(parseInt(mapArrays["fill_ter"][entry][0],10), parseInt(mapArrays["fill_ter"][entry][1],10), mapArrays["fill_ter"][entry][2])
                    }
                    tle.apply();
                    return tl;
                }

                if (mapLayerTypes.includes(layername)) {
                    for (let entry in mapArrays[layername]) {
                        if (verbose >= 1) { tiled.log(`adding to layer: '${entry}' - ( ${mapArrays[layername][entry][0]}, ${mapArrays[layername][entry][1]} ) - ${mapArrays[layername][entry][2]}`) }
                        tle.setTile(parseInt(mapArrays[layername][entry][0],10), parseInt(mapArrays[layername][entry][1],10), mapArrays[layername][entry][2])
                    }
                }
                tle.apply();
                return tl;
            }
            // entitiy layers
            if (entityLayerTypes.some(a => a === layername)) {
                if (!import_map.object.hasOwnProperty(layername)) {
                    if (verbose >= 1) { tiled.log(`layer not present '${layername}'`); }
                    return
                }
                let og = new ObjectGroup(layername)
                if (import_map.object.hasOwnProperty("mapgensize")) {
                    og.width = import_map.object.mapgensize[0];
                    og.height = import_map.object.mapgensize[1]
                }
                if (import_map.object.hasOwnProperty("rows")) {
                    og.width = import_map.object.rows[0].length;
                    og.height = import_map.object.rows.length;
                }
                og.setProperty("cdda_layer", layername)
                // let oge = og.edit()
                if (verbose >= 1) { tiled.log(`editing layer '${og.name}' - '${layername}'`); }


                for (let entity of import_map.object[layername]) {
                    if (verbose >= 1) { tiled.log(`entity entry: '${cte.flattenDict(entity)}'`); }
                    let obj = new MapObject()
                    let x = entity.x
                    let y = entity.y
                    let objname;
                    // obj.tile = mapArrays[layername][entry][2]\

                    for (let property in entity) {
                        if (["x", "y", "monsters", "item", "vehicle"].includes(property)) {
                            continue;
                        }
                        obj.setProperty(property, entity[property])
                    }

                    // if(layername == "items"){objname = entity.item;}
                    if (layername == "place_fields") { objname = entity.field; }
                    if (layername == "place_item") { objname = entity.item; }
                    if (layername == "place_items") { objname = entity.item; }
                    if (layername == "place_vehicles") { objname = entity.vehicle; }
                    if (layername == "place_monsters") { objname = entity.monster; }
                    if (layername == "place_zones") { objname = entity.type; }
                    if (layername == "place_loot") {
                        if (entity.hasOwnProperty("item")) {
                            objname = entity.item;
                            obj.setProperty("group", false)
                        }
                        if (entity.hasOwnProperty("group")) {
                            objname = entity.group;
                            obj.setProperty("group", true)
                        }
                    }


                    obj.setProperty("cdda_id", objname)
                    obj.name = objname;
                    obj.width = Array.isArray(x) ? (x[1] - x[0] + 1) * 32 : 32
                    obj.height = Array.isArray(y) ? (y[1] - y[0] + 1) * 32 : 32
                    obj.x = Array.isArray(x) ? x[0] * 32 : x * 32
                    obj.y = Array.isArray(y) ? y[0] * 32 : y * 32
                    if (verbose >= 1) { tiled.log(`adding object '${obj.name}' at ( ${obj.x / 32}, ${obj.y / 32} ) to '${og.name}'`); }
                    // get object tile
                    if (all_tileDict.hasOwnProperty(objname)) {
                        if (all_tileDict[objname].hasOwnProperty("tile")) {
                            if (verbose >= 1) { tiled.log(`tile found for '${objname}'`); }
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
        if (import_map.object.hasOwnProperty("palettes")) {
            if (Array.isArray(import_map.object.palettes)) {
                for (let p in import_map.object.palettes) {
                    layergroup.setProperty("cdda_palette_" + p, import_map.object.palettes[p])
                }
            } else {
                layergroup.setProperty("cdda_palette_0", import_map.object.palettes)
            }
        }
        // add flags to properties layer
        for (let flag of flags) { layergroup.setProperty(flag, false); };
        if (import_map.object.hasOwnProperty("flags")) {
            if (Array.isArray(import_map.object.flags)) {
                for (let p in import_map.object.flags) {
                    layergroup.setProperty(import_map.object.flags[p], true);
                }
            } else {
                layergroup.setProperty(import_map.object.flags, true);
            }
        }
        // add fill_ter to properties layer
        if (import_map.object.hasOwnProperty("fill_ter")) {
            layergroup.setProperty("fill_ter", import_map.object.fill_ter, all_tileDict);
        }
        // if (layername == 'fill_ter'){tl.locked = true;}

        if (import_map.object.hasOwnProperty("fill_ter")) {
            layergroup.addLayer(prepareTiledLayer(import_map, "fill_ter", all_tileDict));
        };
        for (let mapLayerType of mapLayerTypes) {
            // if(import_map.object.hasOwnProperty(mapLayerType)){
            let layer = prepareTiledLayer(import_map, mapLayerType, all_tileDict)
            if (layer != undefined) {
                layergroup.addLayer(layer)
            }
            // }
        }
        for (let entityLayerType of entityLayerTypes) {
            if (import_map.object.hasOwnProperty(entityLayerType)) {
                let layer = prepareTiledLayer(import_map, entityLayerType, all_tileDict)
                if (layer != undefined) {
                    layergroup.addLayer(layer)
                }
            }
        }
        layergroups.push(layergroup)
    }

    for (let lg in layergroups.reverse()) {
        tm.addLayer(layergroups[lg]);
    }
    tm.setProperty("import_tileset", config.chosen_tileset)

    let path_to_maps = `${config.path_to_maps}/${FileInfo.baseName(filepath)}.tmj`
    for (let openAsset of tiled.openAssets) {
        if (originalOpenAssets.includes(openAsset)) { continue; }
        if (openAsset == tm) { continue; }
        tiled.close(openAsset)
    }
    tiled.activeAsset = tm
    if (config.snaptogrid) { tiled.trigger("SnapToGrid") }
    // let outputFileResults = tiled.mapFormat("tmj").write(tm, path_to_maps);
    // let outputFileResults = writeToFile(path_to_maps,tm);
    // (outputFileResults == null) ? tiled.log(FileInfo.baseName(pathToMap) + " file created successfully.") : tiled.log(FileInfo.baseName(pathToMap) + " - FAILED to create file. Error: " + outputFileResults)
    // tiled.open(path_to_maps);
}
function addNewOmTerrainToMap() {
    return tiled.activeAsset.isTileMap ? tiled.activeAsset.addLayer(makeNewOmTerrain([tiled.activeAsset.width, tiled.activeAsset.height])) : tiled.log(`No tilemap found to add layer.`)
}
function makeNewOmTerrain([width, height]) {
    width = parseInt(width, 10)
    height = parseInt(height, 10)
    let layergroup = new GroupLayer("My_om_terrain")
    for (let prop of ["cdda_palette_0", "fill_ter"]) {
        layergroup.setProperty(prop, "")
    }
    for (let flag of flags) {
        layergroup.setProperty(flag, false)
    }
    for (let layertype of mapLayerTypes) {
        let layer = new TileLayer(layertype)
        layer.setProperty("cdda_layer", layertype)
        layer.width = width
        layer.height = height
        layergroup.addLayer(layer)
    }
    for (let layertype of entityLayerTypes) {
        let layer = new ObjectGroup(layertype)
        layer.setProperty("cdda_layer", layertype)
        layer.width = width
        layer.height = height
        layergroup.addLayer(layer)
    }
    return layergroup
}
function makeEmptyMap() {
    let mapsize = tiled.prompt("Map is square. Length of side in tiles:", 24, "Map Size")

    let tmname = `CDDA_map_${mapsize}x${mapsize}`
    let tm = prepareTilemap(tmname, [mapsize, mapsize]);
    tm.addLayer(makeNewOmTerrain([mapsize, mapsize]))
    
    
    // tiled.activeAsset = tm
    let filepath = `${config.path_to_maps}/${tmname}.tmj`
    // return tiled.log(filepath)
    tiled.mapFormat("json").write(tm, filepath);
    if (config.snaptogrid) { tiled.trigger("SnapToGrid") }
    tiled.open(filepath)
}

function exportMap(map) {
    initialize();
    // tiled.log(tiled.openAssets)
    if (!tiled.activeAsset.isTileMap) { return tiled.log(`Not on a valid tilemap.`); }
    const currentMap_tm = tiled.activeAsset // get current map


    let mapEntries = []


    // prepare layer group (entry)
    function prepareEntry(layer) { // layer is om_terrain
        if (verbose) { tiled.log(`\nworking on layer '${layer.name}'`); }
        let mapEntry = new CDDAMapEntry(currentMap_tm.fileName)
        mapEntry["om_terrain"] = layer.name

        // palettes
        if (Object.keys(layer.properties()).includes("cdda_palette_0")) {
            if (verbose >= 1) { tiled.log(`'${layer.name}' has palettes.`); };
            for (let p of Object.keys(layer.properties())) {
                if (p.match(/palette/)) {
                    if (verbose >= 1) { tiled.log(`'${layer.name}' has palette '${layer.properties()[p]}'`); };
                    mapEntry.object.palettes.push(layer.properties()[p]);
                };
            };
        };
        // fill_ter
        if (Object.keys(layer.properties()).includes("fill_ter")) {
            mapEntry.object.fill_ter = layer.property("fill_ter")
        };
        // flags
        for (let flag of flags) {
            if (Object.keys(layer.properties()).includes(flag)) {
                if (layer.properties()[flag] == true) {
                    mapEntry.object.flags.push(flag);
                };
            };
        };

        // find assigned palettes
        var loaded_palettes = []
        for (let filepath of getRecursiveFilePathsInFolder(config.path_to_cdda_palettes)) {
            if (verbose >= 2) { tiled.log(filepath); }
            if (!filepath.match(/\.json$/)) {
                continue;
            }
            let palette_json = JSONread(filepath)
            for (let palette of palette_json) {
                if (verbose >= 2) { tiled.log(`checking '${palette.id}' in '${filepath}'`); }
                if (mapEntry.object["palettes"].includes(palette.id)) {
                    if (verbose) { tiled.log(`found palette '${palette.id}' in '${filepath}'`); }
                    loaded_palettes.push(palette);
                }
            }
        }

        let layer_map_array = [] // the rows of the map
        let mapsize = [];
        // initialize rows with empty spaces
        for (let sublayer of layer.layers) {
            if (sublayer.isTileLayer) {
                for (let y = 0; y < sublayer.height; y++) {
                    layer_map_array.push(" ".repeat(sublayer.width)) // create empty rows in the size of the map
                    mapsize = [sublayer.width, sublayer.height]
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
        for (let palette of loaded_palettes) { // get symbols from palette by layer (terrain, furniture, items, etc.) to avoid using for custom assignment
            for (let object of mapLayerTypes) {
                if (!palette.hasOwnProperty(object)) { continue; }
                for (let symbol of Object.keys(palette[object])) {

                    if (!combined_symbols_dict.hasOwnProperty(symbol)) {
                        combined_symbols_dict[symbol] = []
                    }
                    if (palette[object][symbol].hasOwnProperty("param")) { // is object "param"
                        combined_symbols_dict[symbol].push([palette[object][symbol].param])

                    } else if (palette[object][symbol].hasOwnProperty("switch")) { // is object "switch"
                        if (palette[object][symbol].switch.hasOwnProperty("param")) {
                            combined_symbols_dict[symbol].push([palette[object][symbol].switch.param])
                        }

                    } else if (Array.isArray(palette[object][symbol])) { // is array
                        let temparray = []
                        for (let entry of palette[object][symbol]) {
                            if (typeof entry === "string") {
                                temparray.push([entry])
                            }
                            if (Array.isArray(entry)) {
                                temparray.push([entry[0]])
                            }
                        }
                        combined_symbols_dict[symbol].push([temparray])
                    } else if (typeof palette[object][symbol] === "string") {
                        combined_symbols_dict[symbol].push([palette[object][symbol]])
                    }

                    if (!assigned_symbols.includes(symbol)) { assigned_symbols.push(palette[object][symbol].param); }
                }
            }
        }
        // get all assigned cdda ids by coordinate
        for (let sublayer of layer.layers) {
            if (verbose >= 1) { tiled.log(`working on layer '${sublayer.property("cdda_layer")}'`) }
            if (sublayer.property("cdda_layer") == "fill_ter") { continue; };
            if (sublayer.isTileLayer) {
                for (let y = 0; y < sublayer.height; y++) {
                    for (let x = 0; x < sublayer.width; x++) {
                        if (sublayer.tileAt(x, y) != null) { // check if 'valid' tile
                            if (typeof sublayer.tileAt(x, y).property("cdda_id") === "string") { // check if tile has cdda id
                                let tile_cdda_id = sublayer.tileAt(x, y).property("cdda_id"); // get cdda id
                                let thisxy = `[${x},${y}]`;
                                if (!coordinate_assignments.hasOwnProperty(thisxy)) {
                                    coordinate_assignments[thisxy] = {};
                                }
                                if (!coordinate_assignments[thisxy].hasOwnProperty(sublayer.property("cdda_layer"))) {
                                    coordinate_assignments[thisxy][sublayer.property("cdda_layer")] = [];
                                }
                                coordinate_assignments[thisxy][sublayer.property("cdda_layer")].push(tile_cdda_id)
                            }
                        }
                    }
                }
            }
            if (!sublayer.isTileLayer) {
                for (let obj of sublayer.objects) {
                    let json_entry = {};
                    let cdda_id_name;
                    // if(sublayer.property("cdda_layer") == "items"){
                    //     if(obj.resolvedProperties().hasOwnProperty("cdda_id")){cdda_id_name = "item";}
                    // }
                    if (sublayer.property("cdda_layer") == "place_item") {
                        if (obj.resolvedProperties().hasOwnProperty("cdda_id")) { cdda_id_name = "item"; }
                    }
                    if (sublayer.property("cdda_layer") == "place_items") {
                        if (obj.resolvedProperties().hasOwnProperty("cdda_id")) { cdda_id_name = "item"; }
                    }
                    if (sublayer.property("cdda_layer") == "place_vehicles") {
                        if (obj.resolvedProperties().hasOwnProperty("cdda_id")) { cdda_id_name = "vehicle"; }
                    }
                    if (sublayer.property("cdda_layer") == "place_monsters") {
                        if (obj.resolvedProperties().hasOwnProperty("cdda_id")) { cdda_id_name = "monster"; }
                    }
                    if (sublayer.property("cdda_layer") == "place_fields") {
                        if (obj.resolvedProperties().hasOwnProperty("cdda_id")) { cdda_id_name = "field"; }
                    }
                    if (sublayer.property("cdda_layer") == "place_zones") {
                        if (obj.resolvedProperties().hasOwnProperty("cdda_id")) { cdda_id_name = "type"; }
                    }
                    if (sublayer.property("cdda_layer") == "place_loot") {
                        if (obj.resolvedProperties().hasOwnProperty("group")) {
                            obj.resolvedProperties().group ? cdda_id_name = "group" : cdda_id_name = "item"
                        }
                    }
                    json_entry[cdda_id_name] = obj.resolvedProperties()["cdda_id"]
                    for (let prop of Object.keys(obj.resolvedProperties())) {
                        if (["cdda_id", "group"].includes(prop) || obj.resolvedProperties()[prop] == "") { continue; }
                        json_entry[prop] = obj.resolvedProperties()[prop]
                    }
                    json_entry.x = obj.width > 32 ? [Math.floor(obj.x / 32), Math.floor((obj.x + obj.width) / 32)] : Math.floor(obj.x / 32)
                    json_entry.y = obj.height > 32 ? [Math.floor(obj.y / 32), (Math.floor(obj.y + obj.height) / 32)] : Math.floor(obj.y / 32)
                    if (obj.hasOwnProperty("tile")) { // offset objects containing tiles
                        if (obj.tile != null) {
                            json_entry.y = obj.height > 32 ? [Math.floor((obj.y / 32)) - 1, Math.floor(((obj.y + obj.height) / 32)) - 1] : Math.floor((obj.y / 32)) - 1
                        }
                    }
                    if (!mapEntry.object.hasOwnProperty(sublayer.property("cdda_layer"))) {
                        mapEntry.object[sublayer.property("cdda_layer")] = []
                    }
                    mapEntry.object[sublayer.property("cdda_layer")].push(json_entry)
                }
            }
        }

        for (let symbol in combined_symbols_dict) { // get palette symbols for exclusion
            if (!assigned_symbols.includes(symbol)) { assigned_symbols.push(symbol); }
        }

        if (verbose >= 1) {
            tiled.log(`coordinate assignemnts:`);
            for (let ca in coordinate_assignments) {
                tiled.log(`${ca} > ${cte.flattenDict(coordinate_assignments[ca])} (${Object.keys(coordinate_assignments[ca]).length})`);
            }
        }
        if (verbose >= 1) {
            tiled.log(`combined symbols assignemnts:`)
            for (let s in combined_symbols_dict) {
                tiled.log(`${s} > ${combined_symbols_dict[s]} (${combined_symbols_dict[s].length})`)
            }
        }
        // assign symbols to coordinates on map
        coordinate_entry_loop:
        for (let coordinate of Object.keys(coordinate_assignments)) {
            let coordmatch = coordinate.match(/\[(\d+)\,(\d+)\]/)
            let x = Number.parseInt(coordmatch[1], 10)
            let y = Number.parseInt(coordmatch[2], 10)


            for (let possible_symbol in combined_symbols_dict) { // assign palette symbols
                if (verbose >= 3) { tiled.log(`'${coordinate}' possible symbol '${possible_symbol}'`); }
                if (combined_symbols_dict[possible_symbol].length == Object.keys(coordinate_assignments[coordinate]).length &&
                    cte.flattenDict(coordinate_assignments[coordinate]).every(r => cte.flattenArray(combined_symbols_dict[possible_symbol]).includes(r))
                ) {
                    if (verbose >= 1) { tiled.log(`[${x},${y}] palette assign '${possible_symbol}' > '${cte.flattenDict(coordinate_assignments[coordinate])}'`); }
                    layer_map_array[y] = layer_map_array[y].slice(0, x) + possible_symbol + layer_map_array[y].slice(x + 1)


                    for (let entry of mapLayerTypes) {
                        if (coordinate_assignments[coordinate].hasOwnProperty(entry)) {
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
            for (let object of mapLayerTypes) {
            }
            for (let symbol of Object.keys(custom_symbols_dict)) {
                if (
                    Object.keys(custom_symbols_dict[symbol]).length == Object.keys(coordinate_assignments[coordinate]).length &&
                    cte.flattenDict(coordinate_assignments[coordinate]).every(r => cte.flattenDict(custom_symbols_dict[symbol]).includes(r))
                ) {
                    if (verbose >= 1) { tiled.log(`[${x}, ${y}] - previously assigned '${symbol}' > '${cte.flattenDict(coordinate_assignments[coordinate])}'`); }
                    layer_map_array[y] = layer_map_array[y].slice(0, x) + symbol + layer_map_array[y].slice(x + 1)

                    continue coordinate_entry_loop;
                }
            }
            // newly defined symbol
            let symbolstouse = ""
            let cdda_ids_in_tile = cte.flattenDict(coordinate_assignments[coordinate])
            let symbol_group_to_use = `us_keyboard`
            if (use_pretty_symbols) {
                symbol_group_to_use = `pretty`
            }
            for (let searchTerm in utf_ramps[symbol_group_to_use]) {
                let re = new RegExp(`(${searchTerm})`)
                if (cdda_ids_in_tile.join("").match(re)) {
                    symbolstouse = utf_ramps[symbol_group_to_use][searchTerm]
                }
            }
            symbolstouse += utf_ramps.utf8_shortlist
            for (let symbol of symbolstouse) {
                if (assigned_symbols.includes(symbol)) { continue; } else { assigned_symbols.push(symbol); }
                if (verbose >= 1) { tiled.log(`( ${x}, ${y} ) - newly assigned '${symbol}' > '${cte.flattenDict(coordinate_assignments[coordinate])}'`); }
                custom_symbols_dict[symbol] = coordinate_assignments[coordinate]
                layer_map_array[y] = layer_map_array[y].slice(0, x) + symbol + layer_map_array[y].slice(x + 1)
                for (let entry in coordinate_assignments[coordinate]) {
                    let entry_ready = coordinate_assignments[coordinate][entry];
                    if (Array.isArray(entry_ready) && entry_ready.length === 1) {
                        entry_ready = entry_ready[0]
                    }
                    for (let mapLayerType of mapLayerTypes){
                        if (entry == mapLayerType) { mapEntry.object[mapLayerType][symbol] = entry_ready; }
                    }
                    // if (entry == "terrain") { mapEntry.object.terrain[symbol] = entry_ready; }
                    // if (entry == "furniture") { mapEntry.object.furniture[symbol] = entry_ready; }
                }
                continue coordinate_entry_loop;
            }
        }
        if (verbose >= 1) {
            tiled.log("complete symbol map")
            for (let y = 0; y < layer_map_array.length; y++) {
                tiled.log(layer_map_array[y])
                for (let x = 0; x < layer_map_array[y].length; x++) {
                };
            };
        }
        mapEntry.object.rows = layer_map_array

        if (verbose >= 1) {
            tiled.log("assigned symbols = " + assigned_symbols)
        };
        for (let d in mapEntry.object) { // cleanup empty 'objects'
            if (mapEntry.object[d].length === 0) { delete mapEntry.object[d]; };
        };
        return mapEntry;
    }
    for (let layer of currentMap_tm.layers) {
        mapEntries.push(prepareEntry(layer))
    }

    // delete unused fields from map entry
    // tiled.log(mapEntries[0].object.rows[4])
    tiled.log(`Map export complete`)
    return mapEntries.reverse();
}

function TSXread(filepath) { // { tiles: { id: { properties: { property: value }}}}
    const file = new TextFile(filepath, TextFile.ReadOnly)
    file.codec = "UTF-8"
    const file_data = file.readAll()
    file.close()
    let xmlDictionary = {} // assign as dictionary because missing tiles can leave empty entries.
    xmlDictionary["filepath"] = filepath
    xmlDictionary["tiles"] = {}
    let tileregex = /.*<tile id.*\n(?:.*\n)+?.*<\/tile>/g
    let xmlentries = file_data.match(tileregex)
    for (let xmlentry of xmlentries) {
        let tileid = xmlentry.match(/tile id\=.*?\"(.*?)\"/)[1]
        xmlDictionary["tiles"][tileid] = {}
        xmlDictionary["tiles"][tileid]["properties"] = {}
        if (xmlentry.match(/class\=.*?\"(.*?)\"/)) {
            xmlDictionary["tiles"][tileid]["class"] = xmlentry.match(/class\=.*?\"(.*?)\"/)
        }
        if (xmlentry.match(/probability\=.*?\"(.*?)\"/)) {
            xmlDictionary["tiles"][tileid]["probability"] = xmlentry.match(/probability\=.*?\"(.*?)\"/)
        }

        if (xmlentry.match(/<properties/)) {
            for (let property of xmlentry.match(/<property.*?>/g)) {
                let propertyKeyValue = property.match(/<property.*?name.*?\"(.*?)\".*?value.*?\"(.*?)\"/)
                xmlDictionary["tiles"][tileid]["properties"][propertyKeyValue[1]] = propertyKeyValue[2]
                if (verbose >= 2) { tiled.log(`entry id: ${tileid} property name: ${propertyKeyValue[1]} cdda id (property value): ${propertyKeyValue[2]}`); }
            }
        }
        if (xmlentry.match(/<image/)) {
            xmlDictionary.tiles[tileid].image = {}
            if (xmlentry.match(/<image.*?source/)) {
                let imagedata = xmlentry.match(/<image.*?(?:width=\"(\d+)\".*?)?(?:height=\"(\d+)\".*?)?source=\"(.*?)\"/)
                xmlDictionary.tiles[tileid].image.width = imagedata[1]
                xmlDictionary.tiles[tileid].image.height = imagedata[2]
                xmlDictionary.tiles[tileid].image.source = imagedata[3]
            }
            if (xmlentry.match(/data encoding/)) {
                xmlDictionary.tiles[tileid].image.format = xmlentry.match(/image.*?format=\"(.*?\")/)[1]
                xmlDictionary.tiles[tileid].image.data = xmlentry.match(/data encoding.*?>(.*)?</)[1]
            }
        }
    }
    return xmlDictionary;
};

function findTileInTilesets() {
    let lastsearch;
    config.hasOwnProperty("last_search_cdda_id") ? lastsearch = config.last_search_cdda_id : lastsearch = "t_floor"
    let cdda_id_tofind = tiled.prompt(`Find tile with corresponding CDDA ID:`, lastsearch, "Find Tile by CDDA ID").replace(/(^("|'|))|("|'|\\|\\\\|\/)$/g, "")
    if (cdda_id_tofind == "") { return; }
    config.last_search_cdda_id = cdda_id_tofind
    cte.updateConfig();
    tiled.log(`Searching for '${cdda_id_tofind}'.`)
    let asset = tiled.activeAsset

    let matching_tiles = getMatchingTiles(cdda_id_tofind, asset);
    // let sorted = cte.getSortedKeys(matching_tiles)
    if (Object.keys(matching_tiles).length === 0) {
        return tiled.log(`No matches found for '${cdda_id_tofind}'.`)
    }
    if (Object.keys(matching_tiles).length === 1) {
        if (verbose >= 1) { tiled.log(`'${cdda_id_tofind}' - found in '${Object.keys(matching_tiles).length}' match.`); }
        cte.goToTile(matching_tiles[Object.keys(matching_tiles)[0]].id, matching_tiles[Object.keys(matching_tiles)[0]].filepath)
    }
    if (Object.keys(matching_tiles).length > 1) {
        if (verbose >= 1) { tiled.log(`'${cdda_id_tofind}' - found in '${Object.keys(matching_tiles).length}' matches.`); }
        selectionDialog(cdda_id_tofind, matching_tiles, asset)
    }



    // tiled.log(`matches ${Object.keys(matching_tiles)} - found '${Object.keys(matching_tiles).length}' matches`)

    function selectionDialog(cdda_id_tofind, matching_tiles, asset) {
        // let asset = tiled.activeAsset
        let sorted = cte.getSortedKeys(matching_tiles)
        let dialog = new Dialog()
        dialog.windowTitle = `Matches for '${cdda_id_tofind}'`
        let selection = dialog.addComboBox(`Select match:`, sorted)
        let doneButton = dialog.addButton(`select tile`)
        doneButton.clicked.connect(function () {
            let selected_cdda_id_tofind = sorted[selection.currentIndex]
            cte.goToTile(matching_tiles[selected_cdda_id_tofind].id, matching_tiles[selected_cdda_id_tofind].filepath)
            dialog.accept()
        })
        dialog.show()

    }

    function getMatchingTiles(cdda_id_tofind, asset) {
        let tsjs = cte.getFilesInPath(config.path_to_chosen_tileset_files)
        let matching_tiles = {}
        for (let filename of tsjs) {
            if (!filename.match(/\.tsj$/)) {
                continue
            }
            let filepath = `${config.path_to_chosen_tileset_files}/${filename}`
            if (verbose >= 2) { tiled.log(`${filepath}`); }
            let tsjData = JSONread(filepath);
            for (let tile_index in tsjData.tiles) {
                let this_tile = tsjData.tiles[tile_index]
                if (this_tile.hasOwnProperty("properties")) {
                    for (let property in this_tile.properties) {
                        let this_property = this_tile.properties[property]
                        if (this_property.name != `cdda_id`) { continue; }
                        // if( verbose >= 3){tiled.log(`checking '${property.name}' : '${this_tile.properties[property]}' for '${cdda_id_tofind}' in id '${tile_index}'`);}
                        if (this_property.value.includes(cdda_id_tofind)) {
                            if (verbose >= 2) { tiled.log(`'${this_property.name}' found. '${this_tile.id}' in '${filename}'`); }
                            matching_tiles[this_property.value] = {
                                "id": this_tile.id,
                                "filepath": filepath
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
            "flags": entry.object['flags'],
            "fill_ter": entry.object['fill_ter'],
            "palettes": entry.object['palettes'],
            "predecessor_mapgen": entry.object['predecessor_mapgen'],
            "distribution": entry.object["distribution"],
            "rows": entry.object['rows'],
            "terrain": entry.object["terrain"],
            "furniture": entry.object["furniture"],
            "items": entry.object["items"],
            "place_computers": entry.object["place_computers"],
            "place_monsters": entry.object["place_monsters"],
            "place_vehicles": entry.object["place_vehicles"],
            "place_liquids": entry.object["place_liquids"],
            "place_corpses": entry.object["place_corpses"],
            "place_rubble": entry.object["place_rubble"],
            "place_nested": entry.object["place_nested"],
            "place_items": entry.object["place_items"],
            "place_item": entry.object["place_item"],
            "place_zones": entry.object["place_zones"],
            "place_loot": entry.object["place_loot"],
            "sealed_item": entry.object["sealed_item"],
            "computers": entry.object["computers"],
            "graffiti": entry.object["graffiti"],
            "toilets": entry.object['toilets'],
            "traps": entry.object["traps"],
            "zones": entry.object["zones"]
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
const setconfig = new Proxy(config, {
    set(target, name, value) {
        if (name in target) {
            if(name.match(/^path/)){
                target[name] = FileInfo.fromNativeSeparators(value);
            } else {
                target[name] = value;
            }
        }
        target.changed = true;
    }
})
function add_config_properties(){ 
    Object.defineProperty(config,"path_to_project",{
        get: function() { return FileInfo.path(tiled.projectFilePath); },
    });
    // Object.defineProperty(config,"set_path_to_project",{
    //     set: function(value) { this.path_to_project = FileInfo.fromNativeSeparators(value) }
    // });
    // Object.defineProperty(config,"get_path_to_cdda",{
    //     get: function() { return this.path_to_cdda; },
    // });
    Object.defineProperty(config,"set_path_to_cdda",{
        set: function(value) { this.path_to_cdda = FileInfo.fromNativeSeparators(value) }
    });
    Object.defineProperty(config,"path_to_chosen_cdda_tileset_files",{
        get: function() { return `${this.path_to_cdda}/gfx/${this.chosen_tileset}`; },
        set: function(value) {
            // this.path_to_chosen_cdda_tileset_files = FileInfo.fromNativeSeparators(value);
            this.chosen_tileset = FileInfo.fileName(value)//.match(/(?:\/|\\|\\\\)(?:(\.?.+$)|(?:(\.?.+)(?:\/|\\|\\\\).+\..+))/)[1]
        }
    });
    Object.defineProperty(config,"pathToExtras",{
        get: function() { return `${tiled.extensionsPath}/cdda_map_extension_extras`; },
    });
    // Object.defineProperty(config,"set_pathToExtras",{
    //     set: function(value) { pathToExtras = FileInfo.fromNativeSeparators(value) }
    // });
    Object.defineProperty(config,"path_to_cdda_tilesets",{
        get: function() { return `${this.path_to_cdda}/gfx`; }
    });
    Object.defineProperty(config,"path_to_cdda_palettes",{
        get: function() { return `${this.path_to_cdda}/data/json/mapgen_palettes`; }
    });
    Object.defineProperty(config,"path_to_chosen_cdda_tileset_json",{
        get: function() { return `${this.path_to_chosen_cdda_tileset_files}/tile_config.json`; }
    });
    Object.defineProperty(config,"path_to_tilesets",{
        get: function() { return `${FileInfo.path(tiled.projectFilePath)}/tilesets`; }
    });
    Object.defineProperty(config,"path_to_chosen_tileset_files",{
        get: function() { return `${this.path_to_tilesets}/${this.chosen_tileset}`; }
    });
    Object.defineProperty(config,"path_to_meta_tileset",{
        get: function() { return `${this.path_to_chosen_tileset_files}/cdda_meta_tileset.tsj`; }
    });
    Object.defineProperty(config,"path_to_unknowns_tileset",{
        get: function() { return `${this.path_to_chosen_tileset_files}/unknown_tiles.tsj`; }
    });
    Object.defineProperty(config,"path_to_favorites_tileset",{
        get: function() { return `${this.path_to_tilesets}/favorites/favorites.tsj`; }
    });
    Object.defineProperty(config,"path_to_maps",{
        get: function() { return `${FileInfo.path(tiled.projectFilePath)}/maps`; }
    });
    function getconfig(k){return config[k]}
}
class extensionConfig {
    constructor() {
        this.chosen_tileset = "ChibiUltica";
        this.snaptogrid = true;
        // this.path_to_cdda;
        // this.path_to_chosen_cdda_tileset_files;
        // this.path_to_cdda_tilesets;
        // this.pathToExtras = pathToExtras;
        // this.filename = configfilename;
        // this.path_to_cdda;
        // return new Proxy(this, {
        // //     get(target, name, receiver) {
        // //         if (name in target) {
        // //             if(name.match(/^path/)){
        // //                 return FileInfo.toNativeSeparators(target[name]);
        // //             } else {
        // //                 return target[name];
        // //             }
        // //         } else {
        // //             return;

        // //         }
        // //     },
        //     set(target, name, receiver) {
        //         if (name in target) {
        //             if(name.match(/^path/)){
        //                 target[name] = FileInfo.fromNativeSeparators(receiver);
        //             } else {
        //                 target[name] = receiver;
        //             }
        //         }
        //         target.changed = true;
        //     }
        // });
    };
};
var CDDAMapFormat = {
    name: "CDDA map format",
    extension: "json",

    write: function (map, fileName) {
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

// Configure cte
const action_configureCTE = tiled.registerAction("CustomAction_configureCTE", function (action_configureCTE) {
    tiled.log(`${action_configureCTE.text} was run.`)
    wizard()
});

// Create New Map
const action_createNewMap = tiled.registerAction("CustomAction_createNewMap", function (action_createNewMap) {
    tiled.log(`${action_createNewMap.text} was run.`)
    initialize()
    makeEmptyMap()
});
// Add new om_terrain layergroup
const action_newCDDAGroupLayer = tiled.registerAction("CustomAction_newCDDAGroupLayer", function (action_newCDDAGroupLayer) {
    tiled.log(`${action_newCDDAGroupLayer.text} was run.`)
    initialize() ? addNewOmTerrainToMap() : tiled.log(`Failed to initialize.`)
});
// Import CDDA Map
const action_importMap = tiled.registerAction("CustomAction_importMap", function (action_importMap) {
    tiled.log(`${action_importMap.text} was run.`)
    initialize()
    if (config.pathToLastImportMap == undefined) { config.pathToLastImportMap = `${config.path_to_cdda}/data/json/mapgen/house/house_detatched1.json` }
    // cte.filePicker(importMap,config.pathToLastImportMap)
    // cte.filePicker(importMapChoiceDialog,config.pathToLastImportMap)
    importMap(cte.filePicker(config.pathToLastImportMap))
});
// Export CDDA Map
const action_exportMap = tiled.registerAction("CustomAction_CDDA_map_exportMap", function (action_exportMap) {
    tiled.log(`${action_exportMap.text} was run.`)
    initialize()
    exportMap()
});
// Find tile in tileset by CDDA ID
const action_findTileInTilemap = tiled.registerAction("CustomAction_CDDA_map_findTileInTileset", function (action_findTileInTilemap) {
    tiled.log(`${action_findTileInTilemap.text} was run.`)
    initialize() ? findTileInTilesets() : tiled.log("Action aborted.")
});
// Add sprite to favorites tileset
const action_add_sprite_to_favotires = tiled.registerAction("CustomAction_CDDA_add_sprite_to_favotires", function (action_add_sprite_to_favotires) {
    tiled.log(`${action_add_sprite_to_favotires.text} was run.`)
    initialize() ? addSpriteToFavotires() : tiled.log("Action aborted.")
});
// toggle verbose mode
const action_cdda_verbose = tiled.registerAction("CustomAction_cdda_verbose", function (action_cdda_verbose) {
    tiled.log(action_cdda_verbose.text + " was " + (action_cdda_verbose.checked ? "checked" : "unchecked"))
    action_cdda_verbose.checked ? verbose = true : verbose = false
});
// toggle unicode character usage
const action_cdda_unicode_set_toggle = tiled.registerAction("CustomAction_cdda_unicode_set_toggle", function (action_cdda_unicode_set_toggle) {
    tiled.log(action_cdda_unicode_set_toggle.text + " was " + (action_cdda_unicode_set_toggle.checked ? "checked" : "unchecked"))
    action_cdda_unicode_set_toggle.checked ? use_pretty_symbols = true : use_pretty_symbols = false
});
// test action for debug
const action_cdda_debug = tiled.registerAction("CustomAction_cdda_debug", function (action_cdda_debug) {
    tiled.log(`${action_cdda_debug.text} was run.`)
    initialize()
    let filepath = cte.filePicker(config.pathToLastImportMap)
    let json = JSONread(filepath)
    // wizard()
    importMaps(filepath,json)
    
    tiled.log(`debug finished`)
});

action_configureCTE.text = "Configure CTE"
action_createNewMap.text = "Create new CDDA map"
action_newCDDAGroupLayer.text = "Add new om_terrain to map"
action_importMap.text = "Import CDDA map"
action_exportMap.text = "Export to CDDA map"
action_findTileInTilemap.text = "Find CDDA Tile"
action_findTileInTilemap.shortcut = "CTRL+F"
action_add_sprite_to_favotires.text = "Add Sprite to Favorites"
action_add_sprite_to_favotires.shortcut = "CTRL+SHIFT+F"
action_cdda_verbose.text = "Verbose Logging (slower performance)"
action_cdda_verbose.checkable = true
action_cdda_unicode_set_toggle.text = "Pretty symbols for map export"
action_cdda_unicode_set_toggle.checkable = true
action_cdda_unicode_set_toggle.checked = true

action_cdda_debug.text = "run associated debug action"
action_cdda_debug.shortcut = "CTRL+D"

//tiled.log(tiled.menus)
tiled.registerMapFormat("cdda map", CDDAMapFormat)
tiled.extendMenu("File", [
    { separator: true },
    { action: "CustomAction_importMap", before: "Close" },
    { action: "CustomAction_createNewMap", before: "Close" },
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
    { action: "CustomAction_configureCTE", before: "Preferences" },
    { separator: true }
]);
tiled.extendMenu("Help", [
    { separator: true },
    { action: "CustomAction_cdda_verbose", after: "Terrain Sets" },
    { action: "CustomAction_cdda_debug", after: "Terrain Sets" },
    { separator: true }
]);