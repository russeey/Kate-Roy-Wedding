<!-- src/views/WelcomeView.vue -->
<template>
  <div class="welcome-page">

    <!-- ── Scroll / Letter ── -->
    <div
      class="scroll-wrap"
      :class="{ unrolled: scrollOpen }"
      :style="{ '--open-ms': OPEN_MS + 'ms' }"
      :inert="showNameModal"
    >
      <!-- Top roll (moves UP as the scroll opens) -->
      <div class="scroll-roll top-roll" />

      <!-- Paper: its height grows from 0, so it opens from the middle -->
      <div ref="paperRef" class="scroll-paper">
        <div ref="innerRef" class="scroll-inner">

          <div class="letter-content" :class="{ visible: scrollOpen }">
            <div class="letter-header">
              <p class="letter-date">{{ weddingDate }}</p>
            </div>

            <div class="ornament"><span>✦</span></div>

            <h1 class="letter-names">Kate <em>&amp;</em> Roy</h1>

            <div class="ornament"><span>✦</span></div>

            <p class="letter-body">
              Welcome, dear <span class="guest-name">{{ greetingName }}</span>.<br /><br />
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
                <span>🌿 View the Gallery</span>
              </router-link>
            </div>
          </div>

        </div>
      </div>

      <!-- Bottom roll (moves DOWN as the scroll opens) -->
      <div class="scroll-roll bottom-roll" />

      <!-- Wax seal sits across the closed scroll -->
      <button
        v-if="!scrollOpen"
        type="button"
        class="seal"
        :class="{ breaking: sealBreaking }"
        aria-label="Open the invitation"
        @click="openScroll"
      >
        <span class="seal-initials">K&amp;R</span>
        <span class="seal-ring" />
      </button>

      <!-- Tap-to-open hint -->
      <div v-if="!scrollOpen" class="seal-hint" :class="{ fade: sealBreaking }">
        <p>Tap the seal to open your invitation</p>
        <div class="hint-arrow">↑</div>
      </div>
    </div>

    <!-- ── Name overlay (appears first) ── -->
    <transition name="modal">
      <div v-if="showNameModal" class="modal-backdrop" @keydown.esc="skipName">
        <form
          class="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="name-title"
          @submit.prevent="confirmName"
        >
          <p class="modal-eyebrow">Kate &amp; Roy’s Wedding</p>
          <div class="ornament"><span>✦</span></div>
          <h2 id="name-title" class="modal-title">What’s your name?</h2>
          <p class="modal-sub">So we can greet you properly.</p>

          <label class="sr-only" for="guest-name-input">Your name</label>
          <input
            id="guest-name-input"
            ref="nameInput"
            v-model="nameDraft"
            type="text"
            class="modal-input"
            placeholder="Enter your name"
            maxlength="40"
            autocomplete="name"
            autocapitalize="words"
          />

          <button type="submit" class="btn btn-filled modal-btn"><span>Continue</span></button>
          <button type="button" class="modal-skip" @click="skipName">Skip for now</button>
        </form>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'

// ─── Tweak the speed here ───────────────────────────────────────
const OPEN_MS = 2200   // how long the scroll takes to unroll (bigger = slower)
const SEAL_MS = 450    // how long the wax seal takes to break away
// ────────────────────────────────────────────────────────────────

const weddingDate  = 'A Day to Remember'
const scrollOpen   = ref(false)
const sealBreaking = ref(false)
const paperRef     = ref(null)
const innerRef     = ref(null)

// ── Guest name overlay ──
const showNameModal = ref(true)
const nameInput     = ref(null)
const nameDraft     = ref('')
const guestName     = ref('')
const greetingName  = computed(() => guestName.value || 'guest')

function confirmName() {
  guestName.value = nameDraft.value.replace(/\s+/g, ' ').trim()
  showNameModal.value = false
}
function skipName() {
  guestName.value = ''
  showNameModal.value = false
}

onMounted(() => nextTick(() => nameInput.value?.focus()))

let isOpening = false
const timers = []

function wait(ms) {
  return new Promise(resolve => timers.push(setTimeout(resolve, ms)))
}

