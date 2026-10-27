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
          Upload your photos from today and add a heartfelt caption.
          Every image will be added to Kate &amp; Roy's wedding gallery.
        </p>
      </header>

      <!-- Upload Card -->
      <div class="upload-card">

        <!-- Drop Zone -->
        <div
          class="drop-zone"
          :class="{ active: isDragging, hasPreview: previewUrl }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="handleFileChange"
          />

          <div v-if="!previewUrl" class="drop-placeholder">
            <div class="drop-icon">🌸</div>
            <p class="drop-main">Drop your photo here</p>
            <p class="drop-sub">or tap to browse your device</p>
            <p class="drop-formats">JPG · PNG · WEBP · HEIC</p>
          </div>

          <div v-else class="preview-wrap">
            <img :src="previewUrl" alt="Preview" class="preview-img" />
            <button class="remove-btn" @click.stop="removePhoto">✕</button>
          </div>
        </div>

        <!-- Caption Input -->
        <div class="field-group">
          <label class="field-label" for="caption">Your Caption</label>
          <textarea
            id="caption"
            v-model="caption"
            class="field-textarea"
            placeholder="Write a message, a wish, or a memory for Kate & Roy…"
            maxlength="280"
            rows="4"
          />
          <span class="char-count">{{ caption.length }} / 280</span>
        </div>

        <!-- Guest name (optional) -->
        <div class="field-group">
          <label class="field-label" for="guestName">Your Name <small>(optional)</small></label>
          <input
            id="guestName"
            v-model="guestName"
            type="text"
            class="field-input"
            placeholder="e.g. Maria Santos"
            maxlength="60"
          />
        </div>

        <!-- Submit -->
        <button
          class="btn btn-filled submit-btn"
          :disabled="!selectedFile || uploading"
          @click="submitUpload"
        >
          <span v-if="!uploading">💌 &nbsp;Share Memory</span>
          <span v-else class="uploading-label">
            <span class="spinner" /> Uploading…
          </span>
        </button>

      </div>

      <!-- Success message -->
      <transition name="pop">
        <div v-if="successMsg" class="success-banner">
          <span class="success-icon">🌹</span>
          <div>
            <p class="success-title">Memory Shared!</p>
            <p class="success-body">{{ successMsg }}</p>
          </div>
          <div class="success-actions">
            <button class="btn" @click="resetForm"><span>Upload Another</span></button>
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
import { ref } from 'vue'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// ─── Replace with YOUR ImgBB API key ────────────────────────────
const IMGBB_API_KEY = '1625bffbcaa3ffd31209bacb3d3c450c'
// ────────────────────────────────────────────────────────────────

const fileInput   = ref(null)
const selectedFile = ref(null)
const previewUrl   = ref('')
const caption      = ref('')
const guestName    = ref('')
const isDragging   = ref(false)
const uploading    = ref(false)
const successMsg   = ref('')
const errorMsg     = ref('')

function triggerFileInput() {
  if (previewUrl.value) return
  fileInput.value.click()
}

function handleFileChange(e) {
  const file = e.target.files[0]
  if (file) loadFile(file)
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) loadFile(file)
}

function loadFile(file) {
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => { previewUrl.value = e.target.result }
  reader.readAsDataURL(file)
}

function removePhoto() {
  selectedFile.value = null
  previewUrl.value   = ''
  fileInput.value.value = ''
}

async function submitUpload() {
  if (!selectedFile.value) return

  uploading.value = true
  errorMsg.value = ''

  try {
    // 1. Upload image to ImgBB
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    formData.append('key', IMGBB_API_KEY)

    const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    })

    const imgbbData = await imgbbRes.json()

    if (!imgbbData.success) {
      throw new Error('Image upload failed. Please try again.')
    }

    const imageUrl = imgbbData.data.url
    const thumbUrl = imgbbData.data.thumb?.url || imageUrl
    const deleteUrl = imgbbData.data.delete_url || ''

    // ADD THIS LOG
    console.log('Saving to Firestore:', {
      projectId: db.app.options.projectId,
      imageUrl
    })

    // 2. Save metadata to Firestore
    await addDoc(collection(db, 'memories'), {
      imageUrl,
      thumbUrl,
      deleteUrl,
      caption: caption.value.trim(),
      guestName: guestName.value.trim() || 'A Beloved Guest',
      createdAt: serverTimestamp()
    })

    console.log('Firestore save successful!')

    successMsg.value =
      'Your photo has been added to the wedding gallery. Thank you for celebrating with us!'

  } catch (err) {
    console.error('Upload or Firestore error:', err)
    console.error('Error code:', err.code)
    console.error('Error message:', err.message)

    errorMsg.value = err.message || 'Something went wrong. Please try again.'

  } finally {
    uploading.value = false
  }
}

function resetForm() {
  selectedFile.value = null
  previewUrl.value   = ''
  caption.value      = ''
  guestName.value    = ''
  successMsg.value   = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped>
.upload-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 80% 0%, #e0f0e8 0%, transparent 55%),
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
  border-bottom: 1px solid rgba(47,158,122,0.2);
}
.nav-logo {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  color: var(--ink);
  text-decoration: none;
}
.nav-logo em { font-family: var(--font-body); font-style: italic; color: var(--jade-dark); }
.nav-link {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-soft);
  text-decoration: none;
  transition: color 0.3s;
}
.nav-link:hover { color: var(--jade-dark); }

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
  color: var(--jade-dark);
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
  border: 1px solid rgba(47,158,122,0.25);
  border-radius: 2px;
  padding: 40px 36px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Drop Zone */
.drop-zone {
  border: 2px dashed rgba(47,158,122,0.45);
  border-radius: 2px;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
  position: relative;
  overflow: hidden;
  background: rgba(250,247,242,0.5);
}
.drop-zone:hover,
.drop-zone.active {
  border-color: var(--jade);
  background: rgba(47,158,122,0.05);
}
.drop-zone.hasPreview { cursor: default; }

.hidden-input { display: none; }

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
  color: var(--jade-dark);
  text-transform: uppercase;
}

.preview-wrap { width: 100%; height: 100%; position: relative; min-height: 220px; }
.preview-img {
  width: 100%;
  height: 280px;
  object-fit: cover;
  display: block;
}
.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(8,30,22,0.65);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.remove-btn:hover { background: rgba(0,0,0,0.85); }

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
  border: 1px solid rgba(47,158,122,0.3);
  border-radius: 2px;
  padding: 12px 16px;
  resize: none;
  transition: border-color 0.3s;
  outline: none;
  width: 100%;
}
.field-textarea:focus,
.field-input:focus { border-color: var(--jade); }
.char-count {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  color: var(--ink-soft);
  align-self: flex-end;
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
@keyframes spin { to { transform: rotate(360deg); } }

/* Banners */
.success-banner {
  margin-top: 32px;
  background: linear-gradient(135deg, #f7fcf9, #e8f4ee);
  border: 1px solid var(--jade);
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
</style>
