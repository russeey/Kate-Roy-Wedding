<!-- src/views/UploadView.vue -->
<template>
  <div class="upload-page">

    <!-- Nav -->
    <nav class="top-nav">
      <router-link to="/" class="nav-logo">Kate <em>&amp;</em> Roy</router-link>
      <div class="nav-links">
        <router-link to="/gallery" class="nav-link">Gallery</router-link>
      </div>
    </nav>

    <div class="page-container">

      <!-- Header -->
      <header class="page-header">
        <p class="eyebrow">Share Your Memories</p>
        <h2 class="page-title">Capture the Magic</h2>
        <div class="ornament"><span>✦</span></div>
        <p class="page-subtitle">
          Upload up to {{ MAX_FILES }} photos at once and add a caption to each.
          Every image will be added to Kate &amp; Roy's wedding gallery.
        </p>
      </header>

      <!-- Upload Card -->
      <div v-if="!successMsg" class="upload-card">

        <!-- Hidden multi-file input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden-input"
          @change="handleFileChange"
        />

        <!-- Drop Zone (when no photos selected yet) -->
        <div
          v-if="!items.length"
          class="drop-zone"
          :class="{ active: isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInput.click()"
        >
          <div class="drop-placeholder">
            <div class="drop-icon">🌿</div>
            <p class="drop-main">Drop your photos here</p>
            <p class="drop-sub">or tap to choose one or many from your device</p>
            <p class="drop-formats">JPG · PNG · WEBP · HEIC</p>
          </div>
        </div>

        <!-- Selected photos -->
        <div
          v-else
          class="photo-list"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div
            v-for="item in items"
            :key="item.id"
            class="photo-item"
            :class="item.status"
          >
            <div class="photo-thumb">
              <img :src="item.preview" alt="Selected photo" />

              <!-- Status overlay -->
              <div v-if="item.status === 'uploading'" class="photo-overlay">
                <span class="spinner dark" />
              </div>
              <div v-else-if="item.status === 'done'" class="photo-overlay done">✓</div>
              <div v-else-if="item.status === 'error'" class="photo-overlay failed">!</div>

              <button
                v-if="!uploading && item.status !== 'done'"
                class="remove-btn"
                @click="removeItem(item.id)"
                aria-label="Remove photo"
              >✕</button>
            </div>

            <div class="photo-fields">
              <textarea
                v-model="item.caption"
                class="field-textarea"
                placeholder="Add a caption for this photo…"
                maxlength="280"
                rows="2"
                :disabled="uploading || item.status === 'done'"
              />
              <span class="char-count">{{ item.caption.length }} / 280</span>
              <p v-if="item.status === 'error'" class="item-error">{{ item.error }}</p>
            </div>
          </div>

          <!-- Add more -->
          <button
            v-if="items.length < MAX_FILES && !uploading"
            class="add-more"
            :class="{ active: isDragging }"
            @click="fileInput.click()"
          >
            <span class="add-plus">＋</span>
            <span>Add more photos ({{ items.length }} / {{ MAX_FILES }})</span>
          </button>
        </div>

        <!-- Album option (only when 2+ photos) -->
        <div v-if="items.length > 1" class="album-box">
          <label class="toggle">
            <input type="checkbox" v-model="makeAlbum" :disabled="uploading || !!albumId" />
            <span class="toggle-box" />
            <span class="toggle-text">Put these photos in an album</span>
          </label>

          <div v-if="makeAlbum" class="field-group album-name">
            <label class="field-label" for="albumTitle">Album Name</label>
            <input
              id="albumTitle"
              v-model="albumTitle"
              type="text"
              class="field-input"
              placeholder="e.g. Dance Floor Moments"
              maxlength="60"
              :disabled="uploading || !!albumId"
            />
          </div>
        </div>

        <!-- Guest name (shared by all photos) -->
        <div class="field-group">
          <label class="field-label" for="guestName">Your Name <small>(optional)</small></label>
          <input
            id="guestName"
            v-model="guestName"
            type="text"
            class="field-input"
            placeholder="e.g. Maria Santos"
            maxlength="60"
            :disabled="uploading"
          />
        </div>

        <!-- Submit -->
        <button
          class="btn btn-filled submit-btn"
          :disabled="!canSubmit"
          @click="submitUpload"
        >
          <span v-if="!uploading">
            💌 &nbsp;Share {{ pendingCount }} Memor{{ pendingCount === 1 ? 'y' : 'ies' }}
          </span>
          <span v-else class="uploading-label">
            <span class="spinner" /> Uploading {{ doneCount + 1 }} of {{ totalToUpload }}…
          </span>
        </button>

        <!-- Progress bar -->
        <div v-if="uploading" class="progress-track">
          <div class="progress-bar" :style="{ width: progressPercent + '%' }" />
        </div>

      </div>

      <!-- Success message -->
      <transition name="pop">
        <div v-if="successMsg" class="success-banner">
          <span class="success-icon">🌿</span>
          <div>
            <p class="success-title">Memories Shared!</p>
            <p class="success-body">{{ successMsg }}</p>
          </div>
          <div class="success-actions">
            <button class="btn" @click="resetForm"><span>Upload More</span></button>
            <router-link to="/gallery" class="btn btn-filled"><span>View Gallery</span></router-link>
          </div>
        </div>
      </transition>

      <!-- Error message -->
      <transition name="pop">
        <div v-if="errorMsg" class="error-banner">
          <span>⚠️ {{ errorMsg }}</span>
          <button class="close-error" @click="errorMsg = ''">✕</button>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// ─── Replace with YOUR ImgBB API key ────────────────────────────
