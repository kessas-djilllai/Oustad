export function initGlobalButtonProgress() {
  if (typeof window === 'undefined') return;

  let clickedButton: HTMLButtonElement | null = null;
  let clickTimeout: any = null;

  // Listen to all clicks
  document.addEventListener('click', (e) => {
    // Find closest button or elements with role="button"
    const target = (e.target as Element).closest('button');
    if (target && !target.closest('.no-global-loader')) {
      clickedButton = target;
      clearTimeout(clickTimeout);
      // Give the click event loop time to trigger fetch
      clickTimeout = setTimeout(() => {
         clickedButton = null;
      }, 100); 
    }
  }, true);

  const originalFetch = window.fetch;
  let activeFetches = 0;
  let loadingButton: HTMLButtonElement | null = null;

  const customFetch = async function(this: any, ...args: any[]) {
    activeFetches++;
    
    // If a button was clicked right before this fetch, attach a spinner
    if (clickedButton && !loadingButton) {
      loadingButton = clickedButton;
      if (!loadingButton.classList.contains('global-loading')) {
        loadingButton.classList.add('global-loading');
        // Check if there is already a spinner to avoid inserting twice
        if (!loadingButton.querySelector('.global-spinner')) {
          const spinner = document.createElement('span');
          spinner.className = 'global-spinner mr-2 inline-flex shrink-0';
          spinner.innerHTML = '<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>';
          loadingButton.style.display = 'inline-flex';
          loadingButton.style.alignItems = 'center';
          loadingButton.prepend(spinner);
          
          // Optionally dim the button contents 
          loadingButton.classList.add('opacity-80', 'pointer-events-none');
        }
      }
    }
    
    try {
      return await originalFetch.apply(this, args);
    } finally {
      activeFetches--;
      if (activeFetches === 0 && loadingButton) {
         loadingButton.classList.remove('global-loading', 'opacity-80', 'pointer-events-none');
         const spinner = loadingButton.querySelector('.global-spinner');
         if (spinner) spinner.remove();
         loadingButton = null;
      }
    }
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: customFetch,
      configurable: true,
      writable: true
    });
  } catch (err) {
    console.warn("Could not override global fetch:", err);
  }
}
