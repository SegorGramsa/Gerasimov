makePool = function(w, h) {

    let makeArray = function() {
        let array = new Uint8Array(w * h);
        let max = 0;
        let that = {};

        that.checkIJ = function(i, j) {
            return (0 <= i && i < h &&
                0 <= j && j < w);
        }
        that.setVal = function(i, j, val) {
            array[i * w + j] = val;
            if (max < val) {
                max = val;
            }
        };

        that.getVal = function(i, j) {
            if (that.checkIJ(i, j)) {
                return array[i * w + j];
            } else {
                return -1;
            }
        };

        that.getMax = function() {
            return max;
        };

        that.makeImage = function() {
            let imageArray = new Uint8ClampedArray(w * h * 4);
            for (let i = 0; i < w * h; i++) {
                let b = 255 * array[i] / max;
                imageArray[4 * i] = b;
                imageArray[4 * i + 1] = b;
                imageArray[4 * i + 2] = b;
                imageArray[4 * i + 3] = 255;
            }
            return new ImageData(imageArray, w, h);
        };

        that.setForEach = function(f) {
            array.forEach(function(val, ind) {
                let j = ind % w;
                let i = (ind - j) / w;
                that.setVal(i, j, f(i, j) || array[ind]);
            });
        };

        that.forEach = function(f) {
            array.forEach(function(val, ind) {
                let j = ind % w;
                let i = (ind - j) / w;
                f(i, j);
            });
        };

        return that;
    }

    let borders = (function() {
        let b = [];
        for (let i = 0; i < h; i++) {
            b.push([i, 0]);
            b.push([i, w - 1]);
        }
        for (let j = 1; j < w - 1; j++) {
            b.push([0, j]);
            b.push([h - 1, j]);
        }
        return b;
    }());


    let [neighbors4, neighbors8, neighborsC] = function() {
        let neighbors = function(a) {
            return function(i, j) {
                return a.map(function([ii, jj]) {
                    return [i + ii, j + jj];
                }).filter(function([ii, jj]) {
                    return (0 <= ii && ii < h &&
                        0 <= jj && jj < w);
                });
            }
        };
        let a4 = [[-1, 0],
                  [1, 0],
                  [0, -1],
                  [0, 1]];
        let a8 = [...a4,
                  [-1, -1],
                  [-1, 1],
                  [1, -1],
                  [1, 1]];
        let aCross = [[-1, -1],
                      [-1, 1],
                      [1, -1],
                      [1, 1]];
        return [neighbors(a4), neighbors(a8), neighbors(aCross)];
    }();

    let gcd = function(a, b) {
        return !b ? a : gcd(b, a % b);
    };

    let mirrorFold = function(x, l) {
        let xf = x % (2 * l);
        xf = (xf < l) ? xf : (2 * l - xf - 1);
        return xf;
    };

    let getChain = function(a, i, j, collectCorners) {
        let chain = [[i, j]],
            corners = [],
            chainColor = a.getVal(i, j),
            stop = false;

        let getBorderConers = function(i, j) {
            if (i == 0 || i == h - 1 ||
                j == 0 || j == w - 1) {
                return neighborsC(i, j);
            }
        };

        while (!stop) {
            let [li, lj] = chain[chain.length - 2] || [i, j];
            let [ci, cj] = chain[chain.length - 1];
            if (collectCorners) {
                let bc = getBorderConers(ci, cj);
                if (bc) {
                    corners.push(...(bc.filter(function([ii, jj]) {
                        return a.getVal(ii, jj) === chainColor;
                    })));
                }
            }
            let cNeighbors = neighbors4(ci, cj);
            let next = cNeighbors.findIndex(function([ii, jj]) {
                return ((ii !== i || jj !== j) &&
                    (ii !== li || jj !== lj) &&
                    a.getVal(ii, jj) === chainColor);
            });
            stop = (next === -1);
            if (!stop) {
                chain.push(cNeighbors[next]);
                if (collectCorners) {
                    [ni, nj] = cNeighbors[next];
                    if (ni - ci !== ci - li &&
                        nj - cj !== cj - lj) {
                        let cori = 3 * ci - ni - li,
                            corj = 3 * cj - nj - lj;
                        if (a.getVal(cori, corj) === chainColor) {
                            corners.push([cori, corj]);
                        }
                    }
                }
            }
        }

        return [chain, corners];
    }

    let that = {};

    that.initArray = (function() {
        let initArray = makeArray(),
            sidesGcd = gcd(w, h),
            steps = Math.floor((w * h / sidesGcd + 1) / 2),
            i = 0,
            j = 0;
        for (let s = 0; s < steps; s++) {
            i = mirrorFold(2 * s, h);
            j = mirrorFold(2 * s, w);
            initArray.setVal(i, j, 1);
        }
        return initArray;
    }());

    if (gcd(w, h) > 1) return this;

    that.openChains = (function() {
        let openChains = makeArray();
        borders.forEach(function([i, j]) {
            if (that.initArray.getVal(i, j) === 1 &&
                openChains.getVal(i, j) === 0) {
                let [chain, ] = getChain(that.initArray, i, j);
                chain.forEach(function([ii, jj]) {
                    openChains.setVal(ii, jj, 1);
                });
            }
        });
        return openChains;
    }());

    [that.closedChains, that.openArea] = (function() {
        let closedChains = makeArray();
        let openArea = makeArray();

        let colorOpenArea = function(startNodes, val) {
            let nextNodes = [];
            while (startNodes.length !== 0) {
                startNodes.forEach(function([i, j]) {
                    if (that.initArray.getVal(i, j) === 0 &&
                        openArea.getVal(i, j) !== val) {
                        let [chain, corners] = getChain(that.initArray, i, j, true);
                        chain.forEach(function([ii, jj]) {
                            openArea.setVal(ii, jj, val);
                        });
                        nextNodes.push(...corners);
                    }
                });
                startNodes = nextNodes;
                nextNodes = [];
            }
        };

        colorOpenArea(borders, 1);

        closedChains.setForEach(function(i, j) {
            if (that.initArray.getVal(i, j) !== 1 ||
                that.openChains.getVal(i, j) !== 0) {
                return 0;
            }
            return (neighbors8(i, j).some(function([ii, jj]) {
                return (openArea.getVal(ii, jj) === 1);
            }) ? 1 : 0);
        });

        let level = 2;
        let stop = false;
        while (!stop) {
            let startNodes = [];
            closedChains.forEach(function(i, j) {
                if (closedChains.getVal(i, j) === level - 1) {
                    startNodes.push(...neighbors4(i, j).filter(function([ii, jj]) {
                        return (openArea.getVal(ii, jj) === 0);
                    }));
                }
            });

            colorOpenArea(startNodes, level);

            closedChains.setForEach(function(i, j) {
                if (that.initArray.getVal(i, j) === 1 &&
                    that.openChains.getVal(i, j) === 0 &&
                    closedChains.getVal(i, j) === 0 &&
                    neighbors8(i, j).some(function([ii, jj]) {
                        return (openArea.getVal(ii, jj) === level);
                    })) {
                    return level;
                }

            });

            stop = (closedChains.getMax() < level);
            level += 1;
        }
        return [closedChains, openArea];
    }());

    return that;

};
