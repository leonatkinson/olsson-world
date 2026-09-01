# Olsson World
Contributors: leonatkinson
Tags: random, rpg, role-playing-game, osr
Requires at least: 5.2.0
Tested up to: 7.1
Stable tag: main
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Add block to display a tool for generating random world maps using fractal great-circle fault lines.

## Description

This plugin adds a Gutenberg block that creates an interactive form for generating random fractal world maps in the browser using vanilla JavaScript. 

It is based on the algorithm written in C by John Olsson (Fractal Worldmap Generator Version 2.2, with thanks to Carl Burke for generation speedup suggestions). We also relied on version 2.2a available at [donjon.bin.sh/code/world/](https://donjon.bin.sh/code/world/).

As noted in John Olsson's original comments, the generator creates random great circles (fault lines) that iteratively raise and lower hemispheres to build realistic continental landmasses, mountain ranges, and oceans. In this WordPress plugin, we have rewritten the spherical and orthographic projection code for clean, high-performance client-side HTML5 canvas rendering without server-side dependencies.

### Input Parameters & Features

- **Percent Water**: Ratio between water and land (default 65).
- **Percent Ice**: Percentage of ice-caps generated via 4-way floodfill at the poles (default 0).
- **Height of Image**: Height of generated map in pixels (default 900).
- **Projection**: Map projection type, including Square, Mercator, Spherical, Orthographic NP (North Pole), and Orthographic SP (South Pole).
- **Scroll / Rotate Degrees**: Dynamically labeled as **Scroll** for Square and Mercator projections, or **Rotate Degrees** for spherical/orthographic globe projections (default 135).
- **Colors**: Color palette dropdown with choices: **Terrain & Snow** (default terrain & snow palette), **Green/Blue**, **Olsson Original**, **Twelve Colors**, and **Two Colors**.
- **Random Seed**: Seed used to initialize the pseudo-random number generator (defaulting to seconds on the clock).
- **Iterations**: Number of fractal fault-line iterations (default 500, automatically scaled based on map resolution for high-density landmasses).

The user fills out the form, clicks **Generate Map**, and the map is drawn instantly into the page via HTML5 canvas, with an option to download the rendered map as a PNG image.

## Installation

1. Copy the entire plugin folder into `wp-content/plugins`. Alternatively, use `wp-cli` to install the plugin
   like this: `wp plugin install --force https://github.com/leonatkinson/olsson-world/archive/refs/heads/main.zip`
1. Activate the plugin.
1. Place an **Olsson World Map Generator** block on a page.

## Screenshots

1. **Square Projection**: Classic equirectangular world map view.
   ![Square Projection](screenshots/square-projection.png?raw=true "Square Projection")

2. **Mercator Projection**: Mercator latitude-distorted world map view.
   ![Mercator Projection](screenshots/mercator-projection.png?raw=true "Mercator Projection")

3. **Spherical Projection**: Globe view centered on the equator.
   ![Spherical Projection](screenshots/spherical-projection.png?raw=true "Spherical Projection")

4. **Orthographic NP Projection**: North Pole centered globe view.
   ![Orthographic NP Projection](screenshots/orthographic-np-projection.png?raw=true "Orthographic NP Projection")

5. **Green/Blue Color Scheme**: Alternative color palette highlighting green terrain and blue oceans.
   ![Green/Blue Color Scheme](screenshots/green-blue.png?raw=true "Green/Blue Color Scheme")

6. **Two Color Mode**: Classic two-color mode rendering using original C source color indices.
   ![Two Color Mode](screenshots/two-color.png?raw=true "Two Color Mode")

## Changelog

### 1.0.0
* Initial Release with vanilla JS browser rendering, full projection support, color schemes, and Gutenberg block integration.

### 1.1.0
* Add two new color schemes: Terrain & Snow and Twelve Colors
* Add toggle to lock the seed
* Add help modal

