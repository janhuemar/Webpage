---
permalink: /
title: "Jan Huertas, PhD"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

## About me

I am a Herchel Smith Research Fellow in the Collepardo Lab at the University of Cambridge.

My research uses molecular simulations to understand how chromatin structure regulates DNA accessibility and transcription factor binding. I am particularly interested in pioneer transcription factors, nucleosome dynamics, and multiscale models of genome organisation.

You can read more on the [Research](/research/) page, browse all papers on the [Publications](/publications/) page, or take a look at my [CV](/cv/).

## Latest papers

{% assign pubs = site.publications | sort: "date" | reverse %}
{% for post in pubs limit:3 %}
### [{{ post.title }}]({{ post.url | relative_url }})

{% if post.venue %}*{{ post.venue }}*{% endif %}{% if post.date %}, {{ post.date | date: "%Y" }}{% endif %}

{% if post.excerpt %}
{{ post.excerpt | markdownify | strip_html | truncate: 260 }}
{% endif %}

[Read more]({{ post.url | relative_url }})

{% endfor %}

[See all publications →](/publications/)

## Bluesky

<iframe
  src="https://embed.bsky.app/profile/janhuemar.bsky.social"
  title="Bluesky feed"
  width="100%"
  height="600"
  style="border:0; border-radius: 8px; overflow:hidden;"
  loading="lazy">
</iframe>
