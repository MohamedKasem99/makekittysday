let sampler = (array) => {
        return array[Math.floor(Math.random() * array.length)];
    }
    /**
     * Uses Delaunay triangulation to divide a rectangle into triangles.
     */
class Triangulator {
    constructor(size, points) {
        this.size = size;
        this.points = points || [];
    }

    getEffectivePoints() {
        const { w, h } = this.size,
            corners = [
                Triangulator.createPoint([0, 0]),
                Triangulator.createPoint([w, 0]),
                Triangulator.createPoint([0, h]),
                Triangulator.createPoint([w, h])
            ];

        return corners.concat(this.points.filter(p => !p.toDelete));
    }

    getTriangles(indexes) {
        const coords = this.getEffectivePoints().map(p => p.coord),
            triangles = Delaunay.triangulate(coords),
            trisList = [];

        //"...it will return you a giant array, arranged in triplets, 
        //    representing triangles by indices into the passed array."
        let a, b, c;
        for (let i = 0; i < triangles.length; i += 3) {
            a = triangles[i];
            b = triangles[i + 1];
            c = triangles[i + 2];
            trisList.push(indexes ? [a, b, c] : [coords[a], coords[b], coords[c]]);
        }
        return trisList;
    }

    static createPoint(coord) {
        return {
            coord: coord.map(Math.round)
                //toDelete: false,
        };
    }
}



/**
 * Renders an image on a canvas, within a maximum bounding box.
 */
class ImageRenderer {
    constructor(onImgLoad) {
        this.canvas = document.createElement('canvas');
        const img = this.image = new Image();

        img.addEventListener('load', e => {
            const w = img.naturalWidth,
                h = img.naturalHeight,
                aspect = w / h;

            this.info = {
                width: w,
                height: h,
                aspect
            };

            onImgLoad(this);
        }, false);
    }

    setSrc(src) {
        this.image.src = src;
    }

    clampSize(maxW, maxH) {
        const info = this.info;
        if (!info) { throw new Error(`No size info yet (${this.image.src})`); }

        const w = info.width,
            h = info.height,
            shrinkageW = maxW / w,
            shrinkageH = maxH / h,
            shrinkage = Math.min(shrinkageW, shrinkageH),
            clamped = shrinkage < 1 ? [w * shrinkage, h * shrinkage] : [w, h];

        return clamped;
    }

    render(canvSize) {
        const canvas = this.canvas;
        if (canvSize) {
            canvas.width = canvSize[0];
            canvas.height = canvSize[1];
        }

        const w = canvas.width,
            h = canvas.height,
            [imgW, imgH] = this.clampSize(w, h),
            padW = (w - imgW) / 2,
            padH = (h - imgH) / 2;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.image, padW, padH, imgW, imgH);
    }
}

/**
 * Draws a warped image on a canvas by comparing a normal and a warped triangulation.
 */
function warpImage(img, triSource, triTarget, canvas, lerpT) {
    const um = ABOUtils.Math,
        uc = ABOUtils.Canvas,
        ug = ABOUtils.Geom;

    function drawTriangle(s1, s2, s3, d1, d2, d3) {
        //TODO: Expand dest ~.5, and source similarly based on area difference..
        //Overlap the destination areas a little
        //to avoid hairline cracks when drawing mulitiple connected triangles.
        const [d1x, d2x, d3x] = [d1, d2, d3], //ug.expandTriangle(d1, d2, d3, .3),
        [s1x, s2x, s3x] = [s1, s2, s3]; //ug.expandTriangle(s1, s2, s3, .3);

        uc.drawImageTriangle(img, ctx,
            s1x, s2x, s3x,
            d1x, d2x, d3x, true);
    }

    const { w, h } = triTarget.size,
        ctx = canvas.getContext('2d'),
        tri1 = triSource.getTriangles(true),
        tri2 = triTarget.getTriangles(true),
        co1 = triSource.getEffectivePoints().map(p => p.coord);

    let co2 = triTarget.getEffectivePoints().map(p => p.coord);
    if (lerpT || lerpT === 0) {
        co2 = um.lerp(co1, co2, lerpT);
    }

    ctx.clearRect(0, 0, w, h);
    tri1.forEach((t1, i) => {
        const corners1 = t1.map(i => co1[i]),
            corners2 = t1.map(i => co2[i]);

        drawTriangle(corners1[0], corners1[1], corners1[2],
            corners2[0], corners2[1], corners2[2]);
    });
}


