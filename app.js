new Vue({
    el: '#app',
    data: {
      loaded: false,
      iframeSrc: '',
      windows: [],
      isResizing: false,
      lastDownX: 0,
      lastDownY: 0,
      resizingWindow: null
    },
    methods: {
      navigateTo(url) {
        if (this.lastClick && new Date() - this.lastClick < 300) {
          this.openWindow(url);
          this.lastClick = null;
        } else {
          this.lastClick = new Date();
        }
      },
      openWindow(url) {
        const windowId = this.generateWindowId();
        this.windows.push({ id: windowId, url: url });
        this.$nextTick(() => {
            // Make windows draggable
            $(`#${windowId}`).draggable({
                handle: ".win-bar",
                snap: false,
                delay: 20,
                distance: 1
            });
        });
    },
    startResize(event, windowId) {
        this.isResizing = true;
        this.lastDownX = event.clientX;
        this.lastDownY = event.clientY;
        this.resizingWindow = windowId;
    },
    performResize(event) {
        event.preventDefault();
        if (!this.isResizing) return;

        const dx = event.clientX - this.lastDownX;
        const dy = event.clientY - this.lastDownY;
        
        const activeWindowElement = document.getElementById(this.resizingWindow);

        let newWidth = activeWindowElement.offsetWidth + dx;
        let newHeight = activeWindowElement.offsetHeight + dy;

        if (newWidth >= 200) {
            activeWindowElement.style.width = `${newWidth}px`;
        }
        if (newHeight >= 200) {
            activeWindowElement.style.height = `${newHeight}px`;
        }

        this.lastDownX = event.clientX;
        this.lastDownY = event.clientY;
    },
    stopResize() {
        this.isResizing = false;
        this.resizingWindow = null;
    },
      closeWindow(windowId) {
        this.windows = this.windows.filter((win) => win.id !== windowId);
      },
      generateWindowId() {
        const timestamp = new Date().getTime();
        return 'win-id-' + timestamp;
      },
      maximizeWindow(windowId) {
        const activeWindowElement = document.getElementById(windowId);
        activeWindowElement.style.width = '100vw';
        activeWindowElement.style.height = '100vh';
        activeWindowElement.style.top = '0';
        activeWindowElement.style.left = '0';
      },
      minimizeWindow(windowId) {
        const activeWindowElement = document.getElementById(windowId);
        activeWindowElement.style.width = '200px';
        activeWindowElement.style.height = '200px';
      },
      refreshWindowContent(windowId) {
        const window = this.windows.find((win) => win.id === windowId);
        if (window) {
          const iframeElement = document.querySelector(`#${windowId} .win-frame`);
          iframeElement.src = window.url;
        }
      },
    },
    mounted() {
        this.loaded = true;
        // Register global event listeners for mouse events.
        window.addEventListener('mousemove', this.performResize);
        window.addEventListener('mouseup', this.stopResize);
    },
    beforeDestroy() {
        // Unregister the global event listeners.
        window.removeEventListener('mousemove', this.performResize);
        window.removeEventListener('mouseup', this.stopResize);
    }
  });
  