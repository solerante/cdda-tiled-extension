# Tiled extension for Cataclysm: Dark Days Ahead

Add the extension and extras folder to your [Tiled](https://www.mapeditor.org/) extensions folder.
[Check out the Tiled docs for more information](https://doc.mapeditor.org/en/stable/reference/scripting/#script-extensions)

The 'extras' folder contains png images for the extension tileset. This adds relative tiles like region groundcover.

## Update v0.3.0

Tiled 1.10!

### [Check out the wiki for details and how-to](https://github.com/solerante/tiled-cdda-map-extension/wiki)

---

![tiled_screenshot](https://user-images.githubusercontent.com/30750303/199577624-fcc35ebf-7ec3-4617-9c5e-3c670f156607.png)

![tiledcddaextension](https://user-images.githubusercontent.com/30750303/202532520-69f460d4-2f5e-49c0-b3e7-46e10fc9637e.gif)

---

What works

- Import CDDA Tilesets
  - Chosen tileset is imported and each matching cdda id has a unique tile for easy stamping.
  - [Find tile by its cdda id with 'ctrl+f'](https://github.com/solerante/tiled-cdda-map-extension/wiki/Menu-Actions#find-cdda-tile)
  - [Save a tile to 'favorites' tileset](https://github.com/solerante/tiled-cdda-map-extension/wiki/Menu-Actions#add-sprite-to-favorites)
  - [Use palettes](https://github.com/solerante/tiled-cdda-map-extension/wiki#cdda-data-in-custom-properties)
- Create and Modify Maps by Stamping Tiles, Drawing Shapes, and Changing Properties
  - Draw naturally on a map layer using the sprites of any CDDA tileset
  - Drag, drop, and stretch rectangles for zones and areas
  - Edit CDDA properties such as `density` and `repeat` with [custom properties](https://github.com/solerante/tiled-cdda-map-extension/wiki#cdda-data-in-custom-properties)

What kind of works

- Import and Export CDDA map
  - Export a file that might load in CDDA. Check your work!
  - implemented:
    - [x] { object : { `place_items` : {} } }
    - [x] { object : { `place_item` : {} } }
    - [x] { object : { `place_loot` : {} } }
    - [x] { object : { `place_monsters` : {} } }
    - [x] { object : { `place_vehicles` : {} } }
    - [x] { object : { `place_fields` : {} } }
    - [x] { object : { `place_zones` : {} } }
    - [ ] { object : { `items` : {} } }
    - [ ] { object : { `toilets` : {} } }
    - [ ] { object : { `vendingmachines` : {} } }
    - [ ] { object : { `vehicles` : {} } }
    - [ ] { object : { `NPC` : {} } }
