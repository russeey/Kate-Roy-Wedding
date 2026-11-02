<!-- src/views/GalleryView.vue -->
<template>
  <div class="gallery-page">

    <!-- Nav -->
    <nav class="top-nav">
      <router-link to="/" class="nav-logo">Kate <em>&amp;</em> Roy</router-link>
      <router-link to="/upload" class="btn" style="padding: 10px 22px; font-size:0.7rem;">
        <span>📷 Upload</span>
      </router-link>
    </nav>

    <div class="page-container">

      <!-- Header -->
      <header class="page-header">
        <p class="eyebrow">Wedding Gallery</p>
        <h2 class="page-title">Our Memories Together</h2>
        <div class="ornament"><span>✦</span></div>
        <p class="page-subtitle" v-if="memories.length">
          {{ memories.length }} beautiful moment{{ memories.length !== 1 ? 's' : '' }} captured
        </p>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner" />
        <p>Loading memories…</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!albums.length && !singles.length" class="empty-state">
        <div class="empty-icon">🌿</div>
        <h3>No memories yet</h3>
        <p>Be the first to share a photo from Kate &amp; Roy's special day!</p>
        <router-link to="/upload" class="btn btn-filled"><span>Share a Memory</span></router-link>
      </div>

      <template v-else>

        <!-- Albums -->
        <section v-if="albums.length" class="section">
          <h3 class="section-title">Albums</h3>
          <div class="album-grid">
            <router-link
              v-for="(album, index) in albums"
              :key="album.id"
              :to="`/album/${album.id}`"
              class="album-card"
              :style="{ animationDelay: (index * 0.07) + 's' }"
            >
              <div class="album-stack">
                <img
                  :src="album.coverUrl"
                  :alt="album.title"
                  class="album-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div class="album-info">
                <p class="album-title">{{ album.title }}</p>
                <p class="album-meta">
                  {{ album.count }} photo{{ album.count !== 1 ? 's' : '' }} · {{ album.guestName }}
                </p>
              </div>
            </router-link>
          </div>
        </section>

        <!-- Single photos -->
        <section v-if="singles.length" class="section">
          <h3 v-if="albums.length" class="section-title">Photos</h3>
          <div class="gallery-grid">
            <div
              v-for="(memory, index) in singles"
              :key="memory.id"
              class="gallery-item"
              :style="{ animationDelay: (index * 0.07) + 's' }"
              @click="openLightbox(memory)"
            >
              <div class="gallery-img-wrap">
                <img
                  :src="memory.imageUrl"
                  :alt="memory.caption || 'Wedding memory'"
                  class="gallery-img"
                  loading="lazy"
                  decoding="async"
                />
                <div class="gallery-overlay">
                  <p v-if="memory.caption" class="overlay-caption">{{ memory.caption }}</p>
                  <p class="overlay-guest">— {{ memory.guestName }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </template>

    </div>

    <!-- Lightbox -->
    <transition name="lightbox">
      <div v-if="lightboxMemory" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">✕</button>

        <!-- Prev / Next -->
        <button
          v-if="lightboxIndex > 0"
          class="lightbox-nav prev"
          @click.stop="navigateLightbox(-1)"
        >‹</button>
        <button
          v-if="lightboxIndex < singles.length - 1"
          class="lightbox-nav next"
          @click.stop="navigateLightbox(1)"
        >›</button>

        <div class="lightbox-inner">
          <img
            :src="lightboxMemory.imageUrl"
            :alt="lightboxMemory.caption"
            class="lightbox-img"
          />
          <div class="lightbox-meta">
            <p v-if="lightboxMemory.caption" class="lightbox-caption">
              "{{ lightboxMemory.caption }}"
            </p>
            <p class="lightbox-guest">— {{ lightboxMemory.guestName }}</p>
            <p class="lightbox-date">{{ formatDate(lightboxMemory.createdAt) }}</p>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

const memories       = ref([])   // every photo (singles + album photos)
const albums         = ref([])
const loading        = ref(true)
const lightboxMemory = ref(null)
const lightboxIndex  = ref(0)

// Photos that are NOT part of an album
const singles = computed(() => memories.value.filter(m => !m.albumId))

onMounted(async () => {
  try {
    const q    = query(collection(db, 'memories'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    memories.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Group album photos so we can show a count + cover
    const byAlbum = {}
    memories.value.forEach(m => {
      if (m.albumId) (byAlbum[m.albumId] ||= []).push(m)
    })

    const albumSnap = await getDocs(
      query(collection(db, 'albums'), orderBy('createdAt', 'desc'))
    )
    albums.value = albumSnap.docs
      .map(d => {
        const photos = byAlbum[d.id] || []
        // memories are newest-first, so the last one is the first uploaded
        const cover = photos[photos.length - 1]
        return { id: d.id, ...d.data(), count: photos.length, coverUrl: cover?.imageUrl }
      })
      .filter(a => a.count > 0)
  } catch (err) {
    console.error('Failed to load memories:', err)
  } finally {
    loading.value = false
  }
})

function openLightbox(memory) {
  lightboxIndex.value  = singles.value.findIndex(m => m.id === memory.id)
  lightboxMemory.value = memory
  document.body.style.overflow = 'hidden'
}
function closeLightbox() {
  lightboxMemory.value = null
  document.body.style.overflow = ''
}
function navigateLightbox(dir) {
  const newIdx = lightboxIndex.value + dir
  if (newIdx >= 0 && newIdx < singles.value.length) {
    lightboxIndex.value  = newIdx
    lightboxMemory.value = singles.value[newIdx]
  }
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<style scoped>
.gallery-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 10% 90%, #e8eee0 0%, transparent 55%),
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

/* Layout */
.page-container {
  max-width: 1100px;
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
  font-size: 1rem;
  color: var(--ink-soft);
  font-style: italic;
}

/* States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 80px 20px;
  text-align: center;
  color: var(--ink-soft);
  font-family: var(--font-body);
  font-size: 1.1rem;
  font-style: italic;
}
.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(127,150,112,0.25);
  border-top-color: var(--sage);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 3rem; }
.empty-state h3 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--ink);
  font-style: normal;
}

/* Gallery Grid */
.gallery-grid {
  columns: 3 280px;
  gap: 16px;
}

.gallery-item {
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
  animation: fadeUp 0.6s ease both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.gallery-img-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.gallery-img {
  width: 100%;
  display: block;
  transition: transform 0.5s ease;
}
.gallery-item:hover .gallery-img { transform: scale(1.04); }

.gallery-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(26,34,22,0.85));
  padding: 40px 16px 16px;
  transform: translateY(100%);
  transition: transform 0.4s ease;
}
.gallery-item:hover .gallery-overlay { transform: translateY(0); }

.overlay-caption {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: rgba(255,255,255,0.95);
  font-style: italic;
  margin-bottom: 4px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.overlay-guest {
  font-family: var(--font-sans);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--sage-light);
}

/* Sections */
.section { margin-bottom: 56px; }
.section-title {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--sage-dark);
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(127,150,112,0.5), transparent);
}

/* Album cards */
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 28px;
}
.album-card {
  display: block;
  text-decoration: none;
  color: inherit;
  animation: fadeUp 0.6s ease both;
}
.album-stack {
  position: relative;
  aspect-ratio: 4 / 3;
  margin: 0 8px 12px 0;
}
/* two "sheets" peeking out behind the cover = looks like a stack */
.album-stack::before,
.album-stack::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--white);
  border: 1px solid rgba(127,150,112,0.3);
  border-radius: 2px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  transition: transform 0.4s ease;
}
.album-stack::before { transform: translate(8px, 8px) rotate(2deg); }
.album-stack::after  { transform: translate(4px, 4px) rotate(1deg); }
.album-card:hover .album-stack::before { transform: translate(12px, 10px) rotate(3.5deg); }
.album-card:hover .album-stack::after  { transform: translate(6px, 5px) rotate(1.8deg); }

