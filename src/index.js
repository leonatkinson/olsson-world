/**
 * Gutenberg Block Registration for Olsson World Map Generator
 */
( function( blocks, element ) {
    var el = element.createElement;

    blocks.registerBlockType( 'olsson-world/map-generator', {
        title: 'Olsson World Map Generator',
        icon: 'admin-site-alt3',
        category: 'widgets',
        edit: function( props ) {
            return el(
                'div',
                { className: props.className + ' olsson-world-editor-preview' },
                el( 'div', { style: { padding: '20px', background: '#eef2f5', border: '2px dashed #b5c6d0', textAlign: 'center', borderRadius: '4px' } },
                    el( 'h3', { style: { margin: '0 0 10px', color: '#1d2327' } }, '🗺️ Olsson World Map Generator Block' ),
                    el( 'p', { style: { margin: '0 0 15px', color: '#646970' } }, 'This block renders an interactive fractal world map generator form and canvas for your visitors.' ),
                    el( 'div', { style: { background: '#fff', padding: '15px', border: '1px solid #c3c4c7', borderRadius: '4px', display: 'inline-block' } },
                        el( 'strong', {}, 'Parameters:' ),
                        el( 'ul', { style: { textAlign: 'left', margin: '5px 0 0 20px', fontSize: '13px' } },
                            el( 'li', {}, 'Random Seed, Iterations, Water % & Ice %' ),
                            el( 'li', {}, 'Scroll / Rotation Degrees & Map Projections' ),
                            el( 'li', {}, 'Image Height & Color Mode Controls' )
                        )
                    )
                )
            );
        },
        save: function() {
            // Rendered dynamically via PHP render_callback
            return null;
        },
    } );
} )( window.wp.blocks, window.wp.element );
