/**
 * Olsson World Fractal Map Generator - Vanilla JavaScript Port
 * Based on C implementation by John Olsson (1999) with clean standard projection mapping
 */

function initOlssonWorld(container) {
    if (!container) return;

    const form = container.querySelector('.olsson-world-form');
    const canvas = container.querySelector('.ow-map-canvas');
    const ctx = canvas.getContext('2d');
    const generateBtn = container.querySelector('.ow-generate-btn');
    const downloadBtn = container.querySelector('.ow-download-btn');
    const projectionSelect = form.querySelector('.ow-projection');
    const scrollLabel = form.querySelector('.ow-scroll-label');
    const seedInput = form.querySelector('.ow-seed');
    const lockSeedSelect = form.querySelector('.ow-lock-seed');

    let currentSeed = seedInput && seedInput.value ? parseInt(seedInput.value, 10) : 0;

    // Dynamic scroll / rotate label update
    function updateScrollLabel() {
        const proj = projectionSelect.value;
        if (proj === 'Square' || proj === 'Mercator') {
            scrollLabel.textContent = 'Scroll:';
        } else {
            scrollLabel.textContent = 'Rotate Degrees:';
        }
    }

    projectionSelect.addEventListener('change', updateScrollLabel);
    updateScrollLabel();

    // Color palettes from John Olsson's C code
    const olssonOriginal = 'olssonOriginal';
    const greenBlue = 'greenBlue';
    const colorset = {};
    colorset[olssonOriginal] = [
        [0,0,0], [0,0,68], [0,17,102], [0,51,136], [0,85,170], [0,119,187], [0,153,221], [0,204,255],
        [34,221,255], [68,238,255], [102,255,255], [119,255,255], [136,255,255], [153,255,255], [170,255,255], [187,255,255],
        [0,68,0], [34,102,0], [34,136,0], [119,170,0], [187,221,0], [255,187,34], [238,170,34], [221,136,34],
        [204,136,34], [187,102,34], [170,85,34], [153,85,34], [136,68,34], [119,51,34], [85,51,17], [68,34,0],
        [255,255,255], [250,250,250], [245,245,245], [240,240,240], [235,235,235], [230,230,230], [225,225,225], [220,220,220],
        [215,215,215], [210,210,210], [205,205,205], [200,200,200], [195,195,195], [190,190,190], [185,185,185], [180,180,180],
        [175,175,175]
    ];
    colorset[greenBlue] = (function() {
        const arr = [];
        for (let i = 0; i < 49; i++) {
            if (i < 16) {
                arr.push([0, Math.floor(i * 12), 120 + Math.floor(i * 8)]);
            } else if (i < 32) {
                arr.push([34 + Math.floor((i - 16) * 10), 139 + Math.floor((i - 16) * 4), 34]);
            } else {
                arr.push([240, 240, 255]);
            }
        }
        return arr;
    })();
    colorset['Olsson Original'] = colorset[olssonOriginal];
    colorset['Green/Blue'] = colorset[greenBlue];

    const terrainSnow = [];
    for (let i = 0; i < 49; i++) {
        if (i === 0) {
            terrainSnow.push([0, 0, 0]);
        } else if (i < 16) {
            const t = (i - 1) / 14;
            terrainSnow.push([
                Math.floor(t * 80),
                Math.floor(40 + t * 160),
                Math.floor(120 + t * 135)
            ]);
        } else if (i < 26) {
            const t = (i - 16) / 9;
            let r, g, b;
            if (t < 0.35) {
                const subT = t / 0.35;
                r = Math.floor(34 + subT * 126);
                g = Math.floor(139 + subT * 36);
                b = Math.floor(34 + subT * 11);
            } else if (t < 0.65) {
                const subT = (t - 0.35) / 0.3;
                r = Math.floor(160 - subT * 60);
                g = Math.floor(175 - subT * 95);
                b = Math.floor(45 - subT * 15);
            } else {
                const subT = (t - 0.65) / 0.35;
                r = Math.floor(100 - subT * 57);
                g = Math.floor(80 - subT * 57);
                b = Math.floor(30 - subT * 30);
            }
            terrainSnow.push([r, g, b]);
        } else {
            const t = (i - 26) / 22;
            const gray = Math.floor(180 + t * 75);
            terrainSnow.push([gray, gray, gray]);
        }
    }
    colorset['Terrain & Snow'] = terrainSnow;
    colorset['terrainSnow'] = terrainSnow;
    colorset['Two Colors'] = colorset[olssonOriginal];

    const twelveColors = [];
    twelveColors.push([0, 0, 0]);

    const oceanStops = [
        [10, 20, 60],
        [20, 40, 100],
        [40, 90, 160],
        [100, 170, 230]
    ];
    const landStops = [
        [60, 160, 60],
        [90, 140, 50],
        [200, 160, 40],
        [130, 85, 30],
        [43, 23, 0]
    ];
    const snowStops = [
        [160, 160, 160],
        [210, 210, 210],
        [255, 255, 255]
    ];

    function interpolateColors(stops, count) {
        const result = [];
        for (let i = 0; i < count; i++) {
            const pos = (i / (count - 1)) * (stops.length - 1);
            const idx1 = Math.floor(pos);
            const idx2 = Math.min(stops.length - 1, Math.ceil(pos));
            const frac = pos - idx1;
            const c1 = stops[idx1];
            const c2 = stops[idx2];
            result.push([
                Math.round(c1[0] + (c2[0] - c1[0]) * frac),
                Math.round(c1[1] + (c2[1] - c1[1]) * frac),
                Math.round(c1[2] + (c2[2] - c1[2]) * frac)
            ]);
        }
        return result;
    }

    twelveColors.push(...interpolateColors(oceanStops, 15));
    twelveColors.push(...interpolateColors(landStops, 10));
    twelveColors.push(...interpolateColors(snowStops, 23));

    colorset['Twelve Colors'] = twelveColors;

    // Helper for true mathematical modulo in JS
    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    function generateMap() {
        const percentWater = parseInt(form.querySelector('.ow-water').value, 10);
        const percentIce = parseInt(form.querySelector('.ow-ice').value, 10);
        const height = parseInt(form.querySelector('.ow-height').value, 10) || 900;
        const projection = projectionSelect.value;
        const scrollDegrees = parseInt(form.querySelector('.ow-scroll').value, 10) || 0;
        const colorScheme = form.querySelector('.ow-colors').value;
        const seedVal = seedInput ? seedInput.value.trim() : '';
        let seedNum;
        if (seedVal !== '' && !isNaN(seedVal)) {
            seedNum = parseInt(seedVal, 10);
            currentSeed = seedNum;
        } else {
            seedNum = Math.floor(Math.random() * 2147483647);
            currentSeed = seedNum;
            if (lockSeedSelect && lockSeedSelect.value === 'on') {
                seedInput.value = currentSeed;
            }
        }
        const rawIterations = parseInt(form.querySelector('.ow-iterations').value, 10) || 500;
        const smoothingRange = parseInt(form.querySelector('.ow-smoothing').value, 10) || 0;

        const palette = colorset[colorScheme] || colorset[olssonOriginal];

        // Determine XRange and YRange based on projection
        let XRange, YRange;
        const PI = Math.PI;

        if (projection === 'Mercator') {
            YRange = height;
            XRange = Math.floor((YRange * PI) / 2);
            if (2 * Math.floor(XRange / 2) !== XRange) XRange++;
        } else {
            YRange = height;
            XRange = 2 * YRange;
        }

        // Seeded PRNG (Mulberry32)
        let s = seedNum;
        function random() {
            s += 0x6D2B79F5;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }

        // Initialize WorldMapArray
        const WorldMapArray = new Int32Array(XRange * YRange);
        for (let i = 0; i < XRange * YRange; i++) {
            WorldMapArray[i] = -2147483648; // INT_MIN
        }

        for (let j = 0, row = 0; j < XRange; j++) {
            WorldMapArray[row] = 0;
            row += YRange;
        }

        const SinIterPhi = new Float32Array(2 * XRange);
        for (let i = 0; i < XRange; i++) {
            SinIterPhi[i] = SinIterPhi[i + XRange] = Math.sin(i * 2 * PI / XRange);
        }

        const YRangeDiv2 = YRange / 2;
        const YRangeDivPI = YRange / PI;

        // Automatically scale iterations based on map height
        const iterations = Math.max(rawIterations, Math.floor(rawIterations * (height / 160)));

        // Run iterations (fault lines) - Mercator uses GenerateMercatorWorldMap formula
        for (let a = 0; a < iterations; a++) {
            const flag1 = (Math.floor(random() * 0x7FFFFFFF) & 1);
            const Alpha = (random() - 0.5) * PI;
            const Beta = (random() - 0.5) * PI;
            const TanB = Math.tan(Math.acos(Math.cos(Alpha) * Math.cos(Beta)));

            let row = 0;
            const Xsi = Math.floor(XRange / 2 - (XRange / PI) * Beta);

            for (let Phi = 0; Phi < XRange / 2; Phi++) {
                const idx = mod(Xsi - Phi, 2 * XRange);
                const thetaArg = SinIterPhi[idx] * TanB;
                
                let Theta;
                if (projection === 'Mercator') {
                    Theta = Math.floor(Math.tan(Math.atan(thetaArg) / 2) * YRangeDiv2) + YRangeDiv2;
                } else {
                    Theta = Math.floor(YRangeDivPI * Math.atan(thetaArg)) + YRangeDiv2;
                }

                const targetRowTheta = row + Math.max(0, Math.min(YRange - 1, Theta));
                if (flag1) {
                    if (WorldMapArray[targetRowTheta] !== -2147483648) {
                        WorldMapArray[targetRowTheta]--;
                    } else {
                        WorldMapArray[targetRowTheta] = -1;
                    }
                } else {
                    if (WorldMapArray[targetRowTheta] !== -2147483648) {
                        WorldMapArray[targetRowTheta]++;
                    } else {
                        WorldMapArray[targetRowTheta] = 1;
                    }
                }
                row += YRange;
            }
        }

        // Symmetry copy
        const index2 = Math.floor(XRange / 2) * YRange;
        for (let j = 0, row = 0; j < Math.floor(XRange / 2); j++) {
            for (let i = 1; i < YRange; i++) {
                WorldMapArray[row + index2 + YRange - i] = WorldMapArray[row + i];
            }
            row += YRange;
        }

        // Reconstruct WorldMap
        for (let j = 0, row = 0; j < XRange; j++) {
            let Color = WorldMapArray[row];
            for (let i = 1; i < YRange; i++) {
                const Cur = WorldMapArray[row + i];
                if (Cur !== -2147483648) {
                    Color += Cur;
                }
                WorldMapArray[row + i] = Color;
            }
            row += YRange;
        }

        // Apply smoothing if smoothingRange > 0
        if (smoothingRange > 0) {
            const R = Math.min(100, Math.max(0, smoothingRange));
            const temp = new Float64Array(XRange * YRange);
            const size = 2 * R + 1;

            for (let y = 0; y < YRange; y++) {
                let sum = 0;
                for (let dx = -R; dx <= R; dx++) {
                    const nx = mod(dx, XRange);
                    sum += WorldMapArray[nx * YRange + y];
                }
                temp[y] = sum / size;

                for (let x = 1; x < XRange; x++) {
                    const outX = mod(x - R - 1, XRange);
                    const inX = mod(x + R, XRange);
                    sum += WorldMapArray[inX * YRange + y] - WorldMapArray[outX * YRange + y];
                    temp[x * YRange + y] = sum / size;
                }
            }

            for (let x = 0; x < XRange; x++) {
                const rowOffset = x * YRange;
                for (let y = 0; y < YRange; y++) {
                    let sum = 0;
                    let count = 0;
                    for (let dy = -R; dy <= R; dy++) {
                        const ny = Math.max(0, Math.min(YRange - 1, y + dy));
                        sum += temp[x * YRange + ny];
                        count++;
                    }
                    WorldMapArray[rowOffset + y] = Math.round(sum / count);
                }
            }
        }

        let MaxZ = 1, MinZ = -1;
        for (let j = 0; j < XRange * YRange; j++) {
            const Color = WorldMapArray[j];
            if (Color > MaxZ) MaxZ = Color;
            if (Color < MinZ) MinZ = Color;
        }

        const Histogram = new Int32Array(256);
        for (let j = 0, row = 0; j < XRange; j++) {
            for (let i = 0; i < YRange; i++) {
                let Color = WorldMapArray[row + i];
                Color = Math.floor(((Color - MinZ + 1) / (MaxZ - MinZ + 1)) * 30) + 1;
                if (Color >= 0 && Color < 256) Histogram[Color]++;
            }
            row += YRange;
        }

        let Threshold = Math.floor(percentWater * XRange * YRange / 100);
        let Count = 0, jThreshold = 0;
        for (let j = 0; j < 256; j++) {
            Count += Histogram[j];
            if (Count > Threshold) {
                jThreshold = j;
                break;
            }
        }
        Threshold = jThreshold * (MaxZ - MinZ + 1) / 30 + MinZ;

        if (colorScheme === 'Two Colors') {
            for (let j = 0, row = 0; j < XRange; j++) {
                for (let i = 0; i < YRange; i++) {
                    const Color = WorldMapArray[row + i];
                    WorldMapArray[row + i] = (Color < Threshold) ? 3 : 20;
                }
                row += YRange;
            }
        } else {
            for (let j = 0, row = 0; j < XRange; j++) {
                for (let i = 0; i < YRange; i++) {
                    let Color = WorldMapArray[row + i];
                    if (Color < Threshold) {
                        Color = Math.floor(((Color - MinZ) / (Threshold - MinZ)) * 15) + 1;
                    } else {
                        Color = Math.floor(((Color - Threshold) / (MaxZ - Threshold)) * 15) + 16;
                    }
                    if (Color < 1) Color = 1;
                    if (Color > 255) Color = 31;
                    WorldMapArray[row + i] = Color;
                }
                row += YRange;
            }
        }

        // Ice caps / flood fill
        if (colorScheme !== 'Two Colors') {
            const iceThreshold = Math.floor(percentIce * XRange * YRange / 100);
            if (iceThreshold > 0 && iceThreshold <= XRange * YRange) {
                let filledPixels = 0;

                function floodFill(startX, startY, oldColor) {
                    const stack = [[startX, startY]];
                    while (stack.length > 0 && filledPixels <= iceThreshold) {
                        const [x, y] = stack.pop();
                        const idx = x * YRange + y;
                        if (WorldMapArray[idx] === oldColor) {
                            WorldMapArray[idx] = (oldColor < 16) ? 32 : (oldColor + 17);
                            filledPixels++;
                            if (filledPixels > iceThreshold) return;
                            if (y - 1 > 0) stack.push([x, y - 1]);
                            if (y + 1 < YRange) stack.push([x, y + 1]);
                            
                            const leftX = (x - 1 < 0) ? XRange - 1 : x - 1;
                            const rightX = (x + 1 >= XRange) ? 0 : x + 1;
                            stack.push([leftX, y]);
                            stack.push([rightX, y]);
                        }
                    }
                }

                // North Pole pass
                filledPixels = 0;
                let northDone = false;
                for (let i = 0; i < YRange && !northDone; i++) {
                    for (let j = 0, row = 0; j < XRange; j++) {
                        const Color = WorldMapArray[row + i];
                        if (Color < 32) {
                            floodFill(j, i, Color);
                            if (filledPixels > iceThreshold) {
                                northDone = true;
                                break;
                            }
                        }
                        row += YRange;
                    }
                }

                // South Pole pass
                filledPixels = 0;
                let southDone = false;
                for (let i = YRange - 1; i > 0 && !southDone; i--) {
                    for (let j = 0, row = 0; j < XRange; j++) {
                        const Color = WorldMapArray[row + i];
                        if (Color < 32) {
                            floodFill(j, i, Color);
                            if (filledPixels > iceThreshold) {
                                southDone = true;
                                break;
                            }
                        }
                        row += YRange;
                    }
                }
            }
        }

        // Apply scroll rotation if needed for Square / Mercator
        let finalMap = WorldMapArray;
        if (projection === 'Square' || projection === 'Mercator') {
            if (scrollDegrees !== 0) {
                const shiftX = Math.floor((scrollDegrees / 360) * XRange);
                finalMap = new Int32Array(XRange * YRange);
                for (let x = 0; x < XRange; x++) {
                    const srcX = mod(x - shiftX, XRange);
                    for (let y = 0; y < YRange; y++) {
                        finalMap[x * YRange + y] = WorldMapArray[srcX * YRange + y];
                    }
                }
            }
        }

        // Determine canvas dimensions based on projection
        let canvasWidth = XRange;
        let canvasHeight = YRange;
        let Diameter = height;
        let Radius = Math.floor(Diameter / 2);

        if (projection === 'Spherical' || projection === 'Orthographic NP' || projection === 'Orthographic SP') {
            canvasWidth = Diameter;
            canvasHeight = Diameter;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const imgData = ctx.createImageData(canvasWidth, canvasHeight);
        const data = imgData.data;

        const scrollRadians = (scrollDegrees * PI) / 180;

        if (projection === 'Square') {
            for (let x = 0; x < XRange; x++) {
                const rowOffset = x * YRange;
                for (let y = 0; y < YRange; y++) {
                    let colorIdx = finalMap[rowOffset + y];
                    if (colorIdx < 0) colorIdx = 0;
                    if (colorIdx >= palette.length) colorIdx = palette.length - 1;

                    const destIdx = (y * XRange + x) * 4;
                    const rgb = palette[colorIdx];
                    data[destIdx]     = rgb[0];
                    data[destIdx + 1] = rgb[1];
                    data[destIdx + 2] = rgb[2];
                    data[destIdx + 3] = 255;
                }
            }
        } else if (projection === 'Mercator') {
            for (let x = 0; x < XRange; x++) {
                const rowOffset = x * YRange;
                for (let y = 0; y < YRange; y++) {
                    let colorIdx = finalMap[rowOffset + y];
                    if (colorIdx < 0) colorIdx = 0;
                    if (colorIdx >= palette.length) colorIdx = palette.length - 1;

                    const destIdx = (y * XRange + x) * 4;
                    const rgb = palette[colorIdx];
                    data[destIdx]     = rgb[0];
                    data[destIdx + 1] = rgb[1];
                    data[destIdx + 2] = rgb[2];
                    data[destIdx + 3] = 255;
                }
            }
        } else if (projection === 'Spherical') {
            for (let cury = 0; cury < Diameter; cury++) {
                for (let curx = 0; curx < Diameter; curx++) {
                    const nx = (curx - Radius) / Radius;
                    const ny = (cury - Radius) / Radius;
                    const z2 = 1 - nx * nx - ny * ny;
                    const destIdx = (cury * Diameter + curx) * 4;

                    if (z2 >= 0) {
                        const nz = Math.sqrt(z2);
                        const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
                        const lon = Math.atan2(nx, nz) + scrollRadians;

                        const mappedX = mod(Math.floor(((lon + PI) / (2 * PI)) * XRange), XRange);
                        const mappedY = Math.max(0, Math.min(YRange - 1, Math.floor(((PI / 2 - lat) / PI) * YRange)));

                        let colorIdx = finalMap[mappedX * YRange + mappedY];
                        if (colorIdx < 0) colorIdx = 0;
                        if (colorIdx >= palette.length) colorIdx = palette.length - 1;

                        const rgb = palette[colorIdx];
                        data[destIdx]     = rgb[0];
                        data[destIdx + 1] = rgb[1];
                        data[destIdx + 2] = rgb[2];
                        data[destIdx + 3] = 255;
                    } else {
                        data[destIdx + 3] = 0; // transparent outside globe
                    }
                }
            }
        } else if (projection === 'Orthographic NP') {
            for (let cury = 0; cury < Diameter; cury++) {
                for (let curx = 0; curx < Diameter; curx++) {
                    const nx = (curx - Radius) / Radius;
                    const ny = (cury - Radius) / Radius;
                    const r2 = nx * nx + ny * ny;
                    const destIdx = (cury * Diameter + curx) * 4;

                    if (r2 <= 1) {
                        const lat = (PI / 2) * Math.sqrt(r2);
                        const lon = Math.atan2(ny, nx) + scrollRadians;

                        const mappedX = mod(Math.floor(((lon + PI) / (2 * PI)) * XRange), XRange);
                        const mappedY = Math.max(0, Math.min(YRange - 1, Math.floor((lat / (PI / 2)) * YRange)));

                        let colorIdx = finalMap[mappedX * YRange + mappedY];
                        if (colorIdx < 0) colorIdx = 0;
                        if (colorIdx >= palette.length) colorIdx = palette.length - 1;

                        const rgb = palette[colorIdx];
                        data[destIdx]     = rgb[0];
                        data[destIdx + 1] = rgb[1];
                        data[destIdx + 2] = rgb[2];
                        data[destIdx + 3] = 255;
                    } else {
                        data[destIdx + 3] = 0;
                    }
                }
            }
        } else if (projection === 'Orthographic SP') {
            for (let cury = 0; cury < Diameter; cury++) {
                for (let curx = 0; curx < Diameter; curx++) {
                    const nx = (curx - Radius) / Radius;
                    const ny = (cury - Radius) / Radius;
                    const r2 = nx * nx + ny * ny;
                    const destIdx = (cury * Diameter + curx) * 4;

                    if (r2 <= 1) {
                        const lat = (PI / 2) + (PI / 2) * (1 - Math.sqrt(r2));
                        const lon = Math.atan2(ny, nx) + scrollRadians;

                        const mappedX = mod(Math.floor(((lon + PI) / (2 * PI)) * XRange), XRange);
                        const mappedY = Math.max(0, Math.min(YRange - 1, Math.floor((lat / PI) * YRange)));

                        let colorIdx = finalMap[mappedX * YRange + mappedY];
                        if (colorIdx < 0) colorIdx = 0;
                        if (colorIdx >= palette.length) colorIdx = palette.length - 1;

                        const rgb = palette[colorIdx];
                        data[destIdx]     = rgb[0];
                        data[destIdx + 1] = rgb[1];
                        data[destIdx + 2] = rgb[2];
                        data[destIdx + 3] = 255;
                    } else {
                        data[destIdx + 3] = 0;
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // Show download button
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-block';
        }
    }

    generateBtn.addEventListener('click', generateMap);

    if (lockSeedSelect) {
        lockSeedSelect.addEventListener('change', function() {
            if (lockSeedSelect.value === 'on') {
                seedInput.value = currentSeed;
            } else {
                seedInput.value = '';
            }
        });
    }

    if (seedInput) {
        seedInput.addEventListener('input', function() {
            const val = parseInt(seedInput.value, 10);
            if (!isNaN(val)) {
                currentSeed = val;
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const link = document.createElement('a');
            link.download = 'world-map.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    // Auto-generate on load
    generateMap();
}
