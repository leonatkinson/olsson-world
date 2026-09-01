<?php
/**
 * Plugin Name: Olsson World
 * Plugin URI: https://github.com/leonatkinson/olsson-world
 * Description: Add block to display a tool for generating random fractal world maps.
 * Version: 1.0.0
 * Author: Leon Atkinson
 * License: GPLv3 or later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: olsson-world
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Register the Gutenberg block and render callback.
 */
function olsson_world_init() {
    wp_register_script(
        'olsson-world-editor',
        plugins_url( 'src/index.js', __FILE__ ),
        array( 'wp-blocks', 'wp-element', 'wp-editor' ),
        '1.0.0',
        true
    );

    register_block_type( 'olsson-world/map-generator', array(
        'api_version'     => 2,
        'title'           => __( 'Olsson World Map Generator', 'olsson-world' ),
        'category'        => 'widgets',
        'icon'            => 'admin-site-alt3',
        'description'     => __( 'Generate random fractal world maps using John Olsson\'s algorithm.', 'olsson-world' ),
        'editor_script'   => 'olsson-world-editor',
        'attributes'      => array(
            'percentWater'  => array( 'type' => 'integer', 'default' => 65 ),
            'percentIce'    => array( 'type' => 'integer', 'default' => 0 ),
            'mapHeight'     => array( 'type' => 'integer', 'default' => 900 ),
            'projection'    => array( 'type' => 'string', 'default' => 'Square' ),
            'scrollDegrees' => array( 'type' => 'integer', 'default' => 135 ),
            'colorScheme'   => array( 'type' => 'string', 'default' => 'Terrain & Snow' ),
            'seed'          => array( 'type' => 'integer', 'default' => 0 ),
            'iterations'    => array( 'type' => 'integer', 'default' => 500 ),
            'smoothingRange'=> array( 'type' => 'integer', 'default' => 0 ),
            'lockSeed'      => array( 'type' => 'string', 'default' => 'off' ),
        ),
        'render_callback' => 'olsson_world_render_block',
    ) );
}
add_action( 'init', 'olsson_world_init' );

/**
 * Render callback for the Olsson World block.
 */
