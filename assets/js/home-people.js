/* Preview the first four leaders in roster order; the team page shows everyone. */
(function () {
  'use strict';
  var target = document.getElementById('home-team');
  if (!target) return;
  function text(tag, value) {
    var node = document.createElement(tag);
    node.textContent = value;
    return node;
  }
  fetch('assets/data/team.json').then(function (response) {
    if (!response.ok) throw new Error('Team roster unavailable');
    return response.json();
  }).then(function (data) {
    var people = Array.isArray(data.leadership) ? data.leadership.slice(0, 4) : [];
    if (!people.length) return;
    var cards = document.createDocumentFragment();
    people.forEach(function (person) {
      var card = document.createElement('a');
      card.className = 'person-preview';
      card.href = 'about.html#leadership';
      var image = document.createElement('img');
      image.src = person.image && /^assets\/img\//.test(person.image) && !person.image.includes('..')
        ? person.image : 'assets/img/headshots/placeholder.jpeg';
      image.alt = '';
      image.loading = 'lazy';
      image.width = 300;
      image.height = 360;
      image.addEventListener('error', function () {
        if (!image.src.endsWith('/placeholder.jpeg')) image.src = 'assets/img/headshots/placeholder.jpeg';
      });
      card.append(image, text('h3', person.name || 'Team member'), text('p', person.role || 'NYU Concrete Canoe'));
      cards.append(card);
    });
    target.replaceChildren(cards);
  }).catch(function () {
    // Keep the team-page link available if the roster cannot load.
  });
})();
