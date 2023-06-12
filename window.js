$(document).ready(function() {
    // Make windows draggable and resizable
    $(".window").draggable({
        handle: ".win-bar",
        snap: false,
        snapMode: "false",
        delay: 20,
        distance: 1
    }).each(function() {
        $(this).resizable({
            handles: "se",
            minHeight: 200,
            minWidth: 200
        });
    });
    // Double-click event for opening windows
    $('#dLink-About').dblclick(function() {
        openWindow('about.html');
    });

    $('#dLink-Blog button').dblclick(function() {
        openWindow('./daw/index.html');
    });

    $('#dLink-Login button').dblclick(function() {
        openWindow('release-notes.html');
    });

    $('#dLink-Music button').dblclick(function() {
        openWindow('survive-game.html');
    });

    $('#dLink-Tarot button').dblclick(function() {
        openWindow('https://witchaudio.github.io/cosmic-fortunes/');
    });

    

    // Function to close a window
    $(document).on('click', '.win-close', function() {
        $(this).closest('.window').remove();
    });

    function openWindow(url) {
        var windowId = generateWindowId();
        var windowHtml = `
            <div class="window ui-draggable" id="${windowId}">
                <div class="win-bar">
                    <button class="win-close button"></button>
                    <button class="win-full button"></button>
                    <button class="win-min button"></button>
                    <button class="win-upd button"></button>
                    <div class="win-text">V1.0.0 witch audio |\||\</div>
                </div>
                <div class="win-content" id="win-content-${windowId}">
                    <iframe class="win-frame" src="${url}"></iframe>
                </div>
                <div class="resizer"></div>
            </div>
        `;
        $('#window-container').append(windowHtml);
        // Apply draggable and resizable to the newly created window
        $(`#${windowId}`).draggable({
            handle: ".win-bar",
            snap: false,
            snapMode: "false",
            delay: 20,
            distance: 1
        }).resizable({
            handles: "se",
            minHeight: 200,
            minWidth: 200
        });
    }
    function generateWindowId() {
        var timestamp = new Date().getTime();
        return 'win-id-' + timestamp;
    }
});

// Function to expand window to fit screen
$(document).on('click', '.win-full', function() {
    var windowElement = $(this).closest('.window');

    // Expand the window to fit the browser size
    windowElement.css({
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100vw',
        'height': '100vh',
        'z-index': '9999'
    });
});

// Function to minimize a window
$(document).on('click', '.win-min', function() {
    var windowElement = $(this).closest('.window');
    windowElement.toggleClass('minimized');
});

// Function to reload the window
$(document).on('click', '.win-upd', function() {
    var windowElement = $(this).closest('.window');
    var iframeElement = windowElement.find('.win-frame');
    iframeElement.attr('src', iframeElement.attr('src'));
});

