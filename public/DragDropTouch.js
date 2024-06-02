let DragDropTouch;
(function (DragDropTouch_1) {
  'use strict';

  const OFFSET_Y = 146; // Offset for dragging element above the finger

  let DataTransfer = (function () {
    function DataTransfer() {
      this._dropEffect = 'move';
      this._effectAllowed = 'all';
      this._data = {};
    }
    Object.defineProperty(DataTransfer.prototype, "dropEffect", {
      get: function () {
        return this._dropEffect;
      },
      set: function (value) {
        this._dropEffect = value;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DataTransfer.prototype, "effectAllowed", {
      get: function () {
        return this._effectAllowed;
      },
      set: function (value) {
        this._effectAllowed = value;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DataTransfer.prototype, "types", {
      get: function () {
        return Object.keys(this._data);
      },
      enumerable: true,
      configurable: true
    });
    DataTransfer.prototype.clearData = function (type) {
      if (type !== null) {
        delete this._data[type.toLowerCase()];
      }
      else {
        this._data = {};
      }
    };
    DataTransfer.prototype.getData = function (type) {
      let lcType = type.toLowerCase(),
        data = this._data[lcType];
      if (lcType === "text" && data == null) {
        data = this._data["text/plain"];
      }
      return data || "";
    };
    DataTransfer.prototype.setData = function (type, value) {
      this._data[type.toLowerCase()] = value;
    };
    DataTransfer.prototype.setDragImage = function (img, offsetX, offsetY) {
      let ddt = DragDropTouch._instance;
      ddt._imgCustom = img;
      ddt._imgOffset = { x: offsetX, y: offsetY };
    };
    return DataTransfer;
  }());
  DragDropTouch_1.DataTransfer = DataTransfer;

  let DragDropTouch = (function () {
    function DragDropTouch() {
      this._lastClick = 0;
      if (DragDropTouch._instance) {
        throw 'DragDropTouch instance already created.';
      }
      let supportsPassive = false;
      document.addEventListener('test', function () { }, {
        get passive() {
          supportsPassive = true;
          return true;
        }
      });
      if (navigator.maxTouchPoints) {
        let d = document,
          ts = this._touchstart.bind(this),
          tm = this._touchmove.bind(this),
          te = this._touchend.bind(this),
          opt = supportsPassive ? { passive: false, capture: false } : false;
        d.addEventListener('touchstart', ts, opt);
        d.addEventListener('touchmove', tm, opt);
        d.addEventListener('touchend', te);
        d.addEventListener('touchcancel', te);
      }
    }
    DragDropTouch.getInstance = function () {
      return DragDropTouch._instance;
    };
    DragDropTouch.prototype._touchstart = function (e) {
      let _this = this;
      if (this._shouldHandle(e)) {
        this._reset();
        let src = this._closestDraggable(e.target);
        if (src) {
          if (!this._dispatchEvent(e, 'mousemove', e.target) &&
            !this._dispatchEvent(e, 'mousedown', e.target)) {
            this._dragSource = src;
            this._ptDown = this._getPoint(e);
            this._lastTouch = e;
            setTimeout(function () {
              if (_this._dragSource === src && _this._img === null) {
                if (_this._dispatchEvent(e, 'contextmenu', src)) {
                  _this._reset();
                }
              }
            }, DragDropTouch._CTXMENU);
            if (DragDropTouch._ISPRESSHOLDMODE) {
              this._pressHoldInterval = setTimeout(function () {
                _this._isDragEnabled = true;
                _this._touchmove(e);
              }, DragDropTouch._PRESSHOLDAWAIT);
            }
          }
        }
      }
    };
    DragDropTouch.prototype._touchmove = function (e) {
      if (this._shouldCancelPressHoldMove(e)) {
        this._reset();
        return;
      }
      if (this._shouldHandleMove(e) || this._shouldHandlePressHoldMove(e)) {
        let target = this._getTarget(e);
        if (this._dispatchEvent(e, 'mousemove', target)) {
          this._lastTouch = e;
          e.preventDefault();
          return;
        }
        if (this._dragSource && !this._img && this._shouldStartDragging(e)) {
          if (this._dispatchEvent(this._lastTouch, 'dragstart', this._dragSource)) {
            this._dragSource = null;
            return;
          }
          this._createImage(e);
          this._dispatchEvent(e, 'dragenter', target);
        }
        if (this._img) {
          this._lastTouch = e;
          e.preventDefault();
          this._dispatchEvent(e, 'drag', this._dragSource);
          if (target !== this._lastTarget) {
            this._dispatchEvent(this._lastTouch, 'dragleave', this._lastTarget);
            this._dispatchEvent(e, 'dragenter', target);
            this._lastTarget = target;
          }
          this._moveImage(e);
          this._isDropZone = this._dispatchEvent(e, 'dragover', target);
        }
      }
    };
    DragDropTouch.prototype._touchend = function (e) {
      if (this._shouldHandle(e)) {
        if (this._dispatchEvent(this._lastTouch, 'mouseup', e.target)) {
          e.preventDefault();
          return;
        }
        if (!this._img) {
          this._dragSource = null;
          this._dispatchEvent(this._lastTouch, 'click', e.target);
          this._lastClick = Date.now();
        }
        this._destroyImage();
        if (this._dragSource) {
          if (e.type.indexOf('cancel') < 0 && this._isDropZone) {
            this._dispatchEvent(this._lastTouch, 'drop', this._lastTarget);
          }
          this._dispatchEvent(this._lastTouch, 'dragend', this._dragSource);
          this._reset();
        }
      }
    };
    DragDropTouch.prototype._shouldHandle = function (e) {
      return e &&
        !e.defaultPrevented &&
        e.touches && e.touches.length < 2;
    };
    DragDropTouch.prototype._shouldHandleMove = function (e) {
      return !DragDropTouch._ISPRESSHOLDMODE && this._shouldHandle(e);
    };
    DragDropTouch.prototype._shouldHandlePressHoldMove = function (e) {
      return DragDropTouch._ISPRESSHOLDMODE &&
        this._isDragEnabled && e && e.touches && e.touches.length;
    };
    DragDropTouch.prototype._shouldCancelPressHoldMove = function (e) {
      return DragDropTouch._ISPRESSHOLDMODE && !this._isDragEnabled &&
        this._getDelta(e) > DragDropTouch._PRESSHOLDMARGIN;
    };
    DragDropTouch.prototype._shouldStartDragging = function (e) {
      let delta = this._getDelta(e);
      return delta > DragDropTouch._THRESHOLD ||
        (DragDropTouch._ISPRESSHOLDMODE && delta >= DragDropTouch._PRESSHOLDTHRESHOLD);
    }
    DragDropTouch.prototype._reset = function () {
      this._destroyImage();
      this._dragSource = null;
      this._lastTouch = null;
      this._lastTarget = null;
      this._ptDown = null;
      this._isDragEnabled = false;
      this._isDropZone = false;
      this._dataTransfer = new DataTransfer();
      clearInterval(this._pressHoldInterval);
    };
    DragDropTouch.prototype._getPoint = function (e, page) {
      if (e && e.touches) {
        e = e.touches[0];
      }
      return { x: page ? e.pageX : e.clientX, y: (page ? e.pageY : e.clientY) - OFFSET_Y };
    };
    DragDropTouch.prototype._getDelta = function (e) {
      if (DragDropTouch._ISPRESSHOLDMODE && !this._ptDown) { return 0; }
      let p = this._getPoint(e);
      return Math.abs(p.x - this._ptDown.x) + Math.abs(p.y - this._ptDown.y);
    };
    DragDropTouch.prototype._getTarget = function (e) {
      let pt = this._getPoint(e),
        elements = document.elementsFromPoint(pt.x, pt.y + OFFSET_Y);

      const element = elements[0] || null;

      return element;
    };
    DragDropTouch.prototype._createImage = function (e) {
      if (this._img) {
        this._destroyImage();
      }
      let src = this._imgCustom || this._dragSource;
      this._img = src.cloneNode(true);
      this._copyStyle(src, this._img);
      this._img.style.top = this._img.style.left = '-9999px';
      if (!this._imgCustom) {
        let rc = src.getBoundingClientRect(),
          pt = this._getPoint(e);
        this._imgOffset = { x: pt.x - rc.left, y: (pt.y - rc.top) + OFFSET_Y };
        this._img.style.opacity = DragDropTouch._OPACITY.toString();
      }
      this._moveImage(e);
      document.body.appendChild(this._img);
    };
    DragDropTouch.prototype._destroyImage = function () {
      if (this._img && this._img.parentElement) {
        this._img.parentElement.removeChild(this._img);
      }
      this._img = null;
      this._imgCustom = null;
    };
    DragDropTouch.prototype._moveImage = function (e) {
      let _this = this;
      requestAnimationFrame(function () {
        if (_this._img) {
          let pt = _this._getPoint(e, true),
            s = _this._img.style;
          s.position = 'absolute';
          s.pointerEvents = 'none';
          s.zIndex = '999999';
          s.left = Math.round(pt.x - _this._imgOffset.x) + 'px';
          s.top = Math.round(pt.y - _this._imgOffset.y) + 'px';
        }
      });
    };
    DragDropTouch.prototype._copyProps = function (dst, src, props) {
      for (let i = 0; i < props.length; i++) {
        let p = props[i];
        dst[p] = src[p];
      }
    };
    DragDropTouch.prototype._copyStyle = function (src, dst) {
      DragDropTouch._rmvAtts.forEach(function (att) {
        dst.removeAttribute(att);
      });
      if (src instanceof HTMLCanvasElement) {
        let cSrc = src,
          cDst = dst;
        cDst.width = cSrc.width;
        cDst.height = cSrc.height;
        cDst.getContext('2d').drawImage(cSrc, 0, 0);
      }
      let cs = getComputedStyle(src);
      for (let i = 0; i < cs.length; i++) {
        let key = cs[i];
        if (key.indexOf('transition') < 0) {
          dst.style[key] = cs[key];
        }
      }
      dst.style.pointerEvents = 'none';
      for (let i = 0; i < src.children.length; i++) {
        this._copyStyle(src.children[i], dst.children[i]);
      }
    };
    DragDropTouch.prototype._setOffsetAndLayerProps = function (e, target) {
      let rect = undefined;
      if (e.offsetX === undefined) {
        rect = target.getBoundingClientRect();
        e.offsetX = e.clientX - rect.x;
        e.offsetY = e.clientY - rect.y;
      }
      if (e.layerX === undefined) {
        rect = rect || target.getBoundingClientRect();
        e.layerX = e.pageX - rect.left;
        e.layerY = e.pageY - rect.top;
      }
    }
    DragDropTouch.prototype._dispatchEvent = function (e, type, target) {
      if (e && target) {
        let evt = new Event(type, { bubbles: true, cancelable: true }),
          touch = e.touches ? e.touches[0] : e;
        evt.button = 0;
        evt.which = evt.buttons = 1;
        this._copyProps(evt, e, DragDropTouch._kbdProps);
        this._copyProps(evt, touch, DragDropTouch._ptProps);
        this._setOffsetAndLayerProps(evt, target);
        evt.clientY -= OFFSET_Y; // Adjust the event's clientY by subtracting the offset
        evt.dataTransfer = this._dataTransfer;
        target.dispatchEvent(evt);
        return evt.defaultPrevented;
      }
      return false;
    };
    DragDropTouch.prototype._closestDraggable = function (e) {
      for (; e; e = e.parentElement) {
        if (e.draggable) {
          return e;
        }
      }
      return null;
    };
    return DragDropTouch;
  }());
  DragDropTouch._instance = new DragDropTouch();
  DragDropTouch._THRESHOLD = 5;
  DragDropTouch._OPACITY = 0.5;
  DragDropTouch._DBLCLICK = 500;
  DragDropTouch._CTXMENU = 900;
  DragDropTouch._ISPRESSHOLDMODE = false;
  DragDropTouch._PRESSHOLDAWAIT = 400;
  DragDropTouch._PRESSHOLDMARGIN = 25;
  DragDropTouch._PRESSHOLDTHRESHOLD = 0;
  DragDropTouch._rmvAtts = 'id,class,style,draggable'.split(',');
  DragDropTouch._kbdProps = 'altKey,ctrlKey,metaKey,shiftKey'.split(',');
  DragDropTouch._ptProps = 'pageX,pageY,clientX,clientY,screenX,screenY,offsetX,offsetY'.split(',');
  DragDropTouch_1.DragDropTouch = DragDropTouch;
})(DragDropTouch || (DragDropTouch = {}));

