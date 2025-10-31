// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

const button = document.getElementById("getImageBtn");
const gallery = document.getElementById('gallery');
const randomFactEl = document.getElementById('randomFact');

function formatDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return iso;
    }
}

function makeGalleryItem(item) {
    const wrap = document.createElement('article');
    wrap.className = 'gallery-item';

    // Media container (image or video thumbnail)
    const mediaLink = document.createElement('a');
    mediaLink.href = item.url || '#';
    mediaLink.target = '_blank';
    mediaLink.rel = 'noopener noreferrer';

    if (item.media_type === 'image') {
        const img = document.createElement('img');
        img.src = item.hdurl || item.url;
        img.alt = item.title || 'APOD Image';
        mediaLink.appendChild(img);
        wrap.appendChild(mediaLink);
    } else if (item.media_type === 'video') {
        // If we have a thumbnail, show it; otherwise show a simple link box
        if (item.thumbnail_url) {
            const img = document.createElement('img');
            img.src = item.thumbnail_url;
            img.alt = item.title || 'APOD Video';
            mediaLink.appendChild(img);
            // add a play overlay
            const overlay = document.createElement('div');
            overlay.style.position = 'relative';
            overlay.style.top = '-200px';
            overlay.style.height = '0';
            // lightweight visual cue: nothing fancy in CSS, but set aria-label
            mediaLink.setAttribute('aria-label', 'Open video in new tab');
            wrap.appendChild(mediaLink);
        } else {
            const linkBox = document.createElement('div');
            linkBox.style.padding = '20px';
            linkBox.style.textAlign = 'center';
            const a = document.createElement('a');
            a.href = item.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = 'View video';
            linkBox.appendChild(a);
            wrap.appendChild(linkBox);
        }
    } else {
        // unknown media type: show a link to the resource
        const a = document.createElement('a');
        a.href = item.url || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Open resource';
        wrap.appendChild(a);
    }

    // Title and date
    const title = document.createElement('h3');
    title.textContent = item.title || 'Untitled';
    title.style.marginTop = '10px';
    wrap.appendChild(title);

    const dateP = document.createElement('p');
    dateP.textContent = formatDate(item.date || '');
    dateP.style.fontSize = '13px';
    dateP.style.color = '#666';
    wrap.appendChild(dateP);

        // store the full item on the element for modal use
        wrap.dataset.apod = JSON.stringify(item);

        // open modal when clicking the gallery item (not the link)
        wrap.addEventListener('click', (e) => {
            // prevent opening modal when user clicks the link that should open in new tab
            if (e.target.tagName === 'A' || e.target.closest('a')) return;
            openModal(item);
        });

        return wrap;
}

async function onClick(event) {
    event.preventDefault();

        // loading state (visible to assistive tech via aria-live)
        gallery.innerHTML = '';
        gallery.setAttribute('aria-live', 'polite');
        const loading = document.createElement('div');
        loading.className = 'placeholder';
        loading.textContent = '🔄 Loading space photos…';
        loading.setAttribute('role', 'status');
        gallery.appendChild(loading);

        button.disabled = true;
        button.textContent = 'Loading...';

    try {
        const res = await fetch(apodData);
        if (!res.ok) throw new Error(`Network error: ${res.status}`);
        const data = await res.json();

        // data is expected to be an array of APOD-like objects
        if (!Array.isArray(data) || data.length === 0) {
            gallery.innerHTML = '';
            const noData = document.createElement('div');
            noData.className = 'placeholder';
            noData.textContent = 'No images found.';
            gallery.appendChild(noData);
            return;
        }

        // Clear gallery and render items
        gallery.innerHTML = '';
        data.forEach(item => {
            const node = makeGalleryItem(item);
            gallery.appendChild(node);
        });
    } catch (err) {
        console.error(err);
        gallery.innerHTML = '';
        const errDiv = document.createElement('div');
        errDiv.className = 'placeholder';
        errDiv.textContent = 'Failed to load images. Please try again later.';
        gallery.appendChild(errDiv);
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch Space Images';
    }
}

button.addEventListener('click', onClick);

/* Modal logic */
function openModal(item) {
    // create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    // modal container
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    // close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => closeModal(backdrop));
    modal.appendChild(closeBtn);

    // media: prefer hdurl for images
    if (item.media_type === 'image') {
        const img = document.createElement('img');
        img.src = item.hdurl || item.url;
        img.alt = item.title || 'APOD Image';
        modal.appendChild(img);
    } else if (item.media_type === 'video') {
        // if the URL looks embeddable (youtube), embed iframe; else show thumbnail and link
        if (item.url && item.url.includes('youtube.com')) {
            const iframe = document.createElement('iframe');
            iframe.src = item.url;
            iframe.width = '100%';
            iframe.height = '500';
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            modal.appendChild(iframe);
        } else if (item.thumbnail_url) {
            const img = document.createElement('img');
            img.src = item.thumbnail_url;
            img.alt = item.title || 'APOD Video';
            modal.appendChild(img);
        } else {
            const a = document.createElement('a');
            a.href = item.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = 'Open video';
            modal.appendChild(a);
        }
    }

    // meta: title and date
    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('h2');
    title.textContent = item.title || 'Untitled';
    meta.appendChild(title);

    const date = document.createElement('div');
    date.textContent = formatDate(item.date || '');
    date.style.color = '#666';
    meta.appendChild(date);

    modal.appendChild(meta);

    // explanation
    if (item.explanation) {
        const expl = document.createElement('div');
        expl.className = 'explanation';
        expl.textContent = item.explanation;
        modal.appendChild(expl);
    }

    // append modal to backdrop and to body
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // close on backdrop click (but not when clicking inside modal)
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop);
    });

    // close on Escape
    function onKey(e) {
        if (e.key === 'Escape') closeModal(backdrop);
    }
    document.addEventListener('keydown', onKey, { once: true });
}

function closeModal(backdrop) {
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
}

// --- Random space facts ---
const SPACE_FACTS = [
    "Did you know the footprints on the Moon will likely remain for millions of years because there's no wind to erase them?",
    "A day on Venus is longer than a year on Venus — it rotates very slowly compared to its orbit.",
    "Neutron stars are so dense that a teaspoon of neutron star material would weigh about a billion tons on Earth.",
    "There are thousands of exoplanets discovered outside our solar system; some orbit two stars at once.",
    "Jupiter's magnetic field is 20,000 times stronger than Earth's — it traps intense radiation belts.",
    "Space is not completely empty — there are particles, radiation, and tiny amounts of gas between stars.",
];

function renderRandomFact() {
    if (!randomFactEl) return;
    const i = Math.floor(Math.random() * SPACE_FACTS.length);
    randomFactEl.innerHTML = `<strong>Did you know?</strong> ${SPACE_FACTS[i]} <small>— A fun space fact</small>`;
}

// Show a random fact on initial page load
document.addEventListener('DOMContentLoaded', () => {
    renderRandomFact();
});