async function openScroll() {
  if (isOpening || scrollOpen.value) return
  isOpening = true

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 1. The wax seal breaks away
  sealBreaking.value = true
  await wait(reduceMotion ? 0 : SEAL_MS)

  const paper = paperRef.value

  if (reduceMotion) {
    scrollOpen.value = true
    paper.style.height = 'auto'
    return
  }

  // 2. Measure how tall the letter needs to be
  const targetHeight = innerRef.value.offsetHeight

  // 3. Rolls start turning, paper grows from the middle
  scrollOpen.value = true
  paper.getBoundingClientRect()            // make sure the browser has the 0px start
  paper.style.height = targetHeight + 'px'

  // 4. When finished, let the height be automatic again (keeps it responsive)
  await wait(OPEN_MS + 50)
  paper.style.height = 'auto'
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background:
    radial-gradient(ellipse at 20% 50%, #e8eee0 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, #dfe7d4 0%, transparent 60%),
    var(--cream);
  position: relative;
  z-index: 1;
}

/* ── Scroll Wrapper ── */
.scroll-wrap {
  position: relative;
  width: min(680px, 94vw);
  --ease: cubic-bezier(0.45, 0.05, 0.25, 1);
}

/* ── Rolls ── */
.scroll-roll {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 28px;
  background:
    linear-gradient(180deg,
      #7f9670 0%, #b9c8ab 30%, #7f9670 50%, #566b4a 80%, #7f9670 100%);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18), inset 0 2px 4px rgba(255,255,255,0.3);
  overflow: hidden;
  transition: border-radius 0.6s ease, margin-top 0.8s ease;
}
/* ridges that slide while the roll turns */
.scroll-roll::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    rgba(255,255,255,0.16) 0,
    rgba(255,255,255,0.16) 2px,
    transparent 2px,
    transparent 7px
  );
}

/* Closed: the two rolls overlap and look like one rolled-up scroll */
.bottom-roll { margin-top: -8px; }

/* Open: rolls straighten out where they meet the paper */
.unrolled .top-roll {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.unrolled .bottom-roll {
  margin-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* Rolls turn in opposite directions while opening */
.unrolled .top-roll::before {
  animation: rollUp var(--open-ms) var(--ease) both;
}
.unrolled .bottom-roll::before {
  animation: rollDown var(--open-ms) var(--ease) both;
}
@keyframes rollUp   { from { background-position: 0 0; } to { background-position: 0 -63px; } }
@keyframes rollDown { from { background-position: 0 0; } to { background-position: 0 63px; } }

/* ── Paper (opens from the middle) ── */
.scroll-paper {
  position: relative;
  height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;        /* keeps the letter centred, so it is revealed from the middle */
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 27px,
      rgba(127,150,112,0.06) 28px
    ),
    linear-gradient(160deg, #fafbf7 0%, #eef2e6 50%, #f6f8f1 100%);
  border-left: 3px solid var(--sage);
  border-right: 3px solid var(--sage);
  transition: height var(--open-ms) var(--ease), box-shadow 1s ease;
}
.unrolled .scroll-paper {
  box-shadow:
    inset 4px 0 12px rgba(127,150,112,0.08),
    inset -4px 0 12px rgba(127,150,112,0.08),
    0 8px 48px rgba(0,0,0,0.12);
}
.scroll-paper::before {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(127,150,112,0.2);
  pointer-events: none;
}

.scroll-inner {
  flex: none;
  padding: 48px 52px;
}

/* ── Wax Seal ── */
.seal {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 6;
  width: 100px;
  height: 100px;
  padding: 0;
  border: none;
  background: radial-gradient(circle at 35% 35%, #7f9670, #3f5436);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transform: translate(-50%, -50%);
  box-shadow:
    0 6px 24px rgba(63,84,54,0.35),
    inset 0 2px 4px rgba(225,240,210,0.2);
  transition: transform 0.45s ease, box-shadow 0.3s ease, opacity 0.45s ease, filter 0.45s ease;
}
.seal:hover {
  transform: translate(-50%, -50%) scale(1.06);
  box-shadow: 0 10px 32px rgba(63,84,54,0.45), inset 0 2px 4px rgba(225,240,210,0.2);
}
.seal:focus-visible { outline: 3px solid var(--sage-light); outline-offset: 4px; }
/* the seal "breaks" when tapped */
.seal.breaking {
  transform: translate(-50%, -50%) scale(1.35) rotate(10deg);
  opacity: 0;
  filter: blur(2px);
  pointer-events: none;
}
.seal-ring {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 2px solid rgba(230,242,220,0.3);
  pointer-events: none;
}
.seal-initials {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: #f3f8ec;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.seal-hint {
  position: absolute;
  top: calc(100% + 46px);
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-sans);
  font-size: 0.78rem;
  color: var(--ink-soft);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: opacity 0.4s ease;
}
.seal-hint.fade { opacity: 0; }
.hint-arrow {
  font-size: 1.4rem;
  color: var(--sage);
  animation: bounce 1.4s ease-in-out infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}

/* ── Letter Content ── */
.letter-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  /* hidden until the scroll starts to open (also removes the links from tab order) */
  visibility: hidden;
  opacity: 0;
}
.letter-content.visible {
  visibility: visible;
  opacity: 1;
  transition: opacity 1.2s ease 0.6s;
}

.letter-date {
  font-family: var(--font-sans);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--sage-dark);
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
  color: var(--sage-dark);
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
  color: var(--sage-dark);
}

