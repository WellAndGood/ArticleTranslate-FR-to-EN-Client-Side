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