(function() {
    "use strict";
    console.clear();
    const um = ABOUtils.Math,
        ud = ABOUtils.DOM,
        [$, $$] = ud.selectors();

    let cps_el = $("#cps");
    let totalMa3lish_el = $("#totalMa3lish");
    let cpsValue = 0;
    let clickCount = 0;
    let lastClick = Date.now();
    let now;
    let isSmiling = false;
    let smileAmount = 0;
    let totalMa3lish = 0;

    // clicks per second logic
    function updateCPS() {
        setTimeout(function() {
            now = Date.now();
            cpsValue = (clickCount / (now - lastClick) * 100).toFixed(2);
            updateCPS();
        }, 100);
    }

    function resetClickCount() {
        setTimeout(function() {
            cps_el.innerHTML = cpsValue;
            clickCount = 0
            resetClickCount();
        }, 1000);
    }

    updateCPS();
    resetClickCount();

    let easterEgg_isBusy = false;
    let easterEggsExplosion = () => {
        if (easterEgg_isBusy) { return; }
        let easteregg_el = $(".easteregg");
        easteregg_el.innerHTML = sampler(['😻', '😽', '😇', '🥰', '😍'])
        easteregg_el.classList.toggle('fade-in');
        easterEgg_isBusy = true;
        let audio = new Audio('assets/meow.mp3');
        audio.play();
        setTimeout(() => {
            easteregg_el.classList.toggle('fade-out');
            easterEgg_isBusy = false;
        }, 1500);
    }

    document.getElementById("m3lish_btn").addEventListener("click", () => {
        clickCount++;
        totalMa3lish++;
        totalMa3lish_el.innerHTML = totalMa3lish;
        lastClick = Date.now();
    })


    let _loader1, _loader2;

    const _srcA = 'assets/cat_1.jpeg',
        _srcB = 'assets/cat_2.jpeg',
        _size = {
            w: 400,
            h: 400
        },

        _maxSize = 500,
        _state = {
            size: _size,
            tri1: new Triangulator(_size, [{ "coord": [103, 99] }, { "coord": [135, 99] }, { "coord": [77, 93] }, { "coord": [138, 61] }, { "coord": [85, 58] }, { "coord": [107, 75] }, { "coord": [117, 37] }, { "coord": [123, 79] }, { "coord": [93, 78] }, { "coord": [126, 61] }, { "coord": [69, 56] }]),
            tri2: new Triangulator(_size, [{ "coord": [103, 99] }, { "coord": [135, 86] }, { "coord": [71, 78] }, { "coord": [145, 61] }, { "coord": [86, 56] }, { "coord": [107, 75] }, { "coord": [117, 37] }, { "coord": [126, 78] }, { "coord": [91, 75] }, { "coord": [126, 61] }, { "coord": [69, 56] }]),
            selectedIndex: -1
        };

    new Vue({
        el: '#app',
        data: {
            state: _state,
            morphAnim: null
        },

        mounted() {
            console.log('main mounted');
            this.warp();

            function onLoad(loader) {
                const info1 = _loader1.info,
                    info2 = _loader2.info;

                let size;
                if (info1 && info2) {
                    size = _loader1.clampSize(_maxSize, _maxSize);
                    _loader1.render(size);
                    _loader2.render(size);
                }
                //Render the very first image while we wait for a second one:
                else {
                    size = loader.clampSize(_maxSize, _maxSize);
                    loader.render(size);
                }

                _size.w = size[0];
                _size.h = size[1];
            }

            _loader1 = new ImageRenderer(onLoad);
            _loader2 = new ImageRenderer(onLoad);

            _loader1.setSrc(_srcA);
            _loader2.setSrc(_srcB);
        },
        methods: {
            stopAnim() {
                if (this.morphAnim) { this.morphAnim.cancel(); }
            },
            warp() {
                const c1 = $('#c1'),
                    c2 = $('#c2'),
                    ctx = c1.getContext('2d');

                let skip = false;

                function frame(_) {
                    isSmiling = cpsValue > 0
                    if (isSmiling) {
                        smileAmount = Math.min(smileAmount, 0.9)
                        smileAmount += 0.005
                    } else {
                        smileAmount = Math.max(smileAmount, 0.01)
                        smileAmount -= 0.01
                    }
                    if (cpsValue > 18) { easterEggsExplosion(); }
                    //30fps is more than enough:
                    skip = !skip;
                    if (skip) { return; }

                    warpImage(_loader1.canvas, _state.tri1, _state.tri2, c1, smileAmount);
                    warpImage(_loader2.canvas, _state.tri2, _state.tri1, c2, 1 - smileAmount);
                    //https://stackoverflow.com/questions/2359537/how-to-change-the-opacity-alpha-transparency-of-an-element-in-a-canvas-elemen
                    ctx.save();
                    ctx.globalAlpha = smileAmount;
                    ctx.drawImage(c2, 0, 0);
                    ctx.restore();
                    c2.style.display = 'none';
                }

                this.stopAnim();
                this.morphAnim = ud.animate(3000, frame, true);
            },
        },

        filters: {
            prettyCompact: function(obj) {
                return 'tri1: new Triangulator(_size, ' + JSON.stringify(obj.tri1.points) + '),\n' +
                    'tri2: new Triangulator(_size, ' + JSON.stringify(obj.tri2.points) + '),\n\n';
            }
        }
    });



})();