const IMGBB_API_KEY = '1625bffbcaa3ffd31209bacb3d3c450c'
// ────────────────────────────────────────────────────────────────

const MAX_FILES = 10

const fileInput   = ref(null)
const items       = ref([])      // { id, file, preview, caption, status, error }
const guestName   = ref('')
const isDragging  = ref(false)
const uploading   = ref(false)
const doneCount   = ref(0)
const totalToUpload = ref(0)
const successMsg  = ref('')
const errorMsg    = ref('')
const makeAlbum   = ref(false)
const albumTitle  = ref('')
const albumId     = ref('')

const pendingCount = computed(() => items.value.filter(i => i.status !== 'done').length)
const useAlbum = computed(() => makeAlbum.value && items.value.length > 1)
const canSubmit = computed(() =>
  !uploading.value &&
  pendingCount.value > 0 &&
  (!useAlbum.value || albumTitle.value.trim().length > 0)
)
const progressPercent = computed(() =>
  totalToUpload.value ? Math.round((doneCount.value / totalToUpload.value) * 100) : 0
)

function addFiles(fileList) {
  const images = Array.from(fileList).filter(f => f.type.startsWith('image/'))
  const room = MAX_FILES - items.value.length

  if (images.length > room) {
    errorMsg.value = `You can upload up to ${MAX_FILES} photos at once.`
  }

  images.slice(0, room).forEach(file => {
    items.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      status: 'pending',
      error: ''
    })
  })
}

function handleFileChange(e) {
  errorMsg.value = ''
  addFiles(e.target.files)
  e.target.value = '' // lets the same file be picked again
}

function handleDrop(e) {
  isDragging.value = false
  errorMsg.value = ''
  addFiles(e.dataTransfer.files)
}

function removeItem(id) {
  const item = items.value.find(i => i.id === id)
  if (item) URL.revokeObjectURL(item.preview)
  items.value = items.value.filter(i => i.id !== id)
}

async function uploadOne(item) {
  // 1. Upload image to ImgBB
  const formData = new FormData()
  formData.append('image', item.file)
  formData.append('key', IMGBB_API_KEY)

  const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  })

  const imgbbData = await imgbbRes.json()

  if (!imgbbData.success) {
    throw new Error('Image upload failed. Please try again.')
  }

  const imageUrl  = imgbbData.data.url
  const thumbUrl  = imgbbData.data.thumb?.url || imageUrl
  const deleteUrl = imgbbData.data.delete_url || ''

  console.log('Saving to Firestore:', {
    projectId: db.app.options.projectId,
    imageUrl
  })

  // 2. Save metadata to Firestore
  await addDoc(collection(db, 'memories'), {
    imageUrl,
    thumbUrl,
    deleteUrl,
    caption: item.caption.trim(),
    guestName: guestName.value.trim() || 'A Beloved Guest',
    albumId: albumId.value || null,
    createdAt: serverTimestamp()
  })

  console.log('Firestore save successful!')
}

