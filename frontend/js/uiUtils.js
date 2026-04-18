// uiUtils.js

// Replaces all global alert() boxes seamlessly
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
     toast.style.animation = 'scaleIn 0.3s ease forwards reverse';
     setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Replaces all global confirm() boxes asynchronously
function showConfirmModal(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    let modalWrapper = document.getElementById('custom-confirm-modal');
    if (!modalWrapper) {
      modalWrapper = document.createElement('div');
      modalWrapper.id = 'custom-confirm-modal';
      Object.assign(modalWrapper.style, {
        position: 'fixed',
        top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'none',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '9999',
        backdropFilter: 'blur(3px)'
      });
      
      const modalBox = document.createElement('div');
      modalBox.id = 'custom-confirm-box';
      Object.assign(modalBox.style, {
        background: 'var(--card-bg, #1e1e2d)',
        padding: '30px 25px',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        border: '1px solid var(--border, #2a2a3b)',
        color: 'var(--text, #ffffff)',
        fontFamily: 'inherit'
      });
      
      modalWrapper.appendChild(modalBox);
      document.body.appendChild(modalWrapper);
    }
    
    const modalBox = document.getElementById('custom-confirm-box');
    modalBox.innerHTML = `
      <h3 style="margin-top: 0; color: var(--primary, #3b82f6); margin-bottom: 15px;">${title}</h3>
      <p style="margin-bottom: 25px; font-size: 1rem; color: var(--text-muted, #9ca3af); line-height: 1.5;">${message}</p>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="confirm-yes-btn" class="btn btn-primary" style="flex: 1; border: none; padding: 12px; cursor: pointer; border-radius: 8px;">Yes, Proceed</button>
        <button id="confirm-no-btn" class="btn btn-outline" style="flex: 1; padding: 12px; cursor: pointer; border-radius: 8px;">Cancel</button>
      </div>
    `;
    
    modalWrapper.style.display = 'flex';
    
    document.getElementById('confirm-yes-btn').onclick = () => {
      modalWrapper.style.display = 'none';
      resolve(true);
    };
    
    document.getElementById('confirm-no-btn').onclick = () => {
      modalWrapper.style.display = 'none';
      resolve(false);
    };
  });
}