.album-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 2px;
  z-index: 2;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  transition: transform 0.4s ease;
}
.album-card:hover .album-cover { transform: translateY(-3px); }

.album-info { padding-top: 4px; }
.album-title {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.06em;
  color: var(--ink);
  margin-bottom: 4px;
}
.album-meta {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
}

/* ── Lightbox ── */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(22, 30, 18, 0.93);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(8px);
}

.lightbox-close {
  position: fixed;
  top: 24px;
  right: 28px;
  background: none;
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}
.lightbox-close:hover { background: rgba(255,255,255,0.15); }

.lightbox-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  line-height: 1;
}
.lightbox-nav:hover { background: rgba(255,255,255,0.2); }
.lightbox-nav.prev { left: 20px; }
.lightbox-nav.next { right: 20px; }

.lightbox-inner {
  max-width: 860px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.lightbox-img {
  max-height: 70vh;
  max-width: 100%;
  object-fit: contain;
  border-radius: 2px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.5);
}
.lightbox-meta { text-align: center; }
.lightbox-caption {
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-style: italic;
  color: rgba(255,255,255,0.9);
  line-height: 1.7;
  margin-bottom: 8px;
}
.lightbox-guest {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--sage-light);
  margin-bottom: 6px;
}
.lightbox-date {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  color: rgba(255,255,255,0.4);
}

/* Lightbox transition */
.lightbox-enter-active,
.lightbox-leave-active { transition: opacity 0.35s ease; }
.lightbox-enter-from,
.lightbox-leave-to     { opacity: 0; }

/* ── Mobile ── */
@media (max-width: 640px) {
  .top-nav { padding: 14px 18px; }
  .page-container { padding: 28px 14px 56px; }
  .page-header { margin-bottom: 28px; }
  .section { margin-bottom: 36px; }

  /* 2 columns, like desktop's masonry but smaller */
  .gallery-grid { columns: 2; gap: 10px; }
  .gallery-item { margin-bottom: 10px; }

  .album-grid { grid-template-columns: repeat(2, 1fr); gap: 20px 14px; }
  .album-title { font-size: 0.85rem; }
  .album-meta { font-size: 0.64rem; }

  .lightbox { padding: 12px; }
  .lightbox-close { top: 12px; right: 12px; width: 36px; height: 36px; }
  .lightbox-nav { width: 38px; height: 38px; font-size: 1.3rem; }
  .lightbox-nav.prev { left: 8px; }
  .lightbox-nav.next { right: 8px; }
  .lightbox-img { max-height: 62vh; }
  .lightbox-caption { font-size: 1.05rem; }
}

/* Phones have no "hover", so show captions all the time */
@media (hover: none) {
  .gallery-overlay { transform: translateY(0); padding: 26px 10px 10px; }
  .overlay-caption { font-size: 0.8rem; margin-bottom: 2px; }
  .overlay-guest { font-size: 0.6rem; }
  .gallery-item:hover .gallery-img { transform: none; }
}

</style>