.letter-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}

/* ── Name in the greeting ── */
.guest-name {
  font-style: normal;
  font-family: var(--font-display);
  font-size: 0.88em;
  letter-spacing: 0.06em;
  color: var(--sage-dark);
  overflow-wrap: anywhere;
}

/* ── Name overlay ── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(34, 46, 28, 0.55);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  overflow-y: auto;
}
.modal-card {
  position: relative;
  width: min(420px, 100%);
  padding: 40px 34px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  background: linear-gradient(160deg, #fafbf7 0%, #eef2e6 50%, #f6f8f1 100%);
  border: 1px solid var(--sage);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}
.modal-card::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(127,150,112,0.25);
  pointer-events: none;
}
.modal-card .ornament { width: 100%; font-size: 1.1rem; }
.modal-eyebrow {
  font-family: var(--font-sans);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--sage-dark);
}
.modal-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: var(--ink);
}
.modal-sub {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 1.1rem;
  color: var(--ink-soft);
}
.modal-input {
  width: 100%;
  margin-top: 6px;
  padding: 13px 16px;
  font-family: var(--font-body);
  font-size: 1.15rem;           /* 16px+ stops iPhones zooming in */
  text-align: center;
  color: var(--ink);
  background: var(--white);
  border: 1px solid rgba(127,150,112,0.4);
  border-radius: 2px;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.modal-input:focus {
  border-color: var(--sage);
  box-shadow: 0 0 0 3px rgba(127,150,112,0.18);
}
.modal-btn { width: 100%; justify-content: center; margin-top: 6px; }
.modal-skip {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  font-family: var(--font-sans);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.3s;
}
.modal-skip:hover { color: var(--sage-dark); }

/* pop in / out */
.modal-enter-active,
.modal-leave-active { transition: opacity 0.4s ease; }
.modal-enter-active .modal-card { transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease; }
.modal-leave-active .modal-card { transition: transform 0.35s ease, opacity 0.3s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.88) translateY(18px); opacity: 0; }
.modal-leave-to .modal-card   { transform: scale(0.96) translateY(-8px); opacity: 0; }

/* ── Mobile ── */
@media (max-width: 520px) {
  .welcome-page { padding: 24px 12px; min-height: 100dvh; }
  .scroll-wrap { width: 100%; }
  .scroll-roll { height: 22px; border-radius: 11px; }
  .bottom-roll { margin-top: -6px; }
  .scroll-inner { padding: 32px 22px; }
  .scroll-paper::before { inset: 8px; }

  .seal { width: 84px; height: 84px; }
  .seal-initials { font-size: 1.1rem; }
  .seal-hint { font-size: 0.7rem; top: calc(100% + 40px); }

  .modal-card { padding: 32px 22px 24px; }
  .modal-title { font-size: 1.3rem; }

  .letter-content { gap: 16px; }
  .letter-names { font-size: clamp(2rem, 11vw, 2.6rem); }
  .letter-body { font-size: 1.05rem; line-height: 1.75; }
  .letter-invitation { font-size: 1rem; }

  .letter-actions { flex-direction: column; width: 100%; gap: 12px; }
  .letter-actions .btn { width: 100%; justify-content: center; }
}

/* People who prefer less motion get the letter instantly */
@media (prefers-reduced-motion: reduce) {
  .scroll-paper,
  .scroll-roll,
  .seal,
  .letter-content,
  .letter-content.visible,
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-card,
  .modal-leave-active .modal-card { transition: none !important; }
  .scroll-roll::before,
  .hint-arrow { animation: none !important; }
}
</style>