# Tiled extension for Cataclysm: Dark Days Ahead

Add the extension to your Tiled extensions folder.
<https://doc.mapeditor.org/en/stable/reference/scripting/#script-extensions>

=======

![tiled_screenshot](https://user-images.githubusercontent.com/30750303/199577624-fcc35ebf-7ec3-4617-9c5e-3c670f156607.png)

File > Import CDDA Tileset
Import tilesets installed in CDDA folder by name. Takes a bit of time.

File > Import CDDA Map
Import a CDDA map by it's path, based on imported tileset. Takes a bit of time.

(with Tiled map open) File > Export As... > CDDA map format
"Export" the current map "for CDDA" (that's a stretch).

=======

What works

- nothing

What kind of works

- saving config
  - it doesn't remember project location... edit the extension and make your project path the autofill default for the path to project prompt for convenience
- import CDDA Tilesets
- import CDDA map
  - maps missing regional and other relative definitions
  - items and entities are imported when not using relative definitions
  - relative definitions such as inner and outer walls and fences from palettes are not calculated, fallback is used

What doesnt work

- export CDDA map
  - kind of looks like the correct format
  - doesn't actually calculate symbols for map, chooses character from ID. It would need to compare chosen tiles in map to palettes and find a suitable palette, assign it, compare placement of other layers, and export that
