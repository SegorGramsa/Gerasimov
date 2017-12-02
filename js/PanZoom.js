let makePanZoom = function(domElement = document) {
    let STATE = {
        NONE: -1,
        PAN: 0,
        ZOOM: 1
    }

    let that = {};

    let position = [0, 0];
    that.getPosition = function() {
        return position;
    };
    let scale = 1;
    that.getScale = function() {
        return scale;
    };

    that.enabled = true;
    that.state = STATE.NONE;
    that.screen = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };



    that.handleResize = function() {
        if (domElement === document) {
            screen.left = 0;
            screen.top = 0;
            screen.width = window.innerWidth;
            screen.height = window.innerHeight;
        } else {
            let box = domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            let d = domElement.ownerDocument.documentElement;
            screen.left = box.left + window.pageXOffset - d.clientLeft;
            screen.top = box.top + window.pageYOffset - d.clientTop;
            screen.width = box.width;
            screen.height = box.height;
        }
    };

    let pan = function() {

    };

    let zoom = function() {

    };

    that.update = function() {
        pan();
        zoom();
    };

    let dispatch = function() {
        let event = new CustomEvent('panZoom', {
            detail: {
                position: position,
                scale: scale
            }
        });
        domElement.dispatchEvent(event);
    }

    let mousemove = function(event) {
        if (event.buttons !== 1) return;
        position[0] -= event.movementX;
        position[1] -= event.movementY;
        dispatch();
    };

    let wheel = function(event) {};

    domElement.addEventListener('mousemove', mousemove, false);
    domElement.addEventListener('wheel', wheel, false);

    that.handleResize();
    that.update();

    return that;
};
