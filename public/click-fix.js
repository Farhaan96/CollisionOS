// Click interception fix for CollisionOS
// This script ensures all buttons are clickable even when there are overlay issues

(function () {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClickFix);
  } else {
    initClickFix();
  }

  function initClickFix() {
    console.log('🔧 Initializing click interception fix...');

    // Remove webpack dev server overlay that interferes with clicks
    function removeWebpackOverlay() {
      const overlay = document.getElementById(
        'webpack-dev-server-client-overlay'
      );
      if (overlay) {
        overlay.style.display = 'none';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '-1';
      }

      // Also remove any error overlay
      const errorOverlay = document.querySelector(
        '[data-testid="webpack-dev-server-client-overlay-div"]'
      );
      if (errorOverlay) {
        errorOverlay.style.display = 'none';
        errorOverlay.style.pointerEvents = 'none';
        errorOverlay.style.zIndex = '-1';
      }

      // Fix react-hot-toast overlay that intercepts pointer events
      const toasterOverlay = document.querySelector('[data-rht-toaster]');
      if (toasterOverlay) {
        toasterOverlay.style.pointerEvents = 'none';
      }
    }

    // Remove overlay immediately and also on any DOM changes
    removeWebpackOverlay();

    // Watch for overlay creation and remove it
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList') {
          removeWebpackOverlay();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Add event delegation to handle clicks on the document level
    document.addEventListener(
      'click',
      function (event) {
        // Skip if clicking on form elements or interactive elements
        if (
          event.target.tagName === 'INPUT' ||
          event.target.tagName === 'TEXTAREA' ||
          event.target.tagName === 'SELECT' ||
          event.target.tagName === 'BUTTON' ||
          event.target.closest('button') ||
          event.target.closest('input') ||
          event.target.closest('textarea') ||
          event.target.closest('select') ||
          event.target.closest('[role="button"]') ||
          event.target.closest('[role="textbox"]') ||
          event.target.closest('[data-rht-toaster]')
        ) {
          return;
        }

        // Check if the click was intercepted by checking if target is not the intended element
        const clickX = event.clientX;
        const clickY = event.clientY;

        // Get the element that should receive the click at these coordinates
        const actualTarget = document.elementFromPoint(clickX, clickY);

        // If we clicked on a background element but there's a button nearby, redirect the click
        if (
          actualTarget &&
          (actualTarget.id === 'root' || actualTarget.tagName === 'DIV')
        ) {
          // Look for buttons in a small radius around the click
          const buttons = document.querySelectorAll('button, [role="button"]');

          for (const button of buttons) {
            const rect = button.getBoundingClientRect();
            const inBounds =
              clickX >= rect.left &&
              clickX <= rect.right &&
              clickY >= rect.top &&
              clickY <= rect.bottom;

            if (inBounds && button !== actualTarget) {
              console.log(
                '🎯 Redirecting intercepted click to button:',
                button
              );
              event.preventDefault();
              event.stopPropagation();

              // Trigger the button click
              button.click();
              return;
            }
          }
        }
      },
      true
    ); // Use capture phase

    // Remove the problematic keydown handler that was causing form submissions
    // The form will handle its own submission logic

    console.log('✅ Click interception fix initialized');
  }
})();
