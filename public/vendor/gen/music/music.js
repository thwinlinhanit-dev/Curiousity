(function (ML) {
  'use strict';
  if (!ML || !ML.gen) return;
  var SONGS = [{"slug":"amazing-grace","title":"Amazing Grace","key":"G","time":"3/4","tempo":84,"chords":""},{"slug":"canon-in-d","title":"Canon in D","key":"D","time":"4/4","tempo":60,"chords":""},{"slug":"fur-elise","title":"Für Elise (first section)","key":"Am","time":"3/8","tempo":120,"chords":""},{"slug":"greensleeves","title":"Greensleeves","key":"Em","time":"6/8","tempo":52,"chords":""},{"slug":"gymnopedie-no-1","title":"Gymnopédie No. 1","key":"D","time":"3/4","tempo":66,"chords":""},{"slug":"hot-cross-buns","title":"Hot Cross Buns","key":"C","time":"4/4","tempo":92,"chords":""},{"slug":"invention-no-1","title":"Invention No. 1 in C major","key":"C","time":"4/4","tempo":72,"chords":""},{"slug":"jingle-bells","title":"Jingle Bells","key":"C","time":"4/4","tempo":112,"chords":""},{"slug":"lightly-row","title":"Lightly Row","key":"G","time":"4/4","tempo":100,"chords":""},{"slug":"mary-had-a-little-lamb","title":"Mary Had a Little Lamb","key":"C","time":"4/4","tempo":100,"chords":""},{"slug":"melody-schumann","title":"Melody","key":"C","time":"4/4","tempo":88,"chords":""},{"slug":"minuet-in-g","title":"Minuet in G major","key":"G","time":"3/4","tempo":112,"chords":""},{"slug":"moonlight-sonata-first-movement","title":"Moonlight Sonata, first movement","key":"C#m","time":"2/2","tempo":54,"chords":""},{"slug":"musette-in-d","title":"Musette in D major","key":"D","time":"2/4","tempo":104,"chords":""},{"slug":"ode-to-joy","title":"Ode to Joy","key":"C","time":"4/4","tempo":96,"chords":""},{"slug":"prelude-in-c","title":"Prelude in C major","key":"C","time":"4/4","tempo":66,"chords":""},{"slug":"prelude-in-e-minor","title":"Prelude in E minor","key":"Em","time":"2/2","tempo":50,"chords":""},{"slug":"clementi-sonatina-op36-no1","title":"Sonatina in C major, first movement","key":"C","time":"2/2","tempo":72,"chords":""},{"slug":"the-entertainer","title":"The Entertainer (opening)","key":"C","time":"2/4","tempo":76,"chords":""},{"slug":"twinkle-twinkle-little-star","title":"Twinkle, Twinkle, Little Star","key":"C","time":"4/4","tempo":92,"chords":""}];
  var NOTES = {"C":"C E G","G":"G B D","D":"D F# A","A":"A C# E","E":"E G# B","F":"F A C","Bb":"Bb D F","B♭":"Bb D F","Eb":"Eb G Bb","Am":"A C E","Em":"E G B","Dm":"D F A","G7":"G B D F","C7":"C E G Bb","F7":"F A C Eb","B7":"B D# F# A","E7":"E G# B D","Am7":"A C E G","Em7":"E G B D","Fmaj7":"F A C E","Dm7":"D F A C","Gmaj7":"G B D F#"};
  function barsOf(s) {
    var out = [];
    String(s.chords || '').split('|').forEach(function (part) {
      part.trim().split(/\s+/).forEach(function (tok) { if (tok) out.push(tok.replace(/:\d+$/, '')); });
    });
    return out;
  }
  function mc(R, right, pool) {
    var vals = [], seen = {};
    pool.forEach(function (v) { if (v && v !== right && !seen[v]) { seen[v] = 1; vals.push(v); } });
    if (vals.length < 2) return null;
    return { t: 'mc', choices: [right].concat(R.shuffle(vals).slice(0, 3)), v: 0 };
  }
  SONGS.forEach(function (song) {
    function attempt(kind, R, ctx) {
      var others = SONGS.filter(function (s) { return s.slug !== song.slug; });
      if (kind === 'key') {
        var ka = mc(R, song.key, others.map(function (s) { return s.key; }));
        if (!ka) return null;
        return { q: 'What <b>key</b> is <b>' + song.title + '</b> in?', a: ka,
          steps: ['<b>' + song.title + '</b> is in ' + song.key + '.'] };
      }
      if (kind === 'time') {
        return { q: 'What <b>time signature</b> does <b>' + song.title + '</b> use?',
          a: mc(R, song.time, others.map(function (s) { return s.time; })),
          steps: ['<b>' + song.title + '</b> is in ' + song.time + '.'] };
      }
      if (kind === 'tempo') {
        var pool = others.map(function (s) { return String(s.tempo); });
        return { q: 'Suggested <b>tempo</b> for <b>' + song.title + '</b>? (♩ = …)',
          a: mc(R, String(song.tempo), pool),
          steps: ['Try ♩ = ' + song.tempo + ' to start.'] };
      }
      if (kind === 'nextchord') {
        var i = R.int(0, bars.length - 2);
        var here = bars[i], next = bars[i + 1];
        if (!here || !next || here === next) return null;
        return { q: 'In <b>' + song.title + '</b>\'s chords, what follows <b>' + here + '</b>?',
          a: mc(R, next, bars),
          steps: ['The progression there is: ' + bars.slice(Math.max(0, i - 2), i + 3).join(' → ') + '.'] };
      }
      var chord = R.pick(bars.filter(function (c) { return NOTES[c]; }));
      if (!chord) return null;
      var right = NOTES[chord];
      var notePool = Object.keys(NOTES).map(function (k) { return NOTES[k]; });
      var na = mc(R, right, notePool);
      if (!na) return null;
      return { q: 'Which notes spell the <b>' + chord + '</b> chord?', a: na,
        steps: [chord + ' = ' + right + '.'] };
      return null;
    }
    ML.gen('mus.' + song.slug, function (R, ctx) {
      var bars = barsOf(song);
      var kinds = ['key', 'time', 'tempo'];
      if (bars.length >= 4) kinds.push('nextchord', 'chordnotes');
      var order = R.shuffle(kinds);
      for (var i = 0; i < order.length; i++) {
        var p = attempt(order[i], R, ctx);
        if (p) return p;
      }
      // always-answerable fallback: true/false about the key
      var others = SONGS.filter(function (s) { return s.slug !== song.slug && s.key !== song.key; });
      var lie = others.length ? R.pick(others).key : 'D minor';
      var claim = R.pick([song.key, lie]);
      return { q: '<b>True or false?</b> <b>' + song.title + '</b> is in ' + claim + '.',
        a: { t: 'tf', v: claim === song.key },
        steps: ['<b>' + song.title + '</b> is in ' + song.key + '.'] };
    });
  });
})(window.MathLadder);