async function submitUpload() {
  const queue = items.value.filter(i => i.status !== 'done')
  if (!queue.length) return

  uploading.value = true
  errorMsg.value = ''
  doneCount.value = 0
  totalToUpload.value = queue.length

  // Create the album first (only once, even if the guest retries)
  if (useAlbum.value && !albumId.value) {
    try {
      const albumRef = await addDoc(collection(db, 'albums'), {
        title: albumTitle.value.trim(),
        guestName: guestName.value.trim() || 'A Beloved Guest',
        createdAt: serverTimestamp()
      })
      albumId.value = albumRef.id
    } catch (err) {
      console.error('Could not create album:', err)
      errorMsg.value = 'Could not create the album. Please try again.'
      uploading.value = false
      return
    }
  }

  // One at a time keeps ImgBB happy and works well on mobile data
  for (const item of queue) {
    item.status = 'uploading'
    item.error = ''
    try {
      await uploadOne(item)
      item.status = 'done'
      doneCount.value++
    } catch (err) {
      console.error('Upload or Firestore error:', err)
      console.error('Error code:', err.code)
      console.error('Error message:', err.message)
      item.status = 'error'
      item.error = err.message || 'Something went wrong.'
    }
  }

  uploading.value = false

  const failed = items.value.filter(i => i.status === 'error').length
  if (failed === 0) {
    successMsg.value = albumId.value
      ? `Your album "${albumTitle.value.trim()}" has been added to the wedding gallery. Thank you for celebrating with us!`
      : doneCount.value === 1
        ? 'Your photo has been added to the wedding gallery. Thank you for celebrating with us!'
        : `Your ${doneCount.value} photos have been added to the wedding gallery. Thank you for celebrating with us!`
  } else {
    errorMsg.value =
      `${failed} photo${failed > 1 ? 's' : ''} didn't upload. Tap the Share button to try again.`
  }
}

function resetForm() {
  items.value.forEach(i => URL.revokeObjectURL(i.preview))
  items.value = []
  guestName.value = ''
  makeAlbum.value = false
  albumTitle.value = ''
  albumId.value = ''
  successMsg.value = ''
  errorMsg.value = ''
  doneCount.value = 0
  totalToUpload.value = 0
}

onBeforeUnmount(() => {
  items.value.forEach(i => URL.revokeObjectURL(i.preview))
})
</script>

<style scoped>
.upload-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 80% 0%, #e6ede0 0%, transparent 55%),
    var(--cream);
  position: relative;
  z-index: 1;
}

/* Nav */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  border-bottom: 1px solid rgba(127,150,112,0.2);
}
.nav-logo {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  color: var(--ink);
  text-decoration: none;
}
.nav-logo em { font-family: var(--font-body); font-style: italic; color: var(--sage-dark); }
.nav-link {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-soft);
  text-decoration: none;
  transition: color 0.3s;
}
.nav-link:hover { color: var(--sage-dark); }

/* Layout */
.page-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 48px;
}
.eyebrow {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--sage-dark);
  margin-bottom: 10px;
}
.page-title {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: 400;
  letter-spacing: 0.05em;
  margin-bottom: 18px;
}
.page-subtitle {
  font-family: var(--font-body);
  font-size: 1.08rem;
  line-height: 1.8;
  color: var(--ink-soft);
  font-style: italic;
}

/* Card */
.upload-card {
  background: var(--white);
  border: 1px solid rgba(127,150,112,0.25);
  border-radius: 2px;
  padding: 40px 36px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hidden-input { display: none; }

/* Drop Zone */
.drop-zone {
  border: 2px dashed rgba(127,150,112,0.45);
  border-radius: 2px;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
  background: rgba(246,248,243,0.5);
}
.drop-zone:hover,
.drop-zone.active {
  border-color: var(--sage);
  background: rgba(127,150,112,0.06);
}

.drop-placeholder { text-align: center; padding: 20px; }
.drop-icon { font-size: 2.8rem; margin-bottom: 12px; }
.drop-main {
  font-family: var(--font-body);
  font-size: 1.15rem;
  color: var(--ink);
  margin-bottom: 6px;
}
.drop-sub {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--ink-soft);
  margin-bottom: 12px;
}
.drop-formats {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  letter-spacing: 0.15em;
  color: var(--sage-dark);
  text-transform: uppercase;
}

