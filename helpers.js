export function numberToWords(n) {
  if (n === 0) return 'zero';
  if (n > 999999) return n.toLocaleString(); // fallback for > 999,999

  const ones = [
    '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 
    'dix', 'onze', 'douze','treize','quatorze','quinze', 'seize', 'dix-sept', 'dix-huit','dix-neuf'
  ];

  const tens = [
    '', '', 'vingt', 'trente', 'quarante','cinquante','soixante','soixante-dix', 'quatre-vingts','quatre-vingt-dix'
  ];

  const thousand = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
    if (n < 1000) {
      return ones[Math.floor(n / 100)] + ' cent' +
        (n % 100 ? ' ' + thousand(n % 100) : '');
    }
  };

  let result = '';

  if (n >= 1000) {
    result += thousand(Math.floor(n / 1000)) + ' mille';
    if (n % 1000) {
      result += ' ' + thousand(n % 1000);
    }
  } else {
    result = thousand(n);
  }

  return result.trim();
}

export const numberWords = {
    'zéro': 0,
    'un': 1,
    'deux': 2,
    'trois': 3,
    'quatre': 4,
    'cinq': 5,
    'six': 6,
    'sept': 7,
    'huit': 8,
    'neuf': 9,

    'dix': 10,
    'onze': 11,
    'douze': 12,
    'treize': 13,
    'quatorze': 14,
    'quinze': 15,
    'seize': 16,
    'dix-sept': 17,
    'dix-huit': 18,
    'dix-neuf': 19,

    'vingt': 20,
    'trente': 30,
    'quarante': 40,
    'cinquante': 50,
    'soixante': 60,
    'soixante-dix': 70,
    'quatre-vingts': 80,
    'quatre-vingt-dix': 90,

    'cent': 100,
    'mille': 1000,
    'million': 1000000,
    'millard': 1000000000,

    'infinit': Infinity,
    'infinits': Infinity,
    'moitié': 0.5,
    'moitiée': 0.5,
    'moitiés': 0.5,
    'moitiées': 0.5,
    'demi': 0.5,

    'dizaines': 10,
    'douzaines': 12,
    'centaines': 100,
    'milliers': 1000,
    'millions': 1000000,
    'milliards': 1000000000
  };

export function markSpelledOutNumbers(adjacencyList) {

  for (let i = 0; i < adjacencyList.length; i++) {
    const sequence = [];
    let j = i;

    while (j < adjacencyList.length) {
      const word = adjacencyList[j].text.toLowerCase();

      if (numberWords.hasOwnProperty(word) ||isHyphenatedNumber(word)) {
        sequence.push(adjacencyList[j]);
        j++;
      } else {
        break;
      }
    }

    if (sequence.length > 0) {
      sequence.forEach(token => {
        token.element.classList.add('prominent-number');
      });
      i = j - 1; // skip past the sequence we just marked
    }
  }
}

// helper to check hyphenated numbers
export function isHyphenatedNumber(word, numberWords = 2) {
  if (!word.includes('-')) return false;
  const [part1, part2] = word.split('-');
  return numberWords.hasOwnProperty(part1) && numberWords.hasOwnProperty(part2);
}

export async function practiceLemma(lemma) {
  const db = await openAgentsDB();
  const tx = db.transaction("lemmas", "readwrite");
  const store = tx.objectStore("lemmas"); 

  const req = store.get(lemma);

  req.onsuccess = () => {
    const data = req.result;
    if (!data) {
      console.warn(`Lemma ${lemma} not found`);
      return;
    }

    data.reps += 1;

    if (data.srIndex < srMapping.length - 1) {
      data.srIndex += 1;
    }

    data.srDay = srMapping[data.srIndex];

    const now = new Date();
    data.lastUpdated = now.toISOString();
    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + data.srDay);
    data.nextReview = nextReview.toISOString();

    store.put(data);
  };

  tx.oncomplete = () => {
    console.log(`Practiced ${lemma}`);
  };
}

export const MORPH_MAP = {
  Definite: { Def: "definite", Ind: "indefinite", Cons: "construct" },
  PronType: { Art: "article", Prs: "personal pronoun", Dem: "demonstrative",
              Rel: "relative", Int: "interrogative", Ind: "indefinite",
              Neg: "negative", Tot: "quantifier", Rcp: "reciprocal" },
  Gender:   { Masc: "masculine", Fem: "feminine", Com: "common", Neut: "neuter" },
  Number:   { Sing: "singular", Plur: "plural", Dual: "dual" },
  Person:   { "1": "first person", "2": "second person", "3": "third person" },
  Tense:    { Pres: "present", Past: "past", Fut: "future", Imp: "imperfect", Pqp: "pluperfect" },
  Mood:     { Ind: "indicative", Sub: "subjunctive", Cnd: "conditional", Imp: "imperative" },
  VerbForm: { Fin: "finite", Inf: "infinitive", Part: "participle", Ger: "gerund" },
  Aspect:   { Imp: "imperfective", Perf: "perfective", Prog: "progressive",
              Hab: "habitual", Prosp: "prospective" },
  Voice:    { Act: "active", Pass: "passive", Mid: "middle" },
  Degree:   { Pos: "positive", Cmp: "comparative", Sup: "superlative" },
  Polarity: { Neg: "negative", Pos: "affirmative" },
  Poss:     { Yes: "possessive" },
  Reflex:   { Yes: "reflexive" },
  NumType:  { Card: "cardinal", Ord: "ordinal", Frac: "fraction",
              Mult: "multiplicative", Sets: "collective", Dist: "distributive" },
  Case:     { Nom: "nominative", Acc: "accusative", Dat: "dative", Gen: "genitive",
              Abl: "ablative", Loc: "locative", Ins: "instrumental", Voc: "vocative",
              Par: "partitive" }
};

