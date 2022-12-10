oops, I've undone some features in a bad merge :grimace: hang on.

# Tiled extension for Cataclysm: Dark Days Ahead

Add the extension and extras folder to your [Tiled](https://www.mapeditor.org/) extensions folder.
[Check out the Tiled docs for more information](https://doc.mapeditor.org/en/stable/reference/scripting/#script-extensions)

The 'extras' folder contains png images for the extension tileset. This adds relative tiles like region groundcover.

=======
![tiledcddaextension](https://user-images.githubusercontent.com/30750303/202532520-69f460d4-2f5e-49c0-b3e7-46e10fc9637e.gif)

![tiled_screenshot](https://user-images.githubusercontent.com/30750303/199577624-fcc35ebf-7ec3-4617-9c5e-3c670f156607.png)

## Menu Actions

### File > Import CDDA Tileset

Import tilesets installed in CDDA folder by folder path.

- Takes a bit of time.

### File > Import CDDA Map

Import a CDDA map by its path, based on imported tileset. Must have imported tileset.

- Takes a bit of time.

![import_map_gif](https://user-images.githubusercontent.com/30750303/204941807-4ee6b6a9-04de-434b-a59f-5fce4227b24e.gif)

### File > Export As... > CDDA map format

Export the current map as a json for CDDA.

- Furniture and Terrain (items, monsters, and other entities not quite)
- Map must be open in Tiled

![export_results_gif](https://user-images.githubusercontent.com/30750303/204944489-12d2614f-b4ee-4ba4-b2d9-94125654eff7.gif)

### Tileset > Find CDDA Tile (ctrl+shift+f)

Jump to tile with CDDA id, such as "t_floor".

### Tileset > Add Sprite to Favorites (ctrl+shift+d)

Add sprite to 'Favorites' sprite sheet for easy access.

![favorites_gif](https://user-images.githubusercontent.com/30750303/204942932-95a60534-a871-48fd-8b77-e38d1ede9c21.gif)

### File > Change Project Path

Change path to project as seen by CDDA extension (project path is not yet accessible to API)

=======

What works

- Import CDDA Tilesets
  - Chosen tileset is imported and each matching cdda id has a unique tile for easy stamping.
  - Find tile by its cdda id with 'ctrl+f'.
  - Save a copy of the tile to a 'favorites' tileset for easy access.
  - Use palettes
    - palettes are defined in the properties of a layer group under `cdda_palette_0` and if you want to assign more you have to add a property `cdda_palette_1`, etc, until I make it more elegant

What kind of works

- Import and Export CDDA map
  - Maps missing some definitions (results in empty tiles).
  - Export a file that might load in CDDA.
  - Handles `{ object : { place_[object type] : {} } }` alright.
  - Missing `{ object : { items : {} } }`.
  - Missing `{ object : { toilets : {} } }`.
  - Missing `{ object : { vendingmachines : {} } }`.
  - Missing `{ object : { toilets : {} } }`.
  - Missing `{ object : { vehicles : {} } }`.
  - Missing `{ object : { NPC : {} } }`.
  - Missing `{ object : { zones : {} } }`.
