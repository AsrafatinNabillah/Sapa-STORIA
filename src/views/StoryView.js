class StoryView {
  constructor() {
    this.registerForm = document.getElementById('registerForm');
    this.loginForm = document.getElementById('loginForm');
    this.storyForm = document.getElementById('storyForm');
    this.storiesDiv = document.getElementById('stories');
    this.storySection = document.getElementById('storySection');
    this.authSection = document.getElementById('authSection');
    this.takePhotoButton = document.getElementById('takePhoto');
    this.photoInput = document.getElementById('photo');
    this.video = document.getElementById('video');
    this.preview = document.getElementById('preview');
    this.countdownDiv = document.getElementById('countdown');
    this.retakePhotoButton = document.getElementById('retakePhotoButton');
    this.loadStoriesButton = document.getElementById('loadStoriesButton');

    this.offlineIndicator = this.createOfflineIndicator();
    this.storyContainer = this.storiesDiv; 
    this.feedbackDiv = document.createElement('div');
    this.feedbackDiv.setAttribute('role', 'alert');
    this.feedbackDiv.setAttribute('aria-live', 'assertive');
    document.body.appendChild(this.feedbackDiv);

    this.map = null;
    this.latitude = null;
    this.longitude = null;
    this.stream = null;
    this.currentMarkers = [];
  }

  setPresenter(presenter) {
    this.presenter = presenter;
  }

  createOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '20px';
    indicator.style.right = '20px';
    indicator.style.padding = '10px 15px';
    indicator.style.backgroundColor = '#ff9800';
    indicator.style.color = 'white';
    indicator.style.borderRadius = '4px';
    indicator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    indicator.style.zIndex = '1000';
    indicator.style.display = 'none';
    indicator.textContent = 'Anda sedang offline';
    document.body.appendChild(indicator);
    return indicator;
  }

  updateOnlineStatus(online) {
    if (online) {
      this.offlineIndicator.style.display = 'none';
    } else {
      this.offlineIndicator.style.display = 'block';
    }
  }

  initMap() {
    this.map = L.map('map').setView([-6.200001, 106.816666], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    
    // Tambahkan layer offline
    L.tileLayer('', {
      maxZoom: 19,
      attribution: 'Offline mode'
    }).addTo(this.map);

    this.map.on('click', (e) => {
      this.latitude = e.latlng.lat;
      this.longitude = e.latlng.lng;
      
      // Hapus marker sebelumnya
      this.clearMarkers();
      
      const marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
      this.currentMarkers.push(marker);
      marker.bindPopup(`Titik yang dipilih: Latitude: ${this.latitude}, Longitude: ${this.longitude}`).openPopup();

      this.showFeedback(`Koordinat yang dipilih: ${this.latitude}, ${this.longitude}`, 'info');
    });
  }

  clearMarkers() {
    this.currentMarkers.forEach(marker => this.map.removeLayer(marker));
    this.currentMarkers = [];
  }

  showNotificationMessage(message, type = 'info') {
    const notifBox = document.createElement('div');
    notifBox.className = `notification ${type}`;
    notifBox.innerText = message;
    
    // Styling berdasarkan type
    const styles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '10px 15px',
      borderRadius: '4px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      zIndex: '1000',
      transition: 'opacity 0.5s ease-in-out',
      color: 'white'
    };

    if (type === 'error') {
      styles.backgroundColor = '#f44336';
    } else if (type === 'success') {
      styles.backgroundColor = '#4caf50';
    } else if (type === 'warning') {
      styles.backgroundColor = '#ff9800';
    } else {
      styles.backgroundColor = '#2196f3';
    }

    Object.assign(notifBox.style, styles);

    document.body.appendChild(notifBox);

    setTimeout(() => {
      notifBox.style.opacity = '0';
      setTimeout(() => {
        notifBox.remove();
      }, 500);
    }, 3000);
  }

  showFeedback(message, type = 'info') {
    this.showNotificationMessage(message, type);
    this.feedbackDiv.textContent = message;
    this.feedbackDiv.className = type;
  }

  showLoading(show) {
    const loadingElement = document.getElementById('loading') || this.createLoadingElement();
    loadingElement.style.display = show ? 'block' : 'none';
  }

  createLoadingElement() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.style.position = 'fixed';
    loading.style.top = '0';
    loading.style.left = '0';
    loading.style.width = '100%';
    loading.style.height = '100%';
    loading.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loading.style.display = 'none';
    loading.style.justifyContent = 'center';
    loading.style.alignItems = 'center';
    loading.style.zIndex = '9999';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.border = '4px solid rgba(255,255,255,0.3)';
    spinner.style.borderRadius = '50%';
    spinner.style.borderTop = '4px solid #fff';
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.animation = 'spin 1s linear infinite';
    
    loading.appendChild(spinner);
    document.body.appendChild(loading);
    return loading;
  }

  displayStories(stories) {
    this.storiesDiv.innerHTML = '';
    this.clearMarkers();

    if (!stories || stories.length === 0) {
      this.storiesDiv.innerHTML = '<p class="no-stories">Tidak ada cerita yang tersedia</p>';
      return;
    }

    stories.forEach(story => {
      console.log('Mengecek properti story:', story);
      const storyElement = document.createElement('div');
      storyElement.classList.add('story-item');
      storyElement.dataset.storyId = story.id;

      const lat = story.lat ?? null;
      const lon = story.lon ?? null;
      const createdAt = story.createdAt ? new Date(story.createdAt).toLocaleString() : 'Tanggal tidak tersedia';

      storyElement.innerHTML = `
        <h3>${this.escapeHTML(story.name)}</h3>
        <p>${this.escapeHTML(story.description)}</p>
        ${lat && lon ? `<p><small>Lokasi: ${lat}, ${lon}</small></p>` : ''}
        <img src="${story.photoUrl}" alt="Gambar cerita oleh ${this.escapeHTML(story.name)}" loading="lazy">
        <p><small>Dibuat pada: ${createdAt}</small></p>
        ${story.fromCache ? `
          <div class="cache-badge">Dari Cache</div>
          <button class="delete-offline-btn"
                  data-cache-key="${story.cacheKey}"
                  data-story-id="${story.id}">
            Hapus
          </button>
        ` : ''}
      `;

      if (story.fromCache) {
        const deleteBtn = storyElement.querySelector('.delete-offline-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // agar tidak trigger klik pada elemen cerita
            const cacheKey = deleteBtn.dataset.cacheKey;
            const storyId = deleteBtn.dataset.storyId;
            console.log('Presenter di event handler:', this.presenter);
            this.presenter.handleDeleteOfflineStory(cacheKey, storyId);
          });
        }
      }

      // Interaksi UI
      storyElement.addEventListener('mouseenter', () => {
        storyElement.classList.add('hover-effect');
      });

      storyElement.addEventListener('mouseleave', () => {
        storyElement.classList.remove('hover-effect');
      });

      storyElement.querySelector('img').addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
      });

      storyElement.addEventListener('click', () => {
        this.showFeedback(`Cerita: ${story.name} - ${story.description}`);
        this.showStoryDetail(story);
        console.log('Detail Story:\n' + JSON.stringify(story, null, 2));
        storyElement.classList.add('popup-effect');
        setTimeout(() => {
          storyElement.classList.remove('popup-effect');
        }, 1500);
      });

      this.storiesDiv.appendChild(storyElement);

      if (lat && lon) {
        const marker = L.marker([lat, lon]).addTo(this.map);
        marker.bindPopup(`<b>${this.escapeHTML(story.name)}</b><br>${this.escapeHTML(story.description)}`);
        this.currentMarkers.push(marker);
      }
    });
  }

  showStoryDetail(story) {
    const modal = document.getElementById('story-modal') || this.createModal();
    const lat = story.lat ?? null;
    const lon = story.lon ?? null;
    const createdAt = story.createdAt ? new Date(story.createdAt).toLocaleString() : 'Tanggal tidak tersedia';

    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>${this.escapeHTML(story.name)}</h2>
        <img src="${story.photoUrl}" alt="Gambar cerita oleh ${this.escapeHTML(story.name)}">
        <p>${this.escapeHTML(story.description)}</p>
        ${lat && lon ? `<p><small>Lokasi: ${lat}, ${lon}</small></p>` : ''}
        <p><small>Dibuat pada: ${createdAt}</small></p>
        ${story.fromCache ? `
          <div class="cache-badge">Dari Cache</div>
          <button class="delete-offline-btn"
                  data-cache-key="${story.cacheKey}"
                  data-story-id="${story.id}">
            Hapus
          </button>
        ` : ''}
      </div>
    `;

    modal.style.display = 'block';
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    if (story.fromCache) {
      const deleteBtn = modal.querySelector('.delete-offline-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cacheKey = deleteBtn.dataset.cacheKey;
          const storyId = deleteBtn.dataset.storyId;
          console.log('Presenter di event handler:', this.presenter);
          this.presenter.handleDeleteOfflineStory(cacheKey, storyId);
          modal.style.display = 'none'; // langsung tutup modal setelah hapus
        });
      }
    }
  }

  // Tambahkan fungsi helper untuk mencegah XSS
  escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'story-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'none';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';
    modal.style.padding = '20px';
    modal.style.overflowY = 'auto';

    document.body.appendChild(modal);
    return modal;
  }

  resetAddStoryForm() {
    this.storyForm.reset();
    this.preview.src = '';
    this.preview.style.display = 'none';
    this.retakePhotoButton.style.display = 'none';
    this.takePhotoButton.style.display = 'inline-block';
    this.clearMarkers();
    this.latitude = null;
    this.longitude = null;
  }

  deleteOfflineStory(cacheKey) {
    // Contoh menghapus dari localStorage
    try {
      localStorage.removeItem(cacheKey); // atau IndexedDB sesuai implementasi
      this.showFeedback('Cerita offline berhasil dihapus', 'success');
      this.removeStoryFromDisplay(cacheKey);
    } catch (error) {
      this.showFeedback('Gagal menghapus cerita offline', 'error');
    }
  }

  removeStoryFromDisplay(storyId) {
    const storyElement = this.storiesDiv.querySelector(`[data-story-id="${storyId}"]`);
    console.log("Mencoba cari elemen dengan data-story-id:", storyId);
    if (storyElement) {
      storyElement.remove();
      this.showFeedback('Cerita offline berhasil dihapus dari tampilan.');
    } else {
      console.warn(`Tidak ditemukan elemen dengan story-id: ${storyId}`);
    }
  }

  bindRegister(handler) {
    this.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      await handler(name, email, password);
    });
  }

  bindLogin(handler) {
    this.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      await handler(email, password);
    });
  }

  bindLogout(handler) {
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handler); // langsung panggil handleLogout
    }
  }

  bindAddStory(handler) {
    this.storyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = document.getElementById('description').value;
      const photo = this.photoInput.files[0];
      await handler(description, photo, this.latitude, this.longitude);
    });
  }

  bindLoadStories(handler) {
    this.loadStoriesButton.addEventListener('click', () => {
      const page = parseInt(document.getElementById('page').value);
      const size = parseInt(document.getElementById('size').value);
      const location = parseInt(document.getElementById('location').value);
      handler(page, size, location);
    });
  }

  bindTakePhoto() {
    this.takePhotoButton.addEventListener('click', async () => {
      this.takePhotoButton.style.display = 'none';
      this.preview.style.display = 'none';
      this.retakePhotoButton.style.display = 'none';
  
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.video.srcObject = this.stream;
        await this.video.play();
      }
  
      this.video.style.display = 'block';
      this.countdownDiv.style.display = 'block';
      this.countdownDiv.textContent = '3';
  
      let countdown = 3;
      const interval = setInterval(() => {
      countdown--;
        this.countdownDiv.textContent = countdown > 0 ? countdown : '';
        if (countdown === 0) {
          clearInterval(interval);
          this.countdownDiv.style.display = 'none';
          this.video.style.display = 'none';
  
          const canvas = document.createElement('canvas');
          canvas.width = this.video.videoWidth;
          canvas.height = this.video.videoHeight;
          const context = canvas.getContext('2d');
          context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
  
          this.preview.src = canvas.toDataURL('image/jpeg');
          this.preview.style.display = 'block';
  
          canvas.toBlob((blob) => {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            this.photoInput.files = dataTransfer.files;
          });
  
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
          this.retakePhotoButton.style.display = 'inline-block';
        }
      }, 1000);
    });
  
    this.retakePhotoButton.addEventListener('click', () => {
      this.preview.style.display = 'none';
      this.retakePhotoButton.style.display = 'none';
      this.takePhotoButton.style.display = 'inline-block';
    });
  }

  bindHashChange(handler) {
    window.addEventListener('hashchange', () => {
      handler();
    });
    window.addEventListener('DOMContentLoaded', () => {
      handler();
    });
  }

  bindFetchStoryDetail(handler) {
      this.storiesDiv.addEventListener('click', (e) => {
        const storyElement = e.target.closest('.story-item');
        if (storyElement) {
          const storyId = storyElement.getAttribute('data-story-id');
          handler(storyId);
        }
      });
    }

  bindDeleteStory(handler) {
    this.onDeleteCallback = handler;
  }

  bindDeleteOfflineStory(callback) {
    this.storyContainer.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-offline-btn')) {
        const cacheKey = event.target.dataset.cacheKey;
        callback(cacheKey);
      }
    });
  }

  removeStoryFromDisplay(cacheKey) {
    const storyElement = document.querySelector(`[data-cache-key="${cacheKey}"]`);
    if (storyElement) {
      storyElement.remove();
    }
  }

  showSection(sectionToShow) {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        this.authSection.style.display = (sectionToShow === 'auth') ? 'block' : 'none';
        this.storySection.style.display = (sectionToShow === 'story') ? 'block' : 'none';
      });
    } else {
      this.authSection.style.display = (sectionToShow === 'auth') ? 'block' : 'none';
      this.storySection.style.display = (sectionToShow === 'story') ? 'block' : 'none';
    }
  }

  showAuthSection() {
    if (this.authSection) this.authSection.style.display = 'block';
    if (this.storySection) this.storySection.style.display = 'none';
  }

  showStorySection() {
    if (this.authSection) this.authSection.style.display = 'none';
    if (this.storySection) this.storySection.style.display = 'block';
  }

  async fadeIn(element) {
    element.style.opacity = 0;
    element.style.transition = 'opacity 0.5s ease-in';
    element.style.opacity = 1;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async fadeOut(element) {
    element.style.opacity = 1;
    element.style.transition = 'opacity 0.5s ease-out';
    element.style.opacity = 0;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
export default StoryView;
