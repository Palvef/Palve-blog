---
title: "Friends"
comments: false
share: false

friends:
  - name: iBug
    github: https://github.com/iBug
    link: https://ibug.io/

net_friends:
  - name: iBug
    github: https://github.com/iBug
    link: https://ibug.io/
---

Friends:

{% for item in page.friends %}
- {{ item.name }}{% if item.github %} [<i class="fab fa-github"></i>](https://github.com/{{ item.github }}){% endif %}\: [<i class="fas fa-globe-americas"></i> {{ item.link }}]({{ item.link }}){: rel="noopener{% if item.name == "loliw" %} nofollow{% endif %}" }{% if item.comment %} ({{ item.comment | markdownify | remove: '<p>' | remove: '</p>' | strip }}){% endif %}
{% endfor %}{: .friends-list }

Other good folks online:

{% for item in page.net_friends %}
- {{ item.name }}{% if item.github %} [<i class="fab fa-github"></i>](https://github.com/{{ item.github }}){% endif %}\: [<i class="fas fa-globe-americas"></i> {{ item.link }}]({{ item.link }}){: rel="noopener" }
{% endfor %}{: .friends-list }

<style>.friends-list { list-style-type: none; padding-left: 1em; }</style>