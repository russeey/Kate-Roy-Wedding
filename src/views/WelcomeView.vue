<!-- src/views/WelcomeView.vue -->
<template>
  <div class="welcome-page">

    <!-- ── Scroll / Letter ── -->
    <div class="scroll-wrap" :class="{ unrolled: scrollOpen }">
      <!-- Decorative scroll rolls -->
      <div class="scroll-roll top-roll" />
      <div class="scroll-roll bottom-roll" />

      <!-- Scroll body -->
      <div class="scroll-body">
        <!-- Wax seal (before open) -->
        <div class="seal" v-if="!scrollOpen" @click="openScroll">
          <span class="seal-initials">K&R</span>
          <div class="seal-ring" />
        </div>

        <!-- Letter content (after open) -->
        <transition name="letter">
          <div v-if="scrollOpen" class="letter-content">
            <div class="letter-header">
              <p class="letter-date">{{ weddingDate }}</p>
            </div>

            <div class="ornament"><span>✦</span></div>

            <h1 class="letter-names">Kate <em>&amp;</em> Roy</h1>

            <div class="ornament"><span>✦</span></div>

            <p class="letter-body">
              Welcome, dear guest.<br /><br />
              Today, two hearts become one — and we are so glad
              you are here to witness and celebrate this beautiful
              chapter of our love story.<br /><br />
              As you share in our joy, we invite you to capture
              the magic of this day. Upload your photos, add your
              heartfelt captions, and help us build a gallery of
              memories we will treasure forever.
            </p>

            <p class="letter-invitation">
              With all our love,<br />
              <strong>Kate &amp; Roy</strong>
            </p>

            <div class="letter-actions">
              <router-link to="/upload" class="btn btn-filled">
                <span>📷 Share Your Memories</span>
              </router-link>
              <router-link to="/gallery" class="btn">
                <span>🌸 View the Gallery</span>
              </router-link>
            </div>
          </div>
        </transition>

        <!-- Tap-to-open hint -->
        <div class="seal-hint" v-if="!scrollOpen">
          <p>Tap the seal to open your invitation</p>
          <div class="hint-arrow">↓</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const scrollOpen = ref(false)
const weddingDate = 'A Day to Remember'

function openScroll() {
  scrollOpen.value = true
}
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background:
    radial-gradient(ellipse at 20% 50%, #e3f1ea 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, #d9ece2 0%, transparent 60%),
    var(--cream);
  position: relative;
  z-index: 1;
}

/* ── Scroll Wrapper ── */
.scroll-wrap {
  position: relative;
  width: min(680px, 94vw);
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Decorative wooden rolls at top and bottom */
.scroll-roll {
  width: 100%;
  height: 28px;
  background:
    linear-gradient(180deg,
      #2f9e7a 0%, #8fd3b6 30%, #2f9e7a 50%, #1c6b52 80%, #2f9e7a 100%);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18), inset 0 2px 4px rgba(255,255,255,0.3);
  position: relative;
  z-index: 3;
}
.top-roll { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.bottom-roll {
  position: absolute;
  bottom: 0;
  left: 0;
  transform: translateY(0);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.unrolled .bottom-roll {
  transform: translateY(100%);
}

/* Parchment body */
.scroll-body {
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 27px,
      rgba(47,158,122,0.06) 28px
    ),
    linear-gradient(160deg, #f7fcf9 0%, #e8f4ee 50%, #f3faf6 100%);
  border-left: 3px solid var(--jade);
  border-right: 3px solid var(--jade);
  padding: 48px 52px;
  min-height: 200px;
  position: relative;
  overflow: hidden;
  box-shadow:
    inset 4px 0 12px rgba(47,158,122,0.08),
    inset -4px 0 12px rgba(47,158,122,0.08),
    0 8px 48px rgba(0,0,0,0.12);
}
.scroll-body::before {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(47,158,122,0.2);
  pointer-events: none;
}

/* ── Wax Seal ── */
.seal {
  width: 100px;
  height: 100px;
  background: radial-gradient(circle at 35% 35%, #2f9e7a, #0f4d3a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto 12px;
  cursor: pointer;
  box-shadow:
    0 6px 24px rgba(15,77,58,0.35),
    inset 0 2px 4px rgba(160,255,220,0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
}
.seal:hover {
  transform: scale(1.06);
  box-shadow: 0 10px 32px rgba(15,77,58,0.45), inset 0 2px 4px rgba(160,255,220,0.2);
}
.seal-ring {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 2px solid rgba(200,255,235,0.3);
}
.seal-initials {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: #e6fff5;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.seal-hint {
  text-align: center;
  margin-top: 24px;
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--ink-soft);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.hint-arrow {
  font-size: 1.4rem;
  color: var(--jade);
  animation: bounce 1.4s ease-in-out infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(6px); }
}

/* ── Letter Content ── */
.letter-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.letter-date {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--jade-dark);
}

.letter-names {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 7vw, 4.2rem);
  font-weight: 400;
  letter-spacing: 0.06em;
  color: var(--ink);
  line-height: 1.1;
}
.letter-names em {
  font-style: italic;
  color: var(--jade-dark);
  font-family: var(--font-body);
  font-size: 0.9em;
}

.letter-body {
  font-family: var(--font-body);
  font-size: 1.18rem;
  line-height: 1.9;
  color: var(--ink-soft);
  max-width: 480px;
  font-style: italic;
}

.letter-invitation {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: var(--ink);
  line-height: 1.8;
}
.letter-invitation strong {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.08em;
  color: var(--jade-dark);
}

.letter-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}

/* Transition for letter content */
.letter-enter-active { transition: opacity 0.9s ease 0.4s, transform 0.9s ease 0.4s; }
.letter-enter-from   { opacity: 0; transform: translateY(20px); }
</style>