/* Photo list */
.photo-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.photo-item {
  display: flex;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(127,150,112,0.18);
  transition: opacity 0.3s;
}
.photo-item.done { opacity: 0.65; }
.photo-item.error .photo-thumb { outline: 2px solid #d9a3a3; }

.photo-thumb {
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 2px;
  background: var(--parchment);
}
.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photo-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(246,248,243,0.7);
  font-size: 1.8rem;
}
.photo-overlay.done   { background: rgba(127,150,112,0.75); color: #fff; }
.photo-overlay.failed { background: rgba(160,60,60,0.75);   color: #fff; font-family: var(--font-display); }

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(26,34,22,0.65);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.remove-btn:hover { background: rgba(0,0,0,0.85); }

.photo-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.item-error {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  color: #8b2222;
}

.add-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px;
  border: 2px dashed rgba(127,150,112,0.45);
  background: rgba(246,248,243,0.5);
  color: var(--sage-dark);
  font-family: var(--font-sans);
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
}
.add-more:hover,
.add-more.active {
  border-color: var(--sage);
  background: rgba(127,150,112,0.08);
}
.add-plus { font-size: 1.3rem; line-height: 1; }

/* Fields */
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label {
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink);
}
.field-label small {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: var(--ink-soft);
  letter-spacing: 0.05em;
  text-transform: none;
}
.field-textarea,
.field-input {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--ink);
  background: var(--cream);
  border: 1px solid rgba(127,150,112,0.3);
  border-radius: 2px;
  padding: 10px 14px;
  resize: none;
  transition: border-color 0.3s;
  outline: none;
  width: 100%;
}
.field-textarea:focus,
.field-input:focus { border-color: var(--sage); }
.field-textarea:disabled,
.field-input:disabled { opacity: 0.6; }
.char-count {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  color: var(--ink-soft);
  align-self: flex-end;
}

/* Album option */
.album-box {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 20px;
  background: rgba(127,150,112,0.07);
  border: 1px solid rgba(127,150,112,0.25);
  border-radius: 2px;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.toggle input { position: absolute; opacity: 0; pointer-events: none; }
.toggle-box {
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--sage);
  border-radius: 2px;
  background: var(--white);
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}
.toggle input:checked + .toggle-box { background: var(--sage); }
.toggle input:checked + .toggle-box::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.toggle input:focus-visible + .toggle-box { outline: 2px solid var(--sage-dark); outline-offset: 2px; }
.toggle input:disabled + .toggle-box { opacity: 0.55; }
.toggle-text {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: var(--ink);
}

/* Submit */
.submit-btn {
  width: 100%;
  justify-content: center;
  padding: 16px;
  font-size: 0.8rem;
}
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.uploading-label { display: flex; align-items: center; gap: 10px; }
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.spinner.dark {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(127,150,112,0.3);
  border-top-color: var(--sage-dark);
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Progress */
.progress-track {
  height: 4px;
  background: rgba(127,150,112,0.18);
  border-radius: 2px;
  overflow: hidden;
  margin-top: -12px;
}
.progress-bar {
  height: 100%;
  background: var(--sage);
  transition: width 0.4s ease;
}

/* Banners */
.success-banner {
  margin-top: 32px;
  background: linear-gradient(135deg, #fafbf7, #eef2e6);
  border: 1px solid var(--sage);
  border-radius: 2px;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}
.success-icon { font-size: 2.2rem; }
.success-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.08em;
  color: var(--ink);
}
.success-body {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--ink-soft);
  font-style: italic;
  margin-top: 4px;
}
.success-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }

.error-banner {
  margin-top: 20px;
  background: #fff5f5;
  border: 1px solid #f5c6c6;
  border-radius: 2px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: #8b2222;
}
.close-error {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: #8b2222;
}

/* Transitions */
.pop-enter-active { transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
.pop-enter-from   { opacity: 0; transform: scale(0.94) translateY(10px); }

/* Mobile */
@media (max-width: 520px) {
  .top-nav { padding: 14px 18px; }
  .nav-logo { font-size: 0.95rem; }
  .page-container { padding: 28px 16px 56px; }
  .page-header { margin-bottom: 28px; }
  .page-subtitle { font-size: 1rem; line-height: 1.7; }

  .upload-card { padding: 22px 16px; gap: 22px; }
  .drop-zone { min-height: 180px; }

  /* keep the same row layout as desktop, just a smaller thumbnail */
  .photo-item { gap: 12px; }
  .photo-thumb { width: 84px; height: 84px; }
  .remove-btn { width: 22px; height: 22px; top: 4px; right: 4px; font-size: 0.65rem; }

  .album-box { padding: 14px; }
  .toggle-text { font-size: 1rem; }

  .success-banner { padding: 24px 18px; }
  .success-actions { flex-direction: column; width: 100%; }
  .success-actions .btn { width: 100%; justify-content: center; }
}
</style>