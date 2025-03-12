// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Check for updates to the service worker
        registration.addEventListener('updatefound', () => {
          // If updatefound is fired, it means that there's a new service worker being installed
          const newWorker = registration.installing;
          console.log('New service worker installing:', newWorker);
          
          newWorker.addEventListener('statechange', () => {
            // Has the service worker's state changed?
            console.log('Service worker state changed to:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available and will be used when all tabs for this page are closed
              console.log('New content is available and will be used when all tabs for this page are closed.');
              
              // Show a notification to the user
              showUpdateNotification();
            }
          });
        });
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
      
    // Handle updates to the service worker
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('Controller changed, refreshing page');
      window.location.reload();
    });
  });
}

// Function to show an update notification to the user
function showUpdateNotification() {
  // Create a notification element
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <h3>New Version Available</h3>
      <p>A new version of BrailleBuddy is available. Refresh to update?</p>
      <button id="update-button">Update Now</button>
      <button id="dismiss-button">Later</button>
    </div>
  `;
  
  // Add the notification to the page
  document.body.appendChild(notification);
  
  // Show the notification with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Add event listeners to the buttons
  document.getElementById('update-button').addEventListener('click', () => {
    // Send a message to the service worker to skip waiting
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    notification.classList.remove('show');
  });
  
  document.getElementById('dismiss-button').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
}