export const ORDER_BY_POS = {
  NOUN: ["Gender","Number","Case"],
  PROPN: ["Gender","Number","Case"],
  ADJ: ["Degree","Gender","Number"],
  PRON: ["PronType","Person","Gender","Number","Case","Poss","Reflex","Polarity"],
  DET: ["Definite","PronType","Gender","Number"],
  VERB: ["VerbForm","Mood","Tense","Aspect","Voice","Person","Number","Polarity"],
  AUX: ["VerbForm","Mood","Tense","Aspect","Voice","Person","Number","Polarity"],
  ADV: ["Degree","Polarity"],
  NUM: ["NumType","Number"],
  default: ["PronType","Definite","VerbForm","Mood","Tense","Aspect","Voice","Person","Number","Gender","Case","Degree","Polarity","Poss","Reflex","NumType"]
};

export function normalizeMorph(morph) {
  if (!morph) return {};
  if (typeof morph === "string") {
    return Object.fromEntries(
      morph.split("|").map(pair => {
        const [k, v] = pair.split("=");
        return [k, v];
      })
    );
  }
  return morph; // already an object
}

export function detectFrenchContraction(text, pos, morph) {
  const t = (text || "").toLowerCase();
  if (pos === "ADP" && morph?.Definite) {
    if (t === "du")  return "de + le";
    if (t === "au")  return "à + le";
    if (t === "aux") return "à + les";
  }
  if (t === "des" && morph?.Number === "Plur") return "de + les (or plural article)";
  return "";
}

const GAP = 10;            // pixels of breathing room to viewport edges
const MAX_WIDTH = 360;    // must match CSS max-width

export function showGlobalTooltip(anchorEl, html) {
  if (!anchorEl || !(anchorEl instanceof Element)) return null;
  
  const tip = document.createElement('div');
  tip.className = 'custom-tooltip';
  tip.style.maxWidth = MAX_WIDTH + 'px';
  tip.innerHTML = html;

  // Keep a reference to the anchor so positionTooltip doesn't need a second arg
  tip._anchor = anchorEl;
  
  tip.style.position = 'fixed';
  tip.style.left = '-9999px';
  tip.style.top = '0';
  tip.style.opacity = '0';

  document.body.appendChild(tip);

  requestAnimationFrame(() => {
    positionTooltip(tip);
    tip.style.opacity = '1';
  });

  const onMove = () => positionTooltip(tip);
  window.addEventListener('scroll', onMove, true);
  window.addEventListener('resize', onMove);

  tip._cleanup = () => {
    window.removeEventListener('scroll', onMove, true);
    window.removeEventListener('resize', onMove);
    tip.remove()
  }
  return tip;
}

export function positionTooltip(tip) {
  if (!tip || !tip._anchor) return;
  const anchor = tip._anchor;
  if (!anchor.isConnected) return; // anchor removed from DOM
  
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // default to the right, vertically centered
  let left = rect.right + GAP;
  let top = rect.top + rect.height / 2 - tip.offsetHeight / 2;

  // constrain vertical within viewport
  top = Math.max(GAP, Math.min(vh - tip.offsetHeight - GAP, top));

  tip.style.left = `${left}px`;
  tip.style.top =`${top}px`;

  // move to the left if overflowing right edge
  const overflowRight = left + tip.offsetWidth + GAP > vw;
  if (overflowRight) {
    left = Math.max(GAP, rect.left - GAP - tip.offsetWidth);
    tip.style.left = left + 'px';
  }

  // if still off-screen vertically, try below or above
  if (top + tip.offsetHeight + GAP > vh) {
    top = Math.max(GAP, rect.top - GAP - tip.offsetHeight); // above
    tip.style.top = top + 'px';
  } else if (top < GAP) {
    top = Math.min(vh - tip.offsetHeight - GAP, rect.bottom + GAP); // bottom
    tip.style.top = top + 'px';
  }
}

function parseMorph(morph) {
  if (!morph) return {};
  if (typeof morph === 'string') {
    // "PronType=Dem|Number=Sing" -> { PronType:"Dem", Number:"Sing" }
    return Object.fromEntries(
      morph.split('|').map(s => {
        const [k, v] = s.split('=');
        return [k, v];
      })
    );
  }
  return morph; // already an object
}

export function spacyPosToKey(pos, { text = "", lemma = "", morph = "" } = {}) {
  const P = String(pos || "").toUpperCase();
  const t = String(text || "").toLowerCase();
  const l = String(lemma || "").toLowerCase();
  const m = parseMorph(morph);

  switch (P) {
    case "NOUN":
    case "PROPN":
      return "n";
    case "VERB":
    case "AUX":
      return "v";
    case "ADJ":
      return "j";
    case "ADV":
      if (NEG_WORDS.has(l) || NEG_WORDS.has(t)) return "x"; // e.g., "not"
      return "r";
    case "ADP":
      return "i"; // preposition
    case "DET":
      // demonstratives → 'd', otherwise article/determiner → 'a'
      if (m.PronType === "Dem") return "d";
      return "a";
    case "PRON":
      return "p";
    case "CCONJ":
    case "SCONJ":
      return "c";
    case "PART":
      if (t === "to" || l === "to") return "t"; // English infinitive marker
      if (NEG_WORDS.has(l) || NEG_WORDS.has(t)) return "x"; // e.g., "n't"
      return "x"; // other particles → bucket in x
    case "NUM":
      return "m";
    case "INTJ":
      return "u";
    case "SYM":
    case "X":
      return "x";
    case "PUNCT":
    case "SPACE":
      return null; // skip
    default:
      return "x"; // unknown → other
  }
}