function olsson_world_render_block( $attributes ) {
    $percent_water  = isset( $attributes['percentWater'] ) ? intval( $attributes['percentWater'] ) : 65;
    $percent_ice    = isset( $attributes['percentIce'] ) ? intval( $attributes['percentIce'] ) : 0;
    $map_height     = isset( $attributes['mapHeight'] ) ? intval( $attributes['mapHeight'] ) : 900;
    $projection     = isset( $attributes['projection'] ) ? sanitize_text_field( $attributes['projection'] ) : 'Square';
    $scroll_degrees = isset( $attributes['scrollDegrees'] ) ? intval( $attributes['scrollDegrees'] ) : 135;
    $color_scheme   = isset( $attributes['colorScheme'] ) ? sanitize_text_field( $attributes['colorScheme'] ) : 'Terrain & Snow';
    $seed           = isset( $attributes['seed'] ) ? intval( $attributes['seed'] ) : time();
    $iterations     = isset( $attributes['iterations'] ) ? intval( $attributes['iterations'] ) : 500;
    $smoothing_range = isset( $attributes['smoothingRange'] ) ? intval( $attributes['smoothingRange'] ) : 0;
    $lock_seed      = isset( $attributes['lockSeed'] ) ? sanitize_text_field( $attributes['lockSeed'] ) : 'off';

    // Determine initial scroll/rotate label
    $scroll_label   = in_array( $projection, array( 'Square', 'Mercator' ), true ) ? __( 'Scroll:', 'olsson-world' ) : __( 'Rotate Degrees:', 'olsson-world' );

    // Enqueue frontend generator script and styles
    wp_enqueue_script(
        'olsson-world-generator',
        plugins_url( 'assets/js/worldgen.js', __FILE__ ),
        array(),
        '1.0.0',
        true
    );

    wp_enqueue_style(
        'olsson-world-style',
        plugins_url( 'assets/css/style.css', __FILE__ ),
        array(),
        '1.0.0'
    );

    $block_id = 'olsson-world-' . wp_rand( 1000, 9999 );

    ob_start();
    ?>
    <div id="<?php echo esc_attr( $block_id ); ?>" class="olsson-world-container">
        <form class="olsson-world-form" onsubmit="return false;">
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Percent Water:', 'olsson-world' ); ?></label>
                <input type="number" name="percentWater" min="0" max="100" value="<?php echo esc_attr( $percent_water ); ?>" class="ow-water" />
            </div>
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Percent Ice:', 'olsson-world' ); ?></label>
                <input type="number" name="percentIce" min="0" max="100" value="<?php echo esc_attr( $percent_ice ); ?>" class="ow-ice" />
            </div>
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Height of Image:', 'olsson-world' ); ?></label>
                <input type="number" name="mapHeight" min="100" max="2048" value="<?php echo esc_attr( $map_height ); ?>" class="ow-height" />
            </div>
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Projection:', 'olsson-world' ); ?></label>
                <select name="projection" class="ow-projection">
                    <?php
                    $projections = array( 'Square', 'Mercator', 'Spherical', 'Orthographic NP', 'Orthographic SP' );
                    foreach ( $projections as $proj ) {
                        $selected = ( $projection === $proj ) ? 'selected' : '';
                        echo '<option value="' . esc_attr( $proj ) . '" ' . $selected . '>' . esc_html( $proj ) . '</option>';
                    }
                    ?>
                </select>
            </div>
            <div class="olsson-world-field">
                <label class="ow-scroll-label"><?php echo esc_html( $scroll_label ); ?></label>
                <input type="number" name="scrollDegrees" min="-360" max="360" value="<?php echo esc_attr( $scroll_degrees ); ?>" class="ow-scroll" />
            </div>
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Colors:', 'olsson-world' ); ?></label>
                <select name="colorScheme" class="ow-colors">
                    <?php
                    $schemes = array( 'Terrain & Snow', 'Green/Blue', 'Olsson Original', 'Twelve Colors', 'Two Colors' );
                    foreach ( $schemes as $sch ) {
                        $selected = ( $color_scheme === $sch ) ? 'selected' : '';
                        echo '<option value="' . esc_attr( $sch ) . '" ' . $selected . '>' . esc_html( $sch ) . '</option>';
                    }
                    ?>
                </select>
            </div>
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Random Seed:', 'olsson-world' ); ?></label>
                <input type="number" name="seed" value="<?php echo esc_attr( $seed ? $seed : '' ); ?>" class="ow-seed" />
            </div>
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Lock Seed:', 'olsson-world' ); ?></label>
                <select name="lockSeed" class="ow-lock-seed">
                    <option value="off" <?php selected( $lock_seed, 'off' ); ?>><?php esc_html_e( 'Off', 'olsson-world' ); ?></option>
                    <option value="on" <?php selected( $lock_seed, 'on' ); ?>><?php esc_html_e( 'On', 'olsson-world' ); ?></option>
                </select>
            </div>
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Iterations:', 'olsson-world' ); ?></label>
                <input type="number" name="iterations" min="1" max="5000" value="<?php echo esc_attr( $iterations ); ?>" class="ow-iterations" />
            </div>
            <div class="olsson-world-field">
                <label><?php esc_html_e( 'Smoothing Range:', 'olsson-world' ); ?></label>
                <input type="number" name="smoothingRange" min="0" max="100" value="<?php echo esc_attr( $smoothing_range ); ?>" class="ow-smoothing" />
            </div>
            <div class="olsson-world-actions" style="display: flex; align-items: center;">
                <button type="button" class="button button-primary wp-element-button ow-generate-btn"><?php esc_html_e( 'Generate Map', 'olsson-world' ); ?></button>
                <button type="button" class="button button-secondary wp-element-button ow-download-btn" style="display:none;"><?php esc_html_e( 'Download Map (PNG)', 'olsson-world' ); ?></button>
                <button type="button" class="button button-secondary wp-element-button ow-help-btn" style="margin-left: auto;"><?php esc_html_e( 'Help', 'olsson-world' ); ?></button>
            </div>
        </form>
        <div class="olsson-world-map-wrapper">
            <canvas class="ow-map-canvas"></canvas>
        </div>
        <div class="ow-help-modal" style="display: none;">
            <div class="ow-help-modal-content">
                <span class="ow-help-close">&times;</span>
                <h3><?php esc_html_e( 'Olsson World Generator - Help & Guide', 'olsson-world' ); ?></h3>
                <p><?php esc_html_e( 'This tool generates random fractal world maps using John Olsson\'s great-circle fault line algorithm (1999). Below is a guide to every field and feature:', 'olsson-world' ); ?></p>
                <ul>
                    <li><strong><?php esc_html_e( 'Percent Water', 'olsson-world' ); ?> (0–100):</strong> <?php esc_html_e( 'Controls the ratio of ocean to land. Higher values flood more terrain into oceans; lower values produce larger continents.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Percent Ice', 'olsson-world' ); ?> (0–100):</strong> <?php esc_html_e( 'Determines the extent of polar ice caps generated via floodfill from the poles.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Height of Image', 'olsson-world' ); ?> (100–2048):</strong> <?php esc_html_e( 'Sets the canvas height in pixels. Higher resolutions produce more detailed maps and automatically scale iteration density.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Projection', 'olsson-world' ); ?>:</strong> <?php esc_html_e( 'Choose between Square (equirectangular), Mercator, Spherical (3D globe), Orthographic NP (North Pole centered), or Orthographic SP (South Pole centered).', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Scroll / Rotate Degrees', 'olsson-world' ); ?> (-360 to 360):</strong> <?php esc_html_e( 'Shifts longitude horizontally for flat maps or rotates the 3D globe view.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Colors', 'olsson-world' ); ?>:</strong> <?php esc_html_e( 'Selects the rendering palette: Terrain & Snow (default, with blue oceans, green-to-brown rocks, and snow peaks), Green/Blue, Olsson Original, Twelve Colors, or Two Colors.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Random Seed', 'olsson-world' ); ?>:</strong> <?php esc_html_e( 'PRNG seed value. Entering a number reproduces an exact map; leaving it blank generates a new random map on each click.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Lock Seed', 'olsson-world' ); ?> (Off / On):</strong> <?php esc_html_e( 'When set to On, captures and displays the active random seed in the seed field so you can keep or share it.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Iterations', 'olsson-world' ); ?> (1–5000):</strong> <?php esc_html_e( 'The number of tectonic fault-line passes that uplift and depress continental plates.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Smoothing Range', 'olsson-world' ); ?> (0–100):</strong> <?php esc_html_e( 'Applies separable neighbor elevation averaging to smooth jagged fault lines.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Generate Map', 'olsson-world' ); ?>:</strong> <?php esc_html_e( 'Runs the simulation and renders the map onto the canvas.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Download Map (PNG)', 'olsson-world' ); ?>:</strong> <?php esc_html_e( 'Appears after generation; saves the rendered map canvas as a PNG image file.', 'olsson-world' ); ?></li>
                    <li><strong><?php esc_html_e( 'Help', 'olsson-world' ); ?>:</strong> <?php esc_html_e( 'Opens this modal guide.', 'olsson-world' ); ?></li>
                </ul>
                <div class="ow-help-modal-actions">
                    <button type="button" class="button button-primary wp-element-button ow-help-close-btn"><?php esc_html_e( 'Close', 'olsson-world' ); ?></button>
                </div>
            </div>
        </div>
    </div>
    <script>
    document.addEventListener("DOMContentLoaded", function() {
        if (typeof initOlssonWorld === "function") {
            initOlssonWorld(document.getElementById("<?php echo esc_js( $block_id ); ?>"));
        }
    });
    </script>
    <?php
    return ob_get_clean();
}
