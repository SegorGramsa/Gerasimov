let makeFractalView = function(ctx) {
    let imageCache = (function() {
        let cache = {};
        let sheduled = {};
        let that = {};
        let indToString = (i, j) => i.toString() + " " + j.toString();
        that.setSheduled = function(i, j) {
            sheduled[indToString(i, j)] = true;
        }
        that.isSheduled = function(i, j) {
            return sheduled[indToString(i, j)];
        }
        that.setVal = function(i, j, val) {
            let str = indToString(i, j);
            delete sheduled[str];
            cache[str] = val;
        }
        that.getVal = function(i, j) {
            return cache[indToString(i, j)];
        }
        return that;
    }());

    let offset = 1;
    let indFromPos = function(x) {
        return Math.floor(0.5 - offset + Math.sqrt(Math.pow(0.5 + offset, 2) + 2 * x));
    }
    let posFormInd = function(i) {
        return (i * i + i * (2 * offset - 1)) / 2;
    }

    let range = [0, 0, 0, 0];
    let setRange = function(newRange) {
        if (!range.some((e, i) => newRange[i] !== e)) return false;
        range = newRange;
        return true;
    }
    let forRange = function(f) {
        for (let i = range[0]; i < range[1]; i++) {
            for (let j = range[2]; j < range[3]; j++) {
                f(i, j);
            }
        }
    };

    that = {};
    that.x0 = 0;
    that.y0 = 0;
    that.w = 0;
    that.h = 0;

    let imagesToCalc = 0;

    let scheduleImagesCalc = function() {
        forRange(function(i, j) {
            if (!imageCache.getVal(i, j) && !imageCache.isSheduled(i, j)) {
                imageCache.setSheduled(i, j);
                imagesToCalc += 1;
                setTimeout(function() {
                    let p = makePool(j, i);
                    if (p.closedChains) {
                        imageCache.setVal(i, j, p.closedChains.makeImage());
                    }
                    imagesToCalc -= 1;
                }, 0);
            }
        });
    }

    that.setFrame = function(x0, y0, w, h, scale) {
        that.x0 = x0;
        that.y0 = y0;
        that.w = w;
        that.h = h;
        let isNewRange = setRange([indFromPos(y0),
                                   indFromPos(y0 + h - 2) + 1,
                                   indFromPos(x0),
                                   indFromPos(x0 + w - 2) + 1]);
        if (isNewRange) scheduleImagesCalc();
        //that.draw();
    }

    that.draw = function() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, that.w, that.h);
        forRange(function(i, j) {
            let image = imageCache.getVal(i, j);
            if (image) {
                ctx.putImageData(image,
                    posFormInd(j) - that.x0,
                    posFormInd(i) - that.y0);
            }
        });
        return (imagesToCalc === 0);
    }

    return that;
};
