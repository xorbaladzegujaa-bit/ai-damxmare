export interface MathQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  visual?: {
    type: 'count' | 'add' | 'sub' | 'mult' | 'div' | 'fraction' | 'number_line' | 'compare' | 'none';
    a?: number;
    b?: number;
    symbol?: string;
  };
}

export interface MathLessonDef {
  id: string;
  levelId: number;
  order: number;
  title: string;
  subtitle: string;
  explanation: string;
  steps: string[];
  visualDemo: {
    type:
      | 'counting'
      | 'number_line'
      | 'addition'
      | 'subtraction'
      | 'multiplication'
      | 'division'
      | 'fraction'
      | 'coordinate'
      | 'geometry';
    caption: string;
    a: number;
    b: number;
  };
  generateQuestions: (count?: number) => MathQuestion[];
}

export interface MathLevelDef {
  id: number;
  title: string;
  description: string;
  accent: string;
  lessons: MathLessonDef[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeNumericOptions(correct: number, minVal = 0, step = 1): string[] {
  const set = new Set<number>([correct]);
  const offsets = [-3, -2, -1, 1, 2, 3, 4, 5, 10, -10];
  for (const off of shuffle(offsets)) {
    if (set.size >= 4) break;
    const cand = Math.round((correct + off * step) * 100) / 100;
    if (cand >= minVal && cand !== correct) {
      set.add(cand);
    }
  }
  let extra = 1;
  while (set.size < 4) {
    set.add(Math.max(minVal, correct + extra * step));
    extra++;
  }
  return shuffle(Array.from(set).map(String));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const MATH_LEVELS: MathLevelDef[] = [
  {
    id: 1,
    title: 'დონე 1: საბაზისო რიცხვები',
    description: 'ციფრების ამოცნობა, საგნების თვლა, თანმიმდევრობა, შედარება და რიცხვითი ღერძი.',
    accent: 'cyan',
    lessons: [
      {
        id: 'm1_recognize',
        levelId: 1,
        order: 1,
        title: 'ციფრების ამოცნობა (0–10)',
        subtitle: 'რიცხვების სახელები და რაოდენობა',
        explanation:
          'მათემატიკა იწყება ციფრებით 0-დან 9-მდე. ნული (0) ნიშნავს, რომ საგანი საერთოდ არ არის. 1, 2, 3... გვიჩვენებს რაოდენობას.',
        steps: [
          'დააკვირდი ციფრს: 0 — ცარიელია, 1 — ერთი ცალია, 5 — ხუთი ცალია.',
          'დაითვალე წერტილები ეკრანზე მარცხნიდან მარჯვნივ.',
          'შეუსაბამე რაოდენობა სწორ ციფრს.',
        ],
        visualDemo: { type: 'counting', caption: 'დააკვირდი: 4 ბურთი შეესაბამება ციფრ 4-ს', a: 4, b: 0 },
        generateQuestions: (count = 5) => {
          const names: Record<number, string> = {
            0: 'ნული',
            1: 'ერთი',
            2: 'ორი',
            3: 'სამი',
            4: 'ოთხი',
            5: 'ხუთი',
            6: 'ექვსი',
            7: 'შვიდი',
            8: 'რვა',
            9: 'ცხრა',
            10: 'ათი',
          };
          const qs: MathQuestion[] = [];
          for (let i = 0; i < count; i++) {
            const n = randInt(1, 10);
            qs.push({
              id: `m1_r_${i}`,
              prompt: `რომელი ციფრი შეესაბამება სიტყვას „${names[n]}“?`,
              options: makeNumericOptions(n, 0),
              correctAnswer: String(n),
              explanation: `სიტყვა „${names[n]}“ იწერება როგორც ${n}.`,
              visual: { type: 'count', a: n },
            });
          }
          return qs;
        },
      },
      {
        id: 'm1_counting',
        levelId: 1,
        order: 2,
        title: 'საგნების თვლა',
        subtitle: 'დათვალე საგნები ზუსტად',
        explanation:
          'საგნების დათვლისას თითოეულ საგანს მხოლოდ ერთხელ ვეხებით: ერთი, ორი, სამი... ბოლოს წარმოთქმული რიცხვი არის საერთო რაოდენობა.',
        steps: [
          'დაიწყე თვლა პირველი ფიგურიდან.',
          'არ გამოტოვო არცერთი და არ დათვალო ერთი საგანი ორჯერ.',
          'ბოლო რიცხვი არის სწორი პასუხი.',
        ],
        visualDemo: { type: 'counting', caption: 'დათვალე თითოეული ვარსკვლავი სათითაოდ: 1, 2, 3, 4, 5, 6', a: 6, b: 0 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const n = randInt(2, 9);
            return {
              id: `m1_c_${i}`,
              prompt: 'რამდენი ფიგურაა გამოსახული?',
              options: makeNumericOptions(n, 1),
              correctAnswer: String(n),
              explanation: `თუ სათითაოდ დაითვლი 1-დან ${n}-მდე, სულ გამოვა ${n} ფიგურა.`,
              visual: { type: 'count', a: n },
            };
          }),
      },
      {
        id: 'm1_order',
        levelId: 1,
        order: 3,
        title: 'რიცხვების თანმიმდევრობა',
        subtitle: 'წინა და მომდევნო რიცხვები',
        explanation:
          'რიცხვები დალაგებულია ზრდის მიხედვით: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10... ყოველი მომდევნო რიცხვი წინაზე 1-ით მეტია.',
        steps: [
          'იპოვე მოცემული რიცხვი რიგში.',
          'მომდევნო რიცხვი +1 ნაბიჯით მარჯვნივაა.',
          'წინა რიცხვი -1 ნაბიჯით მარცხნივაა.',
        ],
        visualDemo: { type: 'number_line', caption: 'რიცხვები 0-დან 10-მდე მარცხნიდან მარჯვნივ იზრდება', a: 5, b: 6 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const start = randInt(1, 15);
            const missingPos = i % 2 === 0 ? 'next' : 'middle';
            if (missingPos === 'next') {
              const ans = start + 3;
              return {
                id: `m1_o_${i}`,
                prompt: `რომელი რიცხვი უნდა ეწეროს კითხვის ნიშნის ადგილას? ${start}, ${start + 1}, ${start + 2}, ?`,
                options: makeNumericOptions(ans, 0),
                correctAnswer: String(ans),
                explanation: `რიცხვები იზრდება 1-ით, ამიტომ ${start + 2}-ის შემდეგ მოდის ${ans}.`,
              };
            }
            const ans = start + 1;
            return {
              id: `m1_o_${i}`,
              prompt: `რომელი რიცხვია გამოტოვებული? ${start}, ?, ${start + 2}, ${start + 3}`,
              options: makeNumericOptions(ans, 0),
              correctAnswer: String(ans),
              explanation: `${start}-სა და ${start + 2}-ს შორის დგას ${ans}.`,
            };
          }),
      },
      {
        id: 'm1_compare',
        levelId: 1,
        order: 4,
        title: 'მეტი, ნაკლები და ტოლი',
        subtitle: 'ნიშნები >, < და =',
        explanation:
          'ნიშანი > ნიშნავს „მეტია“, < ნიშნავს „ნაკლებია“, ხოლო = ნიშნავს „ტოლია“. ნიშნის ღია პირი ყოველთვის დიდი რიცხვისკენ იყურება!',
        steps: [
          'შეადარე ორი რიცხვი: მაგალითად 7 და 4.',
          '7 უფრო დიდია, ამიტომ ღია მხარე 7-ისკენაა: 7 > 4.',
          'თუ ორივე რიცხვი ერთნაირია (5 და 5), ვიყენებთ = ნიშანს.',
        ],
        visualDemo: { type: 'counting', caption: '7 > 4: ნიშნის ფართო მხარე დიდ რიცხვს უყურებს', a: 7, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(1, 20);
            const b = i === 2 ? a : randInt(1, 20);
            const ans = a > b ? '>' : a < b ? '<' : '=';
            const word = ans === '>' ? 'მეტია' : ans === '<' ? 'ნაკლებია' : 'ტოლია';
            return {
              id: `m1_cmp_${i}`,
              prompt: `რომელი ნიშანია სწორი? ${a}  ?  ${b}`,
              options: ['>', '<', '='],
              correctAnswer: ans,
              explanation: `${a} ${word} ${b}-ზე, ამიტომ სწორია ${a} ${ans} ${b}.`,
              visual: { type: 'compare', a, b, symbol: ans },
            };
          }),
      },
      {
        id: 'm1_numberline',
        levelId: 1,
        order: 5,
        title: 'რიცხვითი ღერძი',
        subtitle: 'ნაბიჯები მარჯვნივ და მარცხნივ',
        explanation:
          'რიცხვითი ღერძი არის სწორი ხაზი, სადაც რიცხვები თანაბარი დაშორებითაა განლაგებული. მარჯვნივ გადაადგილება ზრდის რიცხვს, მარცხნივ — ამცირებს.',
        steps: [
          'იპოვე საწყისი წერტილი ღერძზე.',
          'თუ მიდიხარ მარჯვნივ 2 ნაბიჯით — დაამატე 2.',
          'თუ მიდიხარ მარცხნივ 2 ნაბიჯით — გამოაკელი 2.',
        ],
        visualDemo: { type: 'number_line', caption: '3-დან 2 ნაბიჯით მარჯვნივ მივყავართ 5-მდე', a: 3, b: 5 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const start = randInt(2, 8);
            const step = randInt(1, 4);
            const right = i % 2 === 0;
            const ans = right ? start + step : Math.max(0, start - step);
            const actualStep = right ? step : start - ans;
            return {
              id: `m1_nl_${i}`,
              prompt: `რიცხვით ღერძზე დგახარ ${start}-ზე და გადადგამ ${actualStep} ნაბიჯს ${
                right ? 'მარჯვნივ' : 'მარცხნივ'
              }. რომელ რიცხვზე მოხვდები?`,
              options: makeNumericOptions(ans, 0),
              correctAnswer: String(ans),
              explanation: `${start}-დან ${actualStep} ნაბიჯი ${
                right ? 'მარჯვნივ ნიშნავს მიმატებას' : 'მარცხნივ ნიშნავს გამოკლებას'
              }: ${start} ${right ? '+' : '-'} ${actualStep} = ${ans}.`,
              visual: { type: 'number_line', a: start, b: ans },
            };
          }),
      },
    ],
  },
  {
    id: 2,
    title: 'დონე 2: მიმატება',
    description: 'მიმატება საგნებით, ვიზუალურად, 10-ის, 20-ის და 100-ის ფარგლებში.',
    accent: 'blue',
    lessons: [
      {
        id: 'm2_objects',
        levelId: 2,
        order: 1,
        title: 'მიმატება საგნებით',
        subtitle: 'ორი ჯგუფის გაერთიანება',
        explanation:
          'მიმატება (+) ნიშნავს ორი ჯგუფის გაერთიანებას და ერთად დათვლას. თუ გაქვს 2 ვაშლი და დაამატებ 3 ვაშლს, ერთად გექნება 5 ვაშლი.',
        steps: [
          'დათვალე პირველი ჯგუფის საგნები.',
          'გააგრძელე თვლა მეორე ჯგუფის საგნებზე.',
          'მიღებული საერთო რაოდენობა არის ჯამი.',
        ],
        visualDemo: { type: 'addition', caption: '3 + 2 = 5 (სამს მივუმატოთ ორი არის ხუთი)', a: 3, b: 2 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(1, 5);
            const b = randInt(1, 4);
            const ans = a + b;
            return {
              id: `m2_obj_${i}`,
              prompt: `რამდენი იქნება სულ: ${a} + ${b}?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `თუ ${a} საგანს შევუერთებთ ${b} საგანს, სულ გამოვა ${ans}.`,
              visual: { type: 'add', a, b },
            };
          }),
      },
      {
        id: 'm2_visual',
        levelId: 2,
        order: 2,
        title: 'ვიზუალური მიმატება',
        subtitle: 'გადათვლა დიდი რიცხვიდან',
        explanation:
          'უფრო სწრაფად რომ დათვალო, დაიწყე დიდი რიცხვიდან და მიათვალე პატარა: მაგალითად 2 + 6 იგივეა რაც 6 + 2 = 8.',
        steps: [
          'ამოირჩიე ორი რიცხვიდან უფრო დიდი.',
          'გონებაში დააფიქსირე ეს რიცხვი.',
          'თითებით ან ნაბიჯებით მიათვალე მეორე რიცხვი.',
        ],
        visualDemo: { type: 'addition', caption: '5 + 4 = 9: ვიწყებთ 5-დან და ვამატებთ 4-ს', a: 5, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(2, 6);
            const b = randInt(2, 5);
            const ans = a + b;
            return {
              id: `m2_vis_${i}`,
              prompt: `გამოთვალე ვიზუალური ჯგუფებით: ${a} + ${b} = ?`,
              options: makeNumericOptions(ans, 2),
              correctAnswer: String(ans),
              explanation: `${Math.max(a, b)}-დან გადათვლით ${Math.min(a, b)} ნაბიჯი გვაძლევს ${ans}-ს.`,
              visual: { type: 'add', a, b },
            };
          }),
      },
      {
        id: 'm2_within10',
        levelId: 2,
        order: 3,
        title: 'მიმატება 10-ის ფარგლებში',
        subtitle: 'ათეულის შევსება',
        explanation:
          'ძალიან მნიშვნელოვანია იცოდე წყვილები, რომლებიც 10-ს გვაძლევს: 1+9, 2+8, 3+7, 4+6, 5+5.',
        steps: [
          'შეამოწმე რამდენი აკლია პირველ რიცხვს 10-მდე.',
          'გამოიყენე 10-ის წყვილების ცოდნა.',
        ],
        visualDemo: { type: 'addition', caption: '6 + 4 = 10 — ათეულის შევსება', a: 6, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(1, 9);
            const b = randInt(1, 10 - a);
            const ans = a + b;
            return {
              id: `m2_10_${i}`,
              prompt: `გამოთვალე: ${a} + ${b} = ?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `${a}-ს მივუმატოთ ${b} უდრის ${ans}-ს.`,
              visual: { type: 'add', a, b },
            };
          }),
      },
      {
        id: 'm2_within20',
        levelId: 2,
        order: 4,
        title: 'მიმატება 20-ის ფარგლებში',
        subtitle: 'ათეულის გავლით მიმატება',
        explanation:
          'როცა ჯამი 10-ზე მეტია (მაგ: 8 + 5), ჯერ შეავსე 10-მდე (8 + 2 = 10), შემდეგ დაამატე დარჩენილი 3 (10 + 3 = 13).',
        steps: [
          '8 + 5: რამდენი აკლია 8-ს 10-მდე? 2.',
          'დაშალე 5 როგორც 2 + 3.',
          '8 + 2 = 10, შემდეგ 10 + 3 = 13.',
        ],
        visualDemo: { type: 'number_line', caption: '8 + 5: ჯერ 10-მდე (+2), შემდეგ 13-მდე (+3)', a: 8, b: 13 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(6, 9);
            const b = randInt(11 - a, 9);
            const ans = a + b;
            const toTen = 10 - a;
            return {
              id: `m2_20_${i}`,
              prompt: `გამოთვალე 20-ის ფარგლებში: ${a} + ${b} = ?`,
              options: makeNumericOptions(ans, 10),
              correctAnswer: String(ans),
              explanation: `შეავსე 10-მდე: ${a} + ${toTen} = 10, დარჩენილი ${b - toTen} დაამატე 10-ს: 10 + ${
                b - toTen
              } = ${ans}.`,
            };
          }),
      },
      {
        id: 'm2_within100',
        levelId: 2,
        order: 5,
        title: 'მიმატება 100-ის ფარგლებში',
        subtitle: 'ათეულები და ერთეულები',
        explanation:
          'ორნიშნა რიცხვების მიმატებისას ცალკე შეკრიბე ათეულები და ცალკე ერთეულები: 23 + 14 = (20+10) + (3+4) = 30 + 7 = 37.',
        steps: [
          'დაყავი რიცხვები ათეულებად და ერთეულებად.',
          'მიუმატე ათეულები ერთმანეთს.',
          'მიუმატე ერთეულები და გააერთიანე.',
        ],
        visualDemo: { type: 'addition', caption: '20 + 10 = 30, 3 + 4 = 7 → 37', a: 23, b: 14 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(12, 65);
            const b = randInt(11, 32);
            const ans = a + b;
            return {
              id: `m2_100_${i}`,
              prompt: `გამოთვალე: ${a} + ${b} = ?`,
              options: makeNumericOptions(ans, 20),
              correctAnswer: String(ans),
              explanation: `${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${
                (Math.floor(a / 10) + Math.floor(b / 10)) * 10
              }, ერთეულები ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. ჯამი = ${ans}.`,
            };
          }),
      },
      {
        id: 'm2_mental',
        levelId: 2,
        order: 6,
        title: 'ზეპირი ანგარიში',
        subtitle: 'სწრაფი დამრგვალებით მიმატება',
        explanation:
          '9-ის ან 19-ის მიმატება მარტივია: დაამატე 10 (ან 20) და გამოაკელი 1! მაგ: 25 + 9 = 25 + 10 - 1 = 34.',
        steps: [
          'დაამრგვალე ახლო ათეულამდე (მაგ. 9 → 10).',
          'შეკრიბე სწრაფად გონებაში.',
          'გამოაკელი ზედმეტი 1.',
        ],
        visualDemo: { type: 'number_line', caption: '25 + 9 = 25 + 10 - 1 = 34', a: 25, b: 34 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(15, 75);
            const b = [9, 19, 8, 11][i % 4];
            const ans = a + b;
            return {
              id: `m2_ment_${i}`,
              prompt: `გამოთვალე ზეპირად: ${a} + ${b} = ?`,
              options: makeNumericOptions(ans, 15),
              correctAnswer: String(ans),
              explanation: `${a} + ${b} = ${ans}. (შეგიძლია დაამატო ${b % 10 === 9 ? b + 1 : b} და შეასწორო)`,
            };
          }),
      },
    ],
  },
  {
    id: 3,
    title: 'დონე 3: გამოკლება',
    description: 'გამოკლება საგნებით, 10-მდე, 20-მდე, 100-მდე, ათეულის სესხება და ზეპირი ანგარიში.',
    accent: 'purple',
    lessons: [
      {
        id: 'm3_objects',
        levelId: 3,
        order: 1,
        title: 'გამოკლება საგნებით',
        subtitle: 'რაოდენობის შემცირება',
        explanation:
          'გამოკლება (-) ნიშნავს ჯგუფიდან ნაწილის აღებას ან მოცილებას. თუ გვაქვს 5 ბურთი და 2-ს ავიღებთ, დარჩება 3.',
        steps: [
          'დათვალე რამდენი საგანია თავიდან.',
          'გადახაზე ან მოაშორე გამოსაკლები რაოდენობა.',
          'დათვალე დარჩენილი საგნები.',
        ],
        visualDemo: { type: 'subtraction', caption: '6 - 2 = 4 (6-დან 2 მოვაშორეთ, დარჩა 4)', a: 6, b: 2 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(4, 9);
            const b = randInt(1, a - 1);
            const ans = a - b;
            return {
              id: `m3_obj_${i}`,
              prompt: `გამოთვალე რამდენი დარჩება: ${a} - ${b} = ?`,
              options: makeNumericOptions(ans, 0),
              correctAnswer: String(ans),
              explanation: `${a} საგნიდან თუ ${b}-ს მოვაშორებთ, დარჩება ${ans}.`,
              visual: { type: 'sub', a, b },
            };
          }),
      },
      {
        id: 'm3_within10',
        levelId: 3,
        order: 2,
        title: 'გამოკლება 10-ის ფარგლებში',
        subtitle: 'უკუთვლა და სხვაობა',
        explanation:
          'გამოკლებისას შეგიძლია უკუღმა დათვალო ან იკითხო: „რა უნდა დავუმატო პატარა რიცხვს, რომ დიდი მივიღო?“',
        steps: [
          '9 - 4: 4-ს რამდენი აკლია 9-მდე? 5.',
          'შეამოწმე მიმატებით: 5 + 4 = 9!',
        ],
        visualDemo: { type: 'subtraction', caption: '9 - 4 = 5 (შემოწმება: 5 + 4 = 9)', a: 9, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(5, 10);
            const b = randInt(1, a);
            const ans = a - b;
            return {
              id: `m3_10_${i}`,
              prompt: `გამოთვალე: ${a} - ${b} = ?`,
              options: makeNumericOptions(ans, 0),
              correctAnswer: String(ans),
              explanation: `${a}-ს გამოვაკლოთ ${b} არის ${ans}, რადგან ${ans} + ${b} = ${a}.`,
              visual: { type: 'sub', a, b },
            };
          }),
      },
      {
        id: 'm3_within20',
        levelId: 3,
        order: 3,
        title: 'გამოკლება 20-ის ფარგლებში',
        subtitle: 'ათეულის გავლით გამოკლება',
        explanation:
          'მაგალითად 14 - 6: ჯერ გამოაკელი 4, რომ ჩამოხვიდე 10-მდე (14 - 4 = 10), შემდეგ გამოაკელი დარჩენილი 2 (10 - 2 = 8).',
        steps: [
          'ჩამოდი 10-მდე ერთეულების გამოკლებით.',
          'გამოაკელი დარჩენილი ნაწილი 10-დან.',
        ],
        visualDemo: { type: 'number_line', caption: '14 - 6: ჯერ 10-მდე (-4), შემდეგ 8-მდე (-2)', a: 8, b: 14 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(11, 18);
            const b = randInt(a - 9, 9);
            const ans = a - b;
            const units = a - 10;
            return {
              id: `m3_20_${i}`,
              prompt: `გამოთვალე: ${a} - ${b} = ?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `ჯერ ჩამოდი 10-მდე: ${a} - ${units} = 10, შემდეგ გამოაკელი დარჩენილი ${b - units}: 10 - ${
                b - units
              } = ${ans}.`,
            };
          }),
      },
      {
        id: 'm3_within100',
        levelId: 3,
        order: 4,
        title: 'გამოკლება 100-ის ფარგლებში',
        subtitle: 'ათეულების და ერთეულების გამოკლება',
        explanation:
          'ორნიშნა რიცხვების გამოკლებისას ჯერ გამოაკელი ათეულები, შემდეგ ერთეულები: 58 - 23 → 58 - 20 = 38 → 38 - 3 = 35.',
        steps: [
          'გამოაკელი მხოლოდ ათეულები.',
          'მიღებული რიცხვიდან გამოაკელი ერთეულები.',
        ],
        visualDemo: { type: 'subtraction', caption: '58 - 23 = 35', a: 58, b: 23 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const bTens = randInt(1, 3);
            const bOnes = randInt(1, 4);
            const aTens = bTens + randInt(1, 5);
            const aOnes = bOnes + randInt(0, 5);
            const a = aTens * 10 + aOnes;
            const b = bTens * 10 + bOnes;
            const ans = a - b;
            return {
              id: `m3_100_${i}`,
              prompt: `გამოთვალე: ${a} - ${b} = ?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `${a} - ${bTens * 10} = ${a - bTens * 10}, შემდეგ ${a - bTens * 10} - ${bOnes} = ${ans}.`,
            };
          }),
      },
      {
        id: 'm3_borrow',
        levelId: 3,
        order: 5,
        title: 'ათეულის დაშლა (სესხება)',
        subtitle: 'როცა ერთეული არ ჰყოფნის',
        explanation:
          'მაგალითად 42 - 17: 2-დან 7 არ იკლება, ამიტომ 40-დან „ვსესხულობთ“ 1 ათეულს (10). 2 ხდება 12! 12 - 7 = 5, ხოლო დარჩენილი 30 - 10 = 20. პასუხი: 25.',
        steps: [
          'შეამოწმე ერთეულები: თუ ზედა ნაკლებია, ისესხე 1 ათეული.',
          'დაამატე 10 ერთეულს და გამოაკელი.',
          'გამოაკელი დარჩენილი ათეულები.',
        ],
        visualDemo: { type: 'subtraction', caption: '42 - 17 = 25 (12 - 7 = 5, 30 - 10 = 20)', a: 42, b: 17 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const aTens = randInt(3, 8);
            const aOnes = randInt(1, 5);
            const bTens = randInt(1, aTens - 1);
            const bOnes = randInt(aOnes + 1, 9);
            const a = aTens * 10 + aOnes;
            const b = bTens * 10 + bOnes;
            const ans = a - b;
            return {
              id: `m3_bor_${i}`,
              prompt: `გამოთვალე ათეულის დაშლით: ${a} - ${b} = ?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `ისესხე 1 ათეული: ${10 + aOnes} - ${bOnes} = ${10 + aOnes - bOnes}; ათეულებში ${(aTens - 1) * 10} - ${bTens * 10} = ${
                (aTens - 1 - bTens) * 10
              }. სულ ${ans}.`,
            };
          }),
      },
      {
        id: 'm3_mental',
        levelId: 3,
        order: 6,
        title: 'ზეპირი გამოკლება',
        subtitle: 'დამრგვალებით გამოკლება',
        explanation:
          '9-ის გამოკლება მარტივია: გამოაკელი 10 და დაამატე 1! მაგ: 43 - 9 = 43 - 10 + 1 = 34.',
        steps: [
          'გამოაკელი უახლოესი მრგვალი ათეული.',
          'დაუმატე უკან ის, რაც ზედმეტი გამოაკელი.',
        ],
        visualDemo: { type: 'number_line', caption: '43 - 9 = 33 + 1 = 34', a: 34, b: 43 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(25, 85);
            const b = [9, 19, 8, 18][i % 4];
            const ans = a - b;
            return {
              id: `m3_ment_${i}`,
              prompt: `გამოთვალე ზეპირად: ${a} - ${b} = ?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `${a} - ${b} = ${ans}.`,
            };
          }),
      },
    ],
  },
  {
    id: 4,
    title: 'დონე 4: გამრავლება',
    description: 'გამრავლების არსი, გამრავლების ტაბულა, ვიზუალური მატრიცები და სავარჯიშოები.',
    accent: 'emerald',
    lessons: [
      {
        id: 'm4_meaning',
        levelId: 4,
        order: 1,
        title: 'გამრავლების არსი',
        subtitle: 'ერთნაირი ჯგუფების შეკრება',
        explanation:
          'გამრავლება (×) არის ერთი და იმავე რიცხვის სწრაფი მიმატება. 3 × 4 ნიშნავს 4-ის შეკრებას 3-ჯერ: 4 + 4 + 4 = 12.',
        steps: [
          'პირველი რიცხვი გვიჩვენებს რამდენი ჯგუფია.',
          'მეორე რიცხვი გვიჩვენებს რამდენია თითო ჯგუფში.',
          'შეკრიბე ჯგუფები ან გამოიყენე ტაბულა.',
        ],
        visualDemo: { type: 'multiplication', caption: '3 × 4 = 12 (3 რიგი, თითოში 4 წერტილი)', a: 3, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(2, 5);
            const b = randInt(2, 5);
            const ans = a * b;
            return {
              id: `m4_m_${i}`,
              prompt: `რას უდრის ${a} × ${b}? (${b} აღებული ${a}-ჯერ)`,
              options: makeNumericOptions(ans, 2),
              correctAnswer: String(ans),
              explanation: `${a} × ${b} ნიშნავს ${Array(a).fill(b).join(' + ')} = ${ans}.`,
              visual: { type: 'mult', a, b },
            };
          }),
      },
      {
        id: 'm4_table_2_5',
        levelId: 4,
        order: 2,
        title: 'გამრავლების ტაბულა (2–5)',
        subtitle: 'საბაზისო ტაბულის დამახსოვრება',
        explanation:
          '2-ზე გამრავლება არის რიცხვის გაორმაგება. 5-ზე გამრავლების შედეგი ყოველთვის მთავრდება 0-ით ან 5-ით!',
        steps: [
          'გაიხსენე: 2 × 6 = 6 + 6 = 12.',
          'გახსოვდეს თანამამრავლთა გადანაცვლება: 3 × 5 = 5 × 3 = 15.',
        ],
        visualDemo: { type: 'multiplication', caption: '4 × 5 = 20', a: 4, b: 5 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(2, 5);
            const b = randInt(2, 9);
            const ans = a * b;
            return {
              id: `m4_t1_${i}`,
              prompt: `გამოთვალე: ${a} × ${b} = ?`,
              options: makeNumericOptions(ans, 4),
              correctAnswer: String(ans),
              explanation: `${a} × ${b} = ${ans}.`,
              visual: { type: 'mult', a, b },
            };
          }),
      },
      {
        id: 'm4_table_6_10',
        levelId: 4,
        order: 3,
        title: 'გამრავლების ტაბულა (6–10)',
        subtitle: 'სრული ტაბულის ფლობა',
        explanation:
          '10-ზე გამრავლებისას რიცხვს ბოლოში უბრალოდ ემატება 0 (7 × 10 = 70). 9-ზე გამრავლებისას კი შეგიძლია 10-ზე გაამრავლო და თავად ეს რიცხვი გამოაკლო!',
        steps: [
          '6 × 7 = 42, 7 × 8 = 56, 8 × 8 = 64.',
          '9 × 7 = 10 × 7 - 7 = 70 - 7 = 63.',
        ],
        visualDemo: { type: 'multiplication', caption: '6 × 7 = 42', a: 6, b: 7 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(6, 9);
            const b = randInt(4, 9);
            const ans = a * b;
            return {
              id: `m4_t2_${i}`,
              prompt: `გამოთვალე: ${a} × ${b} = ?`,
              options: makeNumericOptions(ans, 12),
              correctAnswer: String(ans),
              explanation: `${a} × ${b} = ${ans}.`,
            };
          }),
      },
      {
        id: 'm4_practice',
        levelId: 4,
        order: 4,
        title: 'პრაქტიკული გამრავლება',
        subtitle: 'ამოცანები გამრავლებაზე',
        explanation:
          'ყოველდღიურ ცხოვრებაში გამრავლება გვეხმარება ფასის, დროის და რაოდენობის სწრაფ დათვლაში.',
        steps: [
          'წაიკითხე ამოცანა ყურადღებით.',
          'იპოვე რამდენი ჯგუფია და რამდენია თითოში.',
          'გაამრავლე ეს ორი რიცხვი.',
        ],
        visualDemo: { type: 'multiplication', caption: '5 ყუთი × 6 კალამი = 30 კალამი', a: 5, b: 6 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(3, 9);
            const b = randInt(3, 8);
            const ans = a * b;
            return {
              id: `m4_pr_${i}`,
              prompt: `ერთ ყუთში დევს ${b} ფანქარი. რამდენი ფანქარია ${a} ასეთ ყუთში?`,
              options: makeNumericOptions(ans, 6),
              correctAnswer: String(ans),
              explanation: `${a} ყუთში თითოში ${b} ფანქარი ნიშნავს ${a} × ${b} = ${ans} ფანქარს.`,
            };
          }),
      },
    ],
  },
  {
    id: 5,
    title: 'დონე 5: გაყოფა',
    description: 'თანაბრად განაწილება, გაყოფის ტაბულა და ნაშთიანი გაყოფა.',
    accent: 'cyan',
    lessons: [
      {
        id: 'm5_objects',
        levelId: 5,
        order: 1,
        title: 'გაყოფა საგნებით',
        subtitle: 'თანაბრად განაწილება',
        explanation:
          'გაყოფა (÷) ნიშნავს რაოდენობის თანაბრად განაწილებას. თუ 12 კანფეტს თანაბრად გაუნაწილებ 3 მეგობარს, თითოეულს შეხვდება 4.',
        steps: [
          'აიღე საერთო რაოდენობა.',
          'გაანაწილე თითო-თითოდ თანაბარ ჯგუფებში.',
          'დათვალე რამდენი მოხვდა ერთ ჯგუფში.',
        ],
        visualDemo: { type: 'division', caption: '12 ÷ 3 = 4 (3 თანაბარი ჯგუფი, თითოში 4)', a: 12, b: 3 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const b = randInt(2, 5);
            const ans = randInt(2, 6);
            const a = b * ans;
            return {
              id: `m5_obj_${i}`,
              prompt: `თუ ${a} ვაშლს თანაბრად გავყოფთ ${b} კალათაში, რამდენი იქნება თითოში? (${a} ÷ ${b})`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `${a} ÷ ${b} = ${ans}, რადგან ${ans} × ${b} = ${a}.`,
              visual: { type: 'div', a, b },
            };
          }),
      },
      {
        id: 'm5_groups',
        levelId: 5,
        order: 2,
        title: 'თანაბარი ჯგუფები',
        subtitle: 'კავშირი გამრავლებასთან',
        explanation:
          'გაყოფა გამრავლების შებრუნებული მოქმედებაა. თუ იცი, რომ 4 × 6 = 24, მაშინ 24 ÷ 4 = 6 და 24 ÷ 6 = 4.',
        steps: [
          'დაუსვი თავს კითხვა: „რა გავამრავლო გამყოფზე, რომ მივიღო გასაყოფი?“',
        ],
        visualDemo: { type: 'division', caption: '18 ÷ 6 = 3 (რადგან 3 × 6 = 18)', a: 18, b: 6 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const b = randInt(2, 8);
            const ans = randInt(2, 8);
            const a = b * ans;
            return {
              id: `m5_grp_${i}`,
              prompt: `გამოთვალე: ${a} ÷ ${b} = ?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `${b} × ${ans} = ${a}, ამიტომ ${a} ÷ ${b} = ${ans}.`,
              visual: { type: 'div', a, b },
            };
          }),
      },
      {
        id: 'm5_table',
        levelId: 5,
        order: 3,
        title: 'გაყოფის ტაბულა',
        subtitle: 'სწრაფი გაყოფა 100-ის ფარგლებში',
        explanation:
          'ივარჯიშე ზუსტ გაყოფაზე 2-დან 9-მდე რიცხვებით. ნებისმიერი რიცხვი 1-ზე გაყოფით უცვლელი რჩება, საკუთარ თავზე გაყოფით კი უდრის 1-ს.',
        steps: ['7 ÷ 1 = 7', '7 ÷ 7 = 1', '0 ÷ 7 = 0 (0-ზე გაყოფა არ შეიძლება!)'],
        visualDemo: { type: 'division', caption: '36 ÷ 6 = 6', a: 36, b: 6 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const b = randInt(3, 9);
            const ans = randInt(3, 10);
            const a = b * ans;
            return {
              id: `m5_tab_${i}`,
              prompt: `გამოთვალე: ${a} ÷ ${b} = ?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `${a} ÷ ${b} = ${ans}, რადგან ${b} × ${ans} = ${a}.`,
            };
          }),
      },
      {
        id: 'm5_remainder',
        levelId: 5,
        order: 4,
        title: 'ნაშთიანი გაყოფა',
        subtitle: 'როცა ბოლომდე არ იყოფა',
        explanation:
          'ზოგჯერ რაოდენობა ზუსტად არ ნაწილდება: მაგალითად 11 ÷ 3 = 3 და ნაშთი 2 (რადგან 3 × 3 = 9, ხოლო 11 - 9 = 2). ნაშთი ყოველთვის ნაკლებია გამყოფზე.',
        steps: [
          'იპოვე უდიდესი ჯერადი, რომელიც ნაკლებია ან ტოლია გასაყოფზე.',
          'გამოაკელი ის გასაყოფს — მიიღებ ნაშთს.',
        ],
        visualDemo: { type: 'division', caption: '11 ÷ 3 = 3 (ნაშთი 2)', a: 11, b: 3 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const b = randInt(3, 6);
            const q = randInt(2, 5);
            const r = randInt(1, b - 1);
            const a = b * q + r;
            const correctStr = `${q} (ნაშთი ${r})`;
            const opts = shuffle([
              correctStr,
              `${q} (ნაშთი ${r === 1 ? 2 : 1})`,
              `${q + 1} (ნაშთი ${r})`,
              `${Math.max(1, q - 1)} (ნაშთი ${r + 1})`,
            ]);
            return {
              id: `m5_rem_${i}`,
              prompt: `გამოთვალე ნაშთით: ${a} ÷ ${b} = ?`,
              options: Array.from(new Set(opts)),
              correctAnswer: correctStr,
              explanation: `${b} × ${q} = ${b * q}. ${a} - ${b * q} = ${r}. პასუხი: ${correctStr}.`,
            };
          }),
      },
    ],
  },
  {
    id: 6,
    title: 'დონე 6: გაძლიერებული მათემატიკა',
    description: 'წილადები, ათწილადები, პროცენტები, უარყოფითი რიცხვები, ალგებრა, გეომეტრია და ფუნქციები.',
    accent: 'blue',
    lessons: [
      {
        id: 'm6_fractions',
        levelId: 6,
        order: 1,
        title: 'წილადები',
        subtitle: 'მთელის ნაწილები',
        explanation:
          'წილადი a/b გვიჩვენებს მთელის ნაწილს. ქვედა რიცხვი (მნიშვნელი) ამბობს რამდენ ტოლ ნაწილად გაიყო მთელი, ზედა (მრიცხველი) — რამდენი ნაწილი ავიღეთ.',
        steps: [
          '1/2 არის ნახევარი (2 ტოლი ნაწილიდან 1).',
          'ტოლმნიშვნელიანი წილადების შეკრებისას იკრიბება მხოლოდ მრიცხველები: 1/4 + 2/4 = 3/4.',
        ],
        visualDemo: { type: 'fraction', caption: '3/4: მთელი გაყოფილია 4 ნაწილად, შეღებილია 3', a: 3, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const denom = [4, 5, 6, 8][i % 4];
            const n1 = randInt(1, Math.floor(denom / 2));
            const n2 = randInt(1, denom - n1);
            const ans = `${n1 + n2}/${denom}`;
            const opts = Array.from(
              new Set([
                ans,
                `${n1 + n2}/${denom * 2}`,
                `${Math.max(1, n1 + n2 - 1)}/${denom}`,
                `${n1}/${denom}`,
              ])
            );
            return {
              id: `m6_fr_${i}`,
              prompt: `შეკრიბე წილადები: ${n1}/${denom} + ${n2}/${denom} = ?`,
              options: shuffle(opts),
              correctAnswer: ans,
              explanation: `როცა მნიშვნელი ერთნაირია (${denom}), ვკრებთ მხოლოდ მრიცხველებს: ${n1} + ${n2} = ${
                n1 + n2
              }, პასუხი ${ans}.`,
              visual: { type: 'fraction', a: n1 + n2, b: denom },
            };
          }),
      },
      {
        id: 'm6_decimals',
        levelId: 6,
        order: 2,
        title: 'ათწილადები',
        subtitle: 'მთელი და წილადი მძიმის შემდეგ',
        explanation:
          'ათწილადში წერტილის (ან მძიმის) მარცხნივ მთელი ნაწილია, მარჯვნივ — მეათედები და მეასედები. მაგ: 1.5 + 2.5 = 4.0.',
        steps: [
          'დაასწორე წერტილი წერტილის ქვეშ.',
          'შეკრიბე ან გამოაკელი ისე, როგორც ჩვეულებრივი რიცხვები.',
        ],
        visualDemo: { type: 'number_line', caption: '0.5 არის ზუსტად შუაში 0-სა და 1-ს შორის', a: 1, b: 2 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = randInt(10, 45) / 10;
            const b = randInt(5, 25) / 10;
            const ans = Math.round((a + b) * 10) / 10;
            return {
              id: `m6_dec_${i}`,
              prompt: `გამოთვალე: ${a.toFixed(1)} + ${b.toFixed(1)} = ?`,
              options: makeNumericOptions(ans, 0.5, 0.5),
              correctAnswer: String(ans),
              explanation: `${a.toFixed(1)} + ${b.toFixed(1)} = ${ans}.`,
            };
          }),
      },
      {
        id: 'm6_percent',
        levelId: 6,
        order: 3,
        title: 'პროცენტები (%)',
        subtitle: 'ასეულიდან ნაწილი',
        explanation:
          'პროცენტი (%) ნიშნავს „ასიდან“. 50% არის ნახევარი (50/100), 25% — მეოთხედი, 10% — მეათედი.',
        steps: [
          'რიცხვის 10%-ის საპოვნელად გაყავი 10-ზე.',
          '50%-ის საპოვნელად გაყავი 2-ზე.',
          '20%-ის საპოვნელად იპოვე 10% და გაამრავლე 2-ზე.',
        ],
        visualDemo: { type: 'fraction', caption: '50% = 50/100 = 1/2', a: 50, b: 100 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const pct = [10, 20, 25, 50][i % 4];
            const base = [40, 60, 80, 100, 200][i % 5];
            const ans = (base * pct) / 100;
            return {
              id: `m6_pct_${i}`,
              prompt: `რამდენია ${base}-ის ${pct}%?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `${base} × ${pct} ÷ 100 = ${ans}.`,
            };
          }),
      },
      {
        id: 'm6_negative',
        levelId: 6,
        order: 4,
        title: 'უარყოფითი რიცხვები',
        subtitle: 'ნულზე ნაკლები რიცხვები',
        explanation:
          'უარყოფითი რიცხვები (-1, -2, -5) დგანან 0-ის მარცხნივ (როგორც ყინვა თერმომეტრზე). რაც უფრო მარცხნივაა რიცხვი, მით ნაკლებია.',
        steps: [
          'მაგ: -3 + 5 ნიშნავს: ვიწყებთ -3-დან და ვდგამთ 5 ნაბიჯს მარჯვნივ → 2.',
          '2 - 5 = -3.',
        ],
        visualDemo: { type: 'number_line', caption: '0-ის მარცხნივ არის -1, -2, -3...', a: -3, b: 2 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const a = -randInt(2, 8);
            const b = randInt(3, 12);
            const ans = a + b;
            return {
              id: `m6_neg_${i}`,
              prompt: `გამოთვალე: (${a}) + ${b} = ?`,
              options: makeNumericOptions(ans, -15),
              correctAnswer: String(ans),
              explanation: `რიცხვით ღერძზე ${a}-დან ${b} ნაბიჯი მარჯვნივ გვაძლევს ${ans}-ს.`,
            };
          }),
      },
      {
        id: 'm6_algebra',
        levelId: 6,
        order: 5,
        title: 'საბაზისო ალგებრა',
        subtitle: 'ასოები როგორც უცნობი რიცხვები',
        explanation:
          'ალგებრაში უცნობ რიცხვს აღნიშნავენ ასოთი, მაგალითად x. თუ x = 4, მაშინ 2x + 3 ნიშნავს 2 × 4 + 3 = 11.',
        steps: [
          'ჩასვი მოცემული რიცხვი x-ის ადგილას.',
          'ჯერ შეასრულე გამრავლება, შემდეგ მიმატება/გამოკლება.',
        ],
        visualDemo: { type: 'addition', caption: 'თუ x = 5, მაშინ 3x = 3 × 5 = 15', a: 3, b: 5 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const x = randInt(2, 7);
            const k = randInt(2, 4);
            const c = randInt(1, 6);
            const ans = k * x + c;
            return {
              id: `m6_alg_${i}`,
              prompt: `თუ x = ${x}, რას უდრის ${k}x + ${c}?`,
              options: makeNumericOptions(ans, 2),
              correctAnswer: String(ans),
              explanation: `ჩავსვათ x = ${x}: ${k} × ${x} + ${c} = ${k * x} + ${c} = ${ans}.`,
            };
          }),
      },
      {
        id: 'm6_equations',
        levelId: 6,
        order: 6,
        title: 'განტოლებები',
        subtitle: 'უცნობი x-ის პოვნა',
        explanation:
          'განტოლება არის ტოლობა უცნობით: x + 5 = 12. x-ის საპოვნელად გადაიტანე 5 მეორე მხარეს საპირისპირო ნიშნით: x = 12 - 5 = 7.',
        steps: [
          'დატოვე x მარცხნივ.',
          'მიმატება მეორე მხარეს გადადის გამოკლებად, გამრავლება — გაყოფად.',
        ],
        visualDemo: { type: 'addition', caption: 'x + 4 = 10 → x = 10 - 4 = 6', a: 6, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const x = randInt(2, 12);
            const b = randInt(3, 9);
            const sum = x + b;
            return {
              id: `m6_eq_${i}`,
              prompt: `ამოხსენი განტოლება: x + ${b} = ${sum}. რას უდრის x?`,
              options: makeNumericOptions(x, 1),
              correctAnswer: String(x),
              explanation: `x = ${sum} - ${b} = ${x}. შემოწმება: ${x} + ${b} = ${sum}.`,
            };
          }),
      },
      {
        id: 'm6_geometry',
        levelId: 6,
        order: 7,
        title: 'გეომეტრია',
        subtitle: 'პერიმეტრი და ფართობი',
        explanation:
          'პერიმეტრი (P) არის ფიგურის ყველა გვერდის სიგრძეთა ჯამი. მართკუთხედის ფართობი (S) არის სიგრძე × სიგანე.',
        steps: [
          'კვადრატის პერიმეტრი: 4 × გვერდი.',
          'მართკუთხედის ფართობი: a × b.',
          'მართკუთხედის პერიმეტრი: 2 × (a + b).',
        ],
        visualDemo: { type: 'geometry', caption: 'მართკუთხედი 5×3: ფართობი = 15, პერიმეტრი = 16', a: 5, b: 3 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const w = randInt(3, 9);
            const h = randInt(2, 7);
            const isArea = i % 2 === 0;
            const ans = isArea ? w * h : 2 * (w + h);
            return {
              id: `m6_geo_${i}`,
              prompt: isArea
                ? `მართკუთხედის გვერდებია ${w} სმ და ${h} სმ. იპოვე მისი ფართობი (სმ²).`
                : `მართკუთხედის გვერდებია ${w} სმ და ${h} სმ. იპოვე მისი პერიმეტრი (სმ).`,
              options: makeNumericOptions(ans, 4),
              correctAnswer: String(ans),
              explanation: isArea
                ? `ფართობი = ${w} × ${h} = ${ans} სმ².`
                : `პერიმეტრი = 2 × (${w} + ${h}) = ${ans} სმ.`,
            };
          }),
      },
      {
        id: 'm6_functions',
        levelId: 6,
        order: 8,
        title: 'მათემატიკური ფუნქციები',
        subtitle: 'შემავალი x და გამავალი y',
        explanation:
          'ფუნქცია არის წესი, რომელიც თითოეულ შემავალ რიცხვს (x) უსაბამებს ერთ გამავალ რიცხვს (y). მაგალითად y = x + 3.',
        steps: [
          'აიღე x-ის მნიშვნელობა.',
          'გამოიყენე ფუნქციის წესი y-ის მისაღებად.',
        ],
        visualDemo: { type: 'coordinate', caption: 'ფუნქცია y = 2x: თუ x=2 → y=4', a: 2, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const x = randInt(1, 6);
            const m = randInt(2, 3);
            const c = randInt(1, 4);
            const ans = m * x + c;
            return {
              id: `m6_fn_${i}`,
              prompt: `მოცემულია წესი y = ${m}x + ${c}. რას უდრის y, როცა x = ${x}?`,
              options: makeNumericOptions(ans, 2),
              correctAnswer: String(ans),
              explanation: `y = ${m} × ${x} + ${c} = ${ans}.`,
            };
          }),
      },
      {
        id: 'm6_coordinates',
        levelId: 6,
        order: 9,
        title: 'კოორდინატთა სისტემა',
        subtitle: 'წერტილები (x, y) სიბრტყეზე',
        explanation:
          'კოორდინატთა სისტემაში წერტილის მდებარეობა იწერება წყვილით (x, y). პირველი რიცხვი (x) გვიჩვენებს ჰორიზონტალურ ნაბიჯს, მეორე (y) — ვერტიკალურს.',
        steps: [
          'დაიწყე სათავიდან (0, 0).',
          'x-ის მიხედვით გადადი მარჯვნივ ან მარცხნივ.',
          'y-ის მიხედვით ადი ზემოთ ან ჩამოდი ქვემოთ.',
        ],
        visualDemo: { type: 'coordinate', caption: 'წერტილი (3, 4): 3 მარჯვნივ, 4 ზემოთ', a: 3, b: 4 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const x = randInt(1, 5);
            const y = randInt(1, 5);
            const askX = i % 2 === 0;
            const ans = askX ? x : y;
            return {
              id: `m6_coord_${i}`,
              prompt: `მოცემულია წერტილი (${x}, ${y}). რომელი რიცხვი გვიჩვენებს ${
                askX ? 'ჰორიზონტალურ (x)' : 'ვერტიკალურ (y)'
              } კოორდინატს?`,
              options: makeNumericOptions(ans, 0),
              correctAnswer: String(ans),
              explanation: `წყვილში (x, y) პირველია x = ${x}, მეორეა y = ${y}.`,
            };
          }),
      },
      {
        id: 'm6_graphs',
        levelId: 6,
        order: 10,
        title: 'გრაფიკები და ფუნქციის ჩანაწერი f(x)',
        subtitle: 'წრფივი ფუნქციის წაკითხვა',
        explanation:
          'მათემატიკაში ხშირად წერენ f(x) = 2x + 1. ჩანაწერი f(3) ნიშნავს: ჩასვი x = 3 ფორმულაში და გამოთვალე მნიშვნელობა!',
        steps: [
          'f(3) ნიშნავს x = 3.',
          'თუ f(x) = 2x + 1, მაშინ f(3) = 2×3 + 1 = 7.',
          'გრაფიკზე ეს შეესაბამება წერტილს (3, 7).',
        ],
        visualDemo: { type: 'coordinate', caption: 'f(x) = x + 1 წრფის გრაფიკი გადის (2, 3) წერტილზე', a: 2, b: 3 },
        generateQuestions: (count = 5) =>
          Array.from({ length: count }, (_, i) => {
            const x = randInt(1, 5);
            const k = randInt(1, 3);
            const b = randInt(1, 5);
            const ans = k * x + b;
            return {
              id: `m6_gr_${i}`,
              prompt: `თუ f(x) = ${k === 1 ? '' : k}x + ${b}, რას უდრის f(${x})?`,
              options: makeNumericOptions(ans, 1),
              correctAnswer: String(ans),
              explanation: `f(${x}) = ${k} × ${x} + ${b} = ${ans}. გრაფიკზე წერტილია (${x}, ${ans}).`,
            };
          }),
      },
    ],
  },
];

export function isMathLessonUnlocked(
  levelId: number,
  order: number,
  completedLessons: Record<string, { completed: boolean }>
): boolean {
  if (levelId === 1 && order === 1) return true;
  const level = MATH_LEVELS.find((l) => l.id === levelId);
  if (!level) return false;
  if (order > 1) {
    const prev = level.lessons.find((l) => l.order === order - 1);
    return prev ? Boolean(completedLessons[prev.id]?.completed) : true;
  }
  const prevLevel = MATH_LEVELS.find((l) => l.id === levelId - 1);
  if (!prevLevel) return true;
  const doneInPrev = prevLevel.lessons.filter((l) => completedLessons[l.id]?.completed).length;
  return doneInPrev >= Math.ceil(prevLevel.lessons.length * 0.7);
}
