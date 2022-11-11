# Tiled extension for Cataclysm: Dark Days Ahead

Add the extension and extras folder to your [Tiled](https://www.mapeditor.org/) extensions folder.
[Check out the Tiled docs for more information](https://doc.mapeditor.org/en/stable/reference/scripting/#script-extensions)

The 'extras' folder contains png images for the extension tileset.

=======

![tiled_screenshot](https://user-images.githubusercontent.com/30750303/199577624-fcc35ebf-7ec3-4617-9c5e-3c670f156607.png)

## Menu Actions:

### File > Import CDDA Tileset

Import tilesets installed in CDDA folder by folder path.

- Takes a bit of time.

### File > Import CDDA Map

Import a CDDA map by its path, based on imported tileset. Must have imported tileset.

- Takes a bit of time.

### File > Export As... > CDDA map format

"Export" the current map "for CDDA" (that's a stretch).

- Map must be open in Tiled
- Takes a bit of time.

### Tileset > Find CDDA Tile

Displays the tile number and tileset file of searched CDDA id, such as "t_floor".

=======

What works

- nothing

What kind of works

- Import CDDA Tilesets
- Import CDDA map
  - Maps missing some definitions (results in empty tiles).
  - Some items and entities are imported when not using relative definitions.
- Export CDDA map
  - Can sometimes export a file that loads in CDDA.
  - Symbols are not well chosen when terrain and furniture overlap.
- Remember settings
