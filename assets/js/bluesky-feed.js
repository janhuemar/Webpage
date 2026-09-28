/*
 * Bluesky feed widget
 * Shows the latest public posts (and reposts) from a Bluesky account, using
 * the public Bluesky API. No account, key or third-party service needed.
 * Markup lives in _includes/bluesky-feed.html; styles in _sass/layout/_custom.scss.
 */
(function () {
  'use strict';

  var API = 'https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function safeUrl(url) {
    return /^https?:\/\//i.test(url || '') ? url : null;
  }

  function link(href, text) {
    var a = el('a', null, text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

  // Turn post text + facets (links, mentions, hashtags) into DOM nodes.
  // Facet offsets are UTF-8 byte positions, so slice on the encoded bytes.
  function richText(text, facets) {
    var frag = document.createDocumentFragment();
    var enc = new TextEncoder();
    var dec = new TextDecoder();
    var bytes = enc.encode(text || '');
    var pos = 0;
    var sorted = (facets || []).slice().sort(function (a, b) {
      return a.index.byteStart - b.index.byteStart;
    });

    sorted.forEach(function (f) {
      var start = f.index.byteStart;
      var end = f.index.byteEnd;
      if (start < pos || end > bytes.length) return;
      if (start > pos) frag.appendChild(document.createTextNode(dec.decode(bytes.slice(pos, start))));
      var label = dec.decode(bytes.slice(start, end));
      var feat = (f.features || [])[0] || {};
      var href = null;
      if (feat.$type === 'app.bsky.richtext.facet#link') href = safeUrl(feat.uri);
      if (feat.$type === 'app.bsky.richtext.facet#mention') href = 'https://bsky.app/profile/' + feat.did;
      if (feat.$type === 'app.bsky.richtext.facet#tag') href = 'https://bsky.app/hashtag/' + encodeURIComponent(feat.tag);
      frag.appendChild(href ? link(href, label) : document.createTextNode(label));
      pos = end;
    });

    if (pos < bytes.length) frag.appendChild(document.createTextNode(dec.decode(bytes.slice(pos))));
    return frag;
  }

  // Pick a thumbnail from whatever the post embeds (images, link card, quote).
  function thumbOf(embed) {
    if (!embed) return null;
    var t = embed.$type || '';
    if (t.indexOf('app.bsky.embed.images') === 0 && embed.images && embed.images[0]) {
      return { src: embed.images[0].thumb, alt: embed.images[0].alt || '' };
    }
    if (t.indexOf('app.bsky.embed.external') === 0 && embed.external && embed.external.thumb) {
      return { src: embed.external.thumb, alt: embed.external.title || '' };
    }
    if (t.indexOf('app.bsky.embed.video') === 0 && embed.thumbnail) {
      return { src: embed.thumbnail, alt: embed.alt || '' };
    }
    if (t.indexOf('app.bsky.embed.recordWithMedia') === 0) return thumbOf(embed.media);
    if (t.indexOf('app.bsky.embed.record') === 0 && embed.record && embed.record.embeds) {
      return thumbOf(embed.record.embeds[0]);
    }
    return null;
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function renderItem(item) {
    var post = item.post;
    var record = post.record || {};
    var li = el('li', 'bsky-feed__item');
    var body = el('div', 'bsky-feed__body');

    var meta = el('span', 'bsky-feed__meta', formatDate(record.createdAt || post.indexedAt));
    var isRepost = item.reason && /reasonRepost$/.test(item.reason.$type || '');
    if (isRepost) {
      var who = post.author.displayName || '@' + post.author.handle;
      meta.textContent += ' · reposted from ' + who;
    }
    body.appendChild(meta);

    var text = el('div', 'bsky-feed__text');
    text.appendChild(richText(record.text, record.facets));
    body.appendChild(text);

    var rkey = (post.uri || '').split('/').pop();
    var more = link('https://bsky.app/profile/' + post.author.did + '/post/' + rkey, 'View on Bluesky →');
    var moreWrap = el('div');
    moreWrap.appendChild(more);
    body.appendChild(moreWrap);

    li.appendChild(body);

    var thumb = thumbOf(post.embed);
    if (thumb && safeUrl(thumb.src)) {
      var img = el('img', 'bsky-feed__thumb');
      img.src = thumb.src;
      img.alt = thumb.alt;
      img.loading = 'lazy';
      li.appendChild(img);
    }
    return li;
  }

  function init(root) {
    var handle = root.getAttribute('data-bsky-handle');
    var limit = parseInt(root.getAttribute('data-bsky-limit'), 10) || 5;
    var showReposts = root.getAttribute('data-bsky-reposts') !== 'false';
    var list = root.querySelector('.bsky-feed__list');
    var status = root.querySelector('.bsky-feed__status');
    if (!handle || !list) return;

    var url = API + '?actor=' + encodeURIComponent(handle) +
      '&filter=posts_no_replies&limit=' + Math.min(limit * 4, 50);

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var items = (data.feed || []).filter(function (item) {
          return showReposts || !(item.reason && /reasonRepost$/.test(item.reason.$type || ''));
        }).slice(0, limit);
        if (!items.length) throw new Error('no posts');
        items.forEach(function (item) { list.appendChild(renderItem(item)); });
        if (status) status.remove();
      })
      .catch(function () {
        if (status) status.textContent = 'Latest posts could not be loaded right now.';
      });
  }

  document.querySelectorAll('.bsky-feed[data-bsky-handle]').forEach(init);
})();
