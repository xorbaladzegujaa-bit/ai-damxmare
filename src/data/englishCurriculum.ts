export interface AlphabetLetter {
  upper: string;
  lower: string;
  pronunciationKa: string;
  soundHintKa: string;
  exampleWord: string;
  exampleMeaningKa: string;
}

export interface VocabWord {
  id: string;
  category:
    | 'numbers'
    | 'colors'
    | 'family'
    | 'food'
    | 'animals'
    | 'objects'
    | 'activities'
    | 'verbs';
  english: string;
  georgian: string;
  pronunciationKa: string;
  exampleEn: string;
  exampleKa: string;
}

export interface EnglishLessonItem {
  id: string;
  stage: 'sentences' | 'grammar' | 'practical';
  titleKa: string;
  explanationKa: string;
  examples: { en: string; pronunciationKa: string; ka: string }[];
  quiz: {
    id: string;
    promptKa: string;
    options: string[];
    correctAnswer: string;
    explanationKa: string;
  }[];
}

export interface PracticalDialogue {
  id: string;
  titleKa: string;
  category: 'greetings' | 'shopping' | 'directions' | 'intro';
  lines: { speaker: string; en: string; ka: string }[];
  readingTextEn: string;
  readingTextKa: string;
  questionKa: string;
  options: string[];
  correctAnswer: string;
}

export const ENGLISH_ALPHABET: AlphabetLetter[] = [
  { upper: 'A', lower: 'a', pronunciationKa: 'ეი', soundHintKa: 'იკითხება როგორც „ეი“ ან „ა/ე“ სიტყვაში', exampleWord: 'Apple', exampleMeaningKa: 'ვაშლი' },
  { upper: 'B', lower: 'b', pronunciationKa: 'ბი', soundHintKa: 'მკაფიო „ბ“ ბგერა', exampleWord: 'Book', exampleMeaningKa: 'წიგნი' },
  { upper: 'C', lower: 'c', pronunciationKa: 'სი', soundHintKa: 'იკითხება როგორც „კ“ ან „ს“', exampleWord: 'Cat', exampleMeaningKa: 'კატა' },
  { upper: 'D', lower: 'd', pronunciationKa: 'დი', soundHintKa: 'რბილი „დ“ ბგერა', exampleWord: 'Dog', exampleMeaningKa: 'ძაღლი' },
  { upper: 'E', lower: 'e', pronunciationKa: 'ი', soundHintKa: 'ანბანში „ი“, სიტყვებში ხშირად „ე“', exampleWord: 'Egg', exampleMeaningKa: 'კვერცხი' },
  { upper: 'F', lower: 'f', pronunciationKa: 'ეფ', soundHintKa: '„ფ“ ბგერა ზედა კბილებით ქვედა ტუჩზე', exampleWord: 'Fish', exampleMeaningKa: 'თევზი' },
  { upper: 'G', lower: 'g', pronunciationKa: 'ჯი', soundHintKa: 'იკითხება როგორც „გ“ ან „ჯ“', exampleWord: 'Green', exampleMeaningKa: 'მწვანე' },
  { upper: 'H', lower: 'h', pronunciationKa: 'ეიჩ', soundHintKa: 'მსუბუქი ამოსუნთქული „ჰ“', exampleWord: 'House', exampleMeaningKa: 'სახლი' },
  { upper: 'I', lower: 'i', pronunciationKa: 'აი', soundHintKa: 'იკითხება როგორც „აი“ ან მოკლე „ი“', exampleWord: 'Ice', exampleMeaningKa: 'ყინული' },
  { upper: 'J', lower: 'j', pronunciationKa: 'ჯეი', soundHintKa: 'ყოველთვის „ჯ“ ბგერა', exampleWord: 'Juice', exampleMeaningKa: 'წვენი' },
  { upper: 'K', lower: 'k', pronunciationKa: 'ქეი', soundHintKa: '„ქ/კ“ ბგერა', exampleWord: 'Key', exampleMeaningKa: 'გასაღები' },
  { upper: 'L', lower: 'l', pronunciationKa: 'ელ', soundHintKa: '„ლ“ ბგერა', exampleWord: 'Lamp', exampleMeaningKa: 'ლამპა' },
  { upper: 'M', lower: 'm', pronunciationKa: 'ემ', soundHintKa: '„მ“ ბგერა', exampleWord: 'Milk', exampleMeaningKa: 'რძე' },
  { upper: 'N', lower: 'n', pronunciationKa: 'ენ', soundHintKa: '„ნ“ ბგერა', exampleWord: 'Name', exampleMeaningKa: 'სახელი' },
  { upper: 'O', lower: 'o', pronunciationKa: 'ოუ', soundHintKa: 'მრგვალი „ო“ ან „ოუ“', exampleWord: 'Orange', exampleMeaningKa: 'ფორთოხალი' },
  { upper: 'P', lower: 'p', pronunciationKa: 'ფი', soundHintKa: 'ძლიერი ამოსუნთქული „ფ/პ“', exampleWord: 'Pen', exampleMeaningKa: 'კალამი' },
  { upper: 'Q', lower: 'q', pronunciationKa: 'ქიუ', soundHintKa: 'თითქმის ყოველთვის მოდის u-სთან ერთად (ქვ)', exampleWord: 'Queen', exampleMeaningKa: 'დედოფალი' },
  { upper: 'R', lower: 'r', pronunciationKa: 'არ', soundHintKa: 'რბილი ინგლისური „რ“ (ენა არ ეხება სასას)', exampleWord: 'Red', exampleMeaningKa: 'წითელი' },
  { upper: 'S', lower: 's', pronunciationKa: 'ეს', soundHintKa: '„ს“ ბგერა', exampleWord: 'Sun', exampleMeaningKa: 'მზე' },
  { upper: 'T', lower: 't', pronunciationKa: 'თი', soundHintKa: '„თ/ტ“ ბგერა', exampleWord: 'Table', exampleMeaningKa: 'მაგიდა' },
  { upper: 'U', lower: 'u', pronunciationKa: 'იუ', soundHintKa: 'იკითხება როგორც „იუ“, „ა“ ან „უ“', exampleWord: 'Umbrella', exampleMeaningKa: 'ქოლგა' },
  { upper: 'V', lower: 'v', pronunciationKa: 'ვი', soundHintKa: 'მკაფიო „ვ“ ბგერა', exampleWord: 'Van', exampleMeaningKa: 'ფურგონი' },
  { upper: 'W', lower: 'w', pronunciationKa: 'დაბლ-იუ', soundHintKa: 'მომრგვალებული ტუჩებით „უ/ვ“', exampleWord: 'Water', exampleMeaningKa: 'წყალი' },
  { upper: 'X', lower: 'x', pronunciationKa: 'ექს', soundHintKa: '„ქს“ ბგერა', exampleWord: 'Box', exampleMeaningKa: 'ყუთი' },
  { upper: 'Y', lower: 'y', pronunciationKa: 'უაი', soundHintKa: '„ი“ ან „აი“', exampleWord: 'Yellow', exampleMeaningKa: 'ყვითელი' },
  { upper: 'Z', lower: 'z', pronunciationKa: 'ზი', soundHintKa: '„ზ“ ბგერა', exampleWord: 'Zoo', exampleMeaningKa: 'ზოოპარკი' },
];

export const VOCAB_CATEGORIES: { id: VocabWord['category']; labelKa: string }[] = [
  { id: 'numbers', labelKa: 'რიცხვები' },
  { id: 'colors', labelKa: 'ფერები' },
  { id: 'family', labelKa: 'ოჯახი' },
  { id: 'food', labelKa: 'საკვები' },
  { id: 'animals', labelKa: 'ცხოველები' },
  { id: 'objects', labelKa: 'ნივთები' },
  { id: 'activities', labelKa: 'ყოველდღიური საქმიანობა' },
  { id: 'verbs', labelKa: 'ხშირი ზმნები' },
];

export const VOCABULARY_BANK: VocabWord[] = [
  // Numbers
  { id: 'v_num_1', category: 'numbers', english: 'One', georgian: 'ერთი', pronunciationKa: 'უან', exampleEn: 'I have one book.', exampleKa: 'მე მაქვს ერთი წიგნი.' },
  { id: 'v_num_2', category: 'numbers', english: 'Two', georgian: 'ორი', pronunciationKa: 'თუ', exampleEn: 'Two apples on the table.', exampleKa: 'ორი ვაშლი მაგიდაზე.' },
  { id: 'v_num_3', category: 'numbers', english: 'Three', georgian: 'სამი', pronunciationKa: 'სრი', exampleEn: 'I see three cats.', exampleKa: 'მე ვხედავ სამ კატას.' },
  { id: 'v_num_4', category: 'numbers', english: 'Four', georgian: 'ოთხი', pronunciationKa: 'ფორ', exampleEn: 'Four chairs in the room.', exampleKa: 'ოთხი სკამი ოთახში.' },
  { id: 'v_num_5', category: 'numbers', english: 'Five', georgian: 'ხუთი', pronunciationKa: 'ფაივ', exampleEn: 'Five minutes left.', exampleKa: 'ხუთი წუთი დარჩა.' },
  { id: 'v_num_6', category: 'numbers', english: 'Six', georgian: 'ექვსი', pronunciationKa: 'სიქს', exampleEn: 'Six pens in my bag.', exampleKa: 'ექვსი კალამი ჩემს ჩანთაში.' },
  { id: 'v_num_7', category: 'numbers', english: 'Seven', georgian: 'შვიდი', pronunciationKa: 'სევენ', exampleEn: 'Seven days in a week.', exampleKa: 'კვირაში შვიდი დღეა.' },
  { id: 'v_num_8', category: 'numbers', english: 'Eight', georgian: 'რვა', pronunciationKa: 'ეით', exampleEn: 'We start at eight.', exampleKa: 'რვაზე ვიწყებთ.' },
  { id: 'v_num_9', category: 'numbers', english: 'Nine', georgian: 'ცხრა', pronunciationKa: 'ნაინ', exampleEn: 'Nine stars in the sky.', exampleKa: 'ცხრა ვარსკვლავი ცაზე.' },
  { id: 'v_num_10', category: 'numbers', english: 'Ten', georgian: 'ათი', pronunciationKa: 'თენ', exampleEn: 'Ten new words today.', exampleKa: 'დღეს ათი ახალი სიტყვა.' },

  // Colors
  { id: 'v_col_1', category: 'colors', english: 'Red', georgian: 'წითელი', pronunciationKa: 'რედ', exampleEn: 'The apple is red.', exampleKa: 'ვაშლი წითელია.' },
  { id: 'v_col_2', category: 'colors', english: 'Blue', georgian: 'ლურჯი', pronunciationKa: 'ბლუ', exampleEn: 'The sky is blue.', exampleKa: 'ცა ლურჯია.' },
  { id: 'v_col_3', category: 'colors', english: 'Green', georgian: 'მწვანე', pronunciationKa: 'გრინ', exampleEn: 'I like green tea.', exampleKa: 'მიყვარს მწვანე ჩაი.' },
  { id: 'v_col_4', category: 'colors', english: 'Yellow', georgian: 'ყვითელი', pronunciationKa: 'იელოუ', exampleEn: 'The sun is yellow.', exampleKa: 'მზე ყვითელია.' },
  { id: 'v_col_5', category: 'colors', english: 'Black', georgian: 'შავი', pronunciationKa: 'ბლექ', exampleEn: 'A black pen.', exampleKa: 'შავი კალამი.' },
  { id: 'v_col_6', category: 'colors', english: 'White', georgian: 'თეთრი', pronunciationKa: 'უაით', exampleEn: 'White snow.', exampleKa: 'თეთრი თოვლი.' },
  { id: 'v_col_7', category: 'colors', english: 'Orange', georgian: 'ნარინჯისფერი', pronunciationKa: 'ორინჯ', exampleEn: 'An orange ball.', exampleKa: 'ნარინჯისფერი ბურთი.' },
  { id: 'v_col_8', category: 'colors', english: 'Purple', georgian: 'იისფერი', pronunciationKa: 'ფერფლ', exampleEn: 'She has a purple bag.', exampleKa: 'მას იისფერი ჩანთა აქვს.' },

  // Family
  { id: 'v_fam_1', category: 'family', english: 'Mother', georgian: 'დედა', pronunciationKa: 'მაზერ', exampleEn: 'My mother is kind.', exampleKa: 'ჩემი დედა კეთილია.' },
  { id: 'v_fam_2', category: 'family', english: 'Father', georgian: 'მამა', pronunciationKa: 'ფაზერ', exampleEn: 'My father works hard.', exampleKa: 'ჩემი მამა ბევრს შრომობს.' },
  { id: 'v_fam_3', category: 'family', english: 'Sister', georgian: 'და', pronunciationKa: 'სისტერ', exampleEn: 'My sister reads books.', exampleKa: 'ჩემი და წიგნებს კითხულობს.' },
  { id: 'v_fam_4', category: 'family', english: 'Brother', georgian: 'ძმა', pronunciationKa: 'ბრაზერ', exampleEn: 'My brother plays football.', exampleKa: 'ჩემი ძმა ფეხბურთს თამაშობს.' },
  { id: 'v_fam_5', category: 'family', english: 'Friend', georgian: 'მეგობარი', pronunciationKa: 'ფრენდ', exampleEn: 'You are my good friend.', exampleKa: 'შენ ჩემი კარგი მეგობარი ხარ.' },
  { id: 'v_fam_6', category: 'family', english: 'Child', georgian: 'ბავშვი', pronunciationKa: 'ჩაილდ', exampleEn: 'The child is happy.', exampleKa: 'ბავშვი ბედნიერია.' },
  { id: 'v_fam_7', category: 'family', english: 'Family', georgian: 'ოჯახი', pronunciationKa: 'ფემილი', exampleEn: 'I love my family.', exampleKa: 'მიყვარს ჩემი ოჯახი.' },

  // Food
  { id: 'v_food_1', category: 'food', english: 'Bread', georgian: 'პური', pronunciationKa: 'ბრედ', exampleEn: 'I want fresh bread.', exampleKa: 'ახალი პური მინდა.' },
  { id: 'v_food_2', category: 'food', english: 'Water', georgian: 'წყალი', pronunciationKa: 'უოთერ', exampleEn: 'Drink clean water.', exampleKa: 'დალიე სუფთა წყალი.' },
  { id: 'v_food_3', category: 'food', english: 'Apple', georgian: 'ვაშლი', pronunciationKa: 'ეფლ', exampleEn: 'An apple a day.', exampleKa: 'ერთი ვაშლი დღეში.' },
  { id: 'v_food_4', category: 'food', english: 'Milk', georgian: 'რძე', pronunciationKa: 'მილქ', exampleEn: 'Cold milk is good.', exampleKa: 'ცივი რძე კარგია.' },
  { id: 'v_food_5', category: 'food', english: 'Tea', georgian: 'ჩაი', pronunciationKa: 'თი', exampleEn: 'Hot tea with lemon.', exampleKa: 'ცხელი ჩაი ლიმონით.' },
  { id: 'v_food_6', category: 'food', english: 'Coffee', georgian: 'ყავა', pronunciationKa: 'ქოფი', exampleEn: 'I drink coffee in the morning.', exampleKa: 'დილით ყავას ვსვამ.' },
  { id: 'v_food_7', category: 'food', english: 'Cheese', georgian: 'ყველი', pronunciationKa: 'ჩიზ', exampleEn: 'Bread and cheese.', exampleKa: 'პური და ყველი.' },

  // Animals
  { id: 'v_ani_1', category: 'animals', english: 'Dog', georgian: 'ძაღლი', pronunciationKa: 'დოგ', exampleEn: 'The dog is friendly.', exampleKa: 'ძაღლი მეგობრულია.' },
  { id: 'v_ani_2', category: 'animals', english: 'Cat', georgian: 'კატა', pronunciationKa: 'ქეთ', exampleEn: 'The cat sleeps here.', exampleKa: 'კატა აქ სძინავს.' },
  { id: 'v_ani_3', category: 'animals', english: 'Bird', georgian: 'ჩიტი', pronunciationKa: 'ბერდ', exampleEn: 'A small bird sings.', exampleKa: 'პატარა ჩიტი მღერის.' },
  { id: 'v_ani_4', category: 'animals', english: 'Fish', georgian: 'თევზი', pronunciationKa: 'ფიშ', exampleEn: 'Fish swim in water.', exampleKa: 'თევზები წყალში ცურავენ.' },
  { id: 'v_ani_5', category: 'animals', english: 'Horse', georgian: 'ცხენი', pronunciationKa: 'ჰორს', exampleEn: 'The horse runs fast.', exampleKa: 'ცხენი სწრაფად დარბის.' },
  { id: 'v_ani_6', category: 'animals', english: 'Lion', georgian: 'ლომი', pronunciationKa: 'ლაიონ', exampleEn: 'The lion is strong.', exampleKa: 'ლომი ძლიერია.' },

  // Objects
  { id: 'v_obj_1', category: 'objects', english: 'Book', georgian: 'წიგნი', pronunciationKa: 'ბუქ', exampleEn: 'Open your book.', exampleKa: 'გახსენი შენი წიგნი.' },
  { id: 'v_obj_2', category: 'objects', english: 'Table', georgian: 'მაგიდა', pronunciationKa: 'თეიბლ', exampleEn: 'The phone is on the table.', exampleKa: 'ტელეფონი მაგიდაზეა.' },
  { id: 'v_obj_3', category: 'objects', english: 'Chair', georgian: 'სკამი', pronunciationKa: 'ჩეარ', exampleEn: 'Sit on the chair.', exampleKa: 'დაჯექი სკამზე.' },
  { id: 'v_obj_4', category: 'objects', english: 'Phone', georgian: 'ტელეფონი', pronunciationKa: 'ფოუნ', exampleEn: 'This is my phone.', exampleKa: 'ეს ჩემი ტელეფონია.' },
  { id: 'v_obj_5', category: 'objects', english: 'House', georgian: 'სახლი', pronunciationKa: 'ჰაუს', exampleEn: 'Our house is warm.', exampleKa: 'ჩვენი სახლი თბილია.' },
  { id: 'v_obj_6', category: 'objects', english: 'Key', georgian: 'გასაღები', pronunciationKa: 'ქი', exampleEn: 'Where is the key?', exampleKa: 'სად არის გასაღები?' },
  { id: 'v_obj_7', category: 'objects', english: 'Bag', georgian: 'ჩანთა', pronunciationKa: 'ბეგ', exampleEn: 'My bag is heavy.', exampleKa: 'ჩემი ჩანთა მძიმეა.' },

  // Activities
  { id: 'v_act_1', category: 'activities', english: 'Study', georgian: 'სწავლა', pronunciationKa: 'სთადი', exampleEn: 'I study every day.', exampleKa: 'მე ყოველდღე ვსწავლობ.' },
  { id: 'v_act_2', category: 'activities', english: 'Work', georgian: 'მუშაობა', pronunciationKa: 'უორქ', exampleEn: 'I go to work.', exampleKa: 'სამსახურში მივდივარ.' },
  { id: 'v_act_3', category: 'activities', english: 'Sleep', georgian: 'ძილი', pronunciationKa: 'სლიფ', exampleEn: 'Sleep eight hours.', exampleKa: 'იძინე რვა საათი.' },
  { id: 'v_act_4', category: 'activities', english: 'Walk', georgian: 'სეირნობა / სიარული', pronunciationKa: 'უოქ', exampleEn: 'Let us walk in the park.', exampleKa: 'პარკში გავისეირნოთ.' },
  { id: 'v_act_5', category: 'activities', english: 'Cook', georgian: 'საჭმლის მომზადება', pronunciationKa: 'ქუქ', exampleEn: 'I cook dinner.', exampleKa: 'ვახშამს ვამზადებ.' },
  { id: 'v_act_6', category: 'activities', english: 'Listen', georgian: 'მოსმენა', pronunciationKa: 'ლისნ', exampleEn: 'Listen carefully.', exampleKa: 'ყურადღებით მოუსმინე.' },

  // Verbs
  { id: 'v_verb_1', category: 'verbs', english: 'Go', georgian: 'წასვლა', pronunciationKa: 'გოუ', exampleEn: 'I go home.', exampleKa: 'სახლში მივდივარ.' },
  { id: 'v_verb_2', category: 'verbs', english: 'Come', georgian: 'მოსვლა', pronunciationKa: 'ქამ', exampleEn: 'Come here please.', exampleKa: 'გთხოვ მოდი აქ.' },
  { id: 'v_verb_3', category: 'verbs', english: 'Read', georgian: 'კითხვა', pronunciationKa: 'რიდ', exampleEn: 'I read a story.', exampleKa: 'მოთხრობას ვკითხულობ.' },
  { id: 'v_verb_4', category: 'verbs', english: 'Write', georgian: 'წერა', pronunciationKa: 'რაით', exampleEn: 'Write your name.', exampleKa: 'დაწერე შენი სახელი.' },
  { id: 'v_verb_5', category: 'verbs', english: 'Speak', georgian: 'საუბარი', pronunciationKa: 'სფიქ', exampleEn: 'I speak Georgian.', exampleKa: 'მე ქართულად ვსაუბრობ.' },
  { id: 'v_verb_6', category: 'verbs', english: 'Have', georgian: 'ქონა / ყოლა', pronunciationKa: 'ჰევ', exampleEn: 'I have a pen.', exampleKa: 'მე მაქვს კალამი.' },
  { id: 'v_verb_7', category: 'verbs', english: 'Like', georgian: 'მოწონება', pronunciationKa: 'ლაიქ', exampleEn: 'I like learning.', exampleKa: 'მომწონს სწავლა.' },
  { id: 'v_verb_8', category: 'verbs', english: 'Want', georgian: 'სურვილი / ნდომა', pronunciationKa: 'უონთ', exampleEn: 'I want to learn English.', exampleKa: 'მინდა ინგლისურის სწავლა.' },
];

export const SENTENCE_LESSONS: EnglishLessonItem[] = [
  {
    id: 'eng_sent_1',
    stage: 'sentences',
    titleKa: 'I am / You are / He is / She is / It is',
    explanationKa:
      'ინგლისურში „ყოფნა“ (to be) იცვლება იმის მიხედვით, თუ ვისზე ვსაუბრობთ: I am (მე ვარ), You are (შენ ხარ / თქვენ ხართ), He is (ის არის — მამრობითი), She is (ის არის — მდედრობითი), It is (ის არის — ნივთი/ცხოველი).',
    examples: [
      { en: 'I am a student.', pronunciationKa: 'აი ემ ე სთიუდენთ', ka: 'მე სტუდენტი ვარ.' },
      { en: 'You are my friend.', pronunciationKa: 'იუ არ მაი ფრენდ', ka: 'შენ ჩემი მეგობარი ხარ.' },
      { en: 'He is at home.', pronunciationKa: 'ჰი იზ ეთ ჰოუმ', ka: 'ის სახლშია.' },
      { en: 'She is a doctor.', pronunciationKa: 'ში იზ ე დოქთერ', ka: 'ის ექიმია.' },
      { en: 'It is a good book.', pronunciationKa: 'ით იზ ე გუდ ბუქ', ka: 'ეს კარგი წიგნია.' },
    ],
    quiz: [
      {
        id: 'es1_q1',
        promptKa: 'როგორ ითქმის ინგლისურად „მე ვარ ბედნიერი“?',
        options: ['I am happy.', 'I is happy.', 'You am happy.', 'He are happy.'],
        correctAnswer: 'I am happy.',
        explanationKa: 'I (მე) ყოველთვის გამოიყენება am-თან ერთად: I am happy.',
      },
      {
        id: 'es1_q2',
        promptKa: 'აირჩიე სწორი ვარიანტი გოგონაზე სასაუბროდ: „ის კეთილია“',
        options: ['She is kind.', 'He is kind.', 'It is kind.', 'She am kind.'],
        correctAnswer: 'She is kind.',
        explanationKa: 'ქალზე/გოგონაზე გამოიყენება She is.',
      },
      {
        id: 'es1_q3',
        promptKa: 'შეავსე გამოტოვებული ადგილი: „You ___ smart.“',
        options: ['are', 'is', 'am', 'be'],
        correctAnswer: 'are',
        explanationKa: 'You-სთან ყოველთვის გამოიყენება are.',
      },
    ],
  },
  {
    id: 'eng_sent_2',
    stage: 'sentences',
    titleKa: 'This is / I have / I like / I want',
    explanationKa:
      'ყოველდღიური საბაზისო კონსტრუქციები: This is (ეს არის), I have (მე მაქვს/მყავს), I like (მე მომწონს), I want (მე მინდა).',
    examples: [
      { en: 'This is my house.', pronunciationKa: 'ზის იზ მაი ჰაუს', ka: 'ეს ჩემი სახლია.' },
      { en: 'I have two brothers.', pronunciationKa: 'აი ჰევ თუ ბრაზერს', ka: 'მე მყავს ორი ძმა.' },
      { en: 'I like warm tea.', pronunciationKa: 'აი ლაიქ უორმ თი', ka: 'მე მომწონს თბილი ჩაი.' },
      { en: 'I want water, please.', pronunciationKa: 'აი უონთ უოთერ, ფლიზ', ka: 'წყალი მინდა, თუ შეიძლება.' },
    ],
    quiz: [
      {
        id: 'es2_q1',
        promptKa: 'რას ნიშნავს „I have a book“?',
        options: ['მე მაქვს წიგნი', 'მე მინდა წიგნი', 'ეს არის წიგნი', 'მე ვკითხულობ წიგნს'],
        correctAnswer: 'მე მაქვს წიგნი',
        explanationKa: 'have ნიშნავს ქონას/ყოლას — I have a book = მე მაქვს წიგნი.',
      },
      {
        id: 'es2_q2',
        promptKa: 'როგორ იტყვი: „მე მინდა ყავა“?',
        options: ['I want coffee.', 'I like coffee.', 'This is coffee.', 'I am coffee.'],
        correctAnswer: 'I want coffee.',
        explanationKa: 'want ნიშნავს ნდომას/სურვილს.',
      },
    ],
  },
  {
    id: 'eng_sent_3',
    stage: 'sentences',
    titleKa: 'მარტივი კითხვები და პასუხები',
    explanationKa:
      'კითხვის დასასმელად „to be“ ზმნა (am/is/are) გადმოდის წინადადების თავში, ხოლო მოქმედებით ზმნებთან ვიყენებთ Do/Does-ს.',
    examples: [
      { en: 'How are you? — I am fine, thank you.', pronunciationKa: 'ჰაუ არ იუ? — აი ემ ფაინ, სენქ იუ', ka: 'როგორ ხარ? — კარგად ვარ, გმადლობ.' },
      { en: 'What is your name? — My name is Nino.', pronunciationKa: 'უოთ იზ იორ ნეიმ? — მაი ნეიმ იზ ნინო', ka: 'რა გქვია? — მე მქვია ნინო.' },
      { en: 'Do you like music? — Yes, I do.', pronunciationKa: 'დუ იუ ლაიქ მიუზიქ? — იეს, აი დუ', ka: 'მოგწონს მუსიკა? — დიახ.' },
    ],
    quiz: [
      {
        id: 'es3_q1',
        promptKa: 'როგორ ვკითხოთ ინგლისურად „რა გქვია?“',
        options: ['What is your name?', 'How are you?', 'Where are you?', 'Who is this?'],
        correctAnswer: 'What is your name?',
        explanationKa: 'What is your name? ნიშნავს „რა არის შენი სახელი?“ / „რა გქვია?“',
      },
      {
        id: 'es3_q2',
        promptKa: 'სწორი პასუხი კითხვაზე „Are you ready?“ (მზად ხარ?)',
        options: ['Yes, I am.', 'Yes, I do.', 'Yes, you is.', 'Yes, he am.'],
        correctAnswer: 'Yes, I am.',
        explanationKa: 'კითხვაზე Are you...? მოკლე დადებითი პასუხია Yes, I am.',
      },
    ],
  },
];

export const GRAMMAR_LESSONS: EnglishLessonItem[] = [
  {
    id: 'eng_gram_1',
    stage: 'grammar',
    titleKa: 'ნაცვალსახელები და არტიკლები (a / an / the)',
    explanationKa:
      'ნაცვალსახელები: I (მე), You (შენ/თქვენ), He (ის-მამრ.), She (ის-მდედრ.), It (ის-საგანი), We (ჩვენ), They (ისინი). არტიკლი „a“ იწერება თანხმოვნით დაწყებულ სიტყვასთან (a book), „an“ — ხმოვნით დაწყებულთან (an apple), „the“ — კონკრეტულ საგანთან.',
    examples: [
      { en: 'a cat / an orange / the sun', pronunciationKa: 'ე ქეთ / ენ ორინჯ / ზე სან', ka: 'კატა / ფორთოხალი / (ის კონკრეტული) მზე' },
      { en: 'We are ready.', pronunciationKa: 'უი არ რედი', ka: 'ჩვენ მზად ვართ.' },
      { en: 'They have a dog.', pronunciationKa: 'ზეი ჰევ ე დოგ', ka: 'მათ ჰყავთ ძაღლი.' },
    ],
    quiz: [
      {
        id: 'eg1_q1',
        promptKa: 'რომელი არტიკლი სჭირდება სიტყვას „apple“ (ხმოვნით იწყება)?',
        options: ['an apple', 'a apple', 'are apple', 'am apple'],
        correctAnswer: 'an apple',
        explanationKa: 'ხმოვანი ბგერით დაწყებული მხოლობითი სიტყვის წინ იწერება „an“.',
      },
      {
        id: 'eg1_q2',
        promptKa: 'რას ნიშნავს ნაცვალსახელი „They“?',
        options: ['ისინი', 'ჩვენ', 'თქვენ', 'ის'],
        correctAnswer: 'ისინი',
        explanationKa: 'They ნიშნავს „ისინი“.',
      },
    ],
  },
  {
    id: 'eng_gram_2',
    stage: 'grammar',
    titleKa: 'მხოლობითი და მრავლობითი (Singular & Plural)',
    explanationKa:
      'ინგლისურში არსებითი სახელის მრავლობითი ფორმა უმეტესად იწარმოება ბოლოში -s ან -es დამატებით: book → books, box → boxes. ზოგი სიტყვა გამონაკლისია: child → children.',
    examples: [
      { en: 'one pen → two pens', pronunciationKa: 'უან ფენ → თუ ფენს', ka: 'ერთი კალამი → ორი კალამი' },
      { en: 'one box → three boxes', pronunciationKa: 'უან ბოქს → სრი ბოქსიზ', ka: 'ერთი ყუთი → სამი ყუთი' },
      { en: 'one child → two children', pronunciationKa: 'უან ჩაილდ → თუ ჩილდრენ', ka: 'ერთი ბავშვი → ორი ბავშვი' },
    ],
    quiz: [
      {
        id: 'eg2_q1',
        promptKa: 'როგორ იქნება „სამი კატა“ მრავლობითში?',
        options: ['three cats', 'three cat', 'three cates', 'three catis'],
        correctAnswer: 'three cats',
        explanationKa: 'უმეტეს სიტყვებს მრავლობითში უბრალოდ -s ემატება: cats.',
      },
    ],
  },
  {
    id: 'eng_gram_3',
    stage: 'grammar',
    titleKa: 'აწმყო მარტივი (Present Simple) და განგრძობითი (Continuous)',
    explanationKa:
      'Present Simple გამოიხატავს ჩვევებს და ყოველდღიურ მოქმედებებს (I read every day; He/She-სთან ზმნას ემატება -s: She reads). Present Continuous კი გამოხატავს იმას, რაც ახლა ხდება (I am reading now — ზმნას ემატება -ing).',
    examples: [
      { en: 'I work every day.', pronunciationKa: 'აი უორქ ევრი დეი', ka: 'მე ყოველდღე ვმუშაობ. (ჩვევა)' },
      { en: 'She works here.', pronunciationKa: 'ში უორქს ჰიარ', ka: 'ის აქ მუშაობს. (he/she + -s)' },
      { en: 'I am reading now.', pronunciationKa: 'აი ემ რიდინგ ნაუ', ka: 'ახლა ვკითხულობ. (ამ წუთას)' },
    ],
    quiz: [
      {
        id: 'eg3_q1',
        promptKa: 'აირჩიე სწორი წინადადება: „ის ყოველდღე სწავლობს“ (He)',
        options: ['He studies every day.', 'He study every day.', 'He studying every day.', 'He am study.'],
        correctAnswer: 'He studies every day.',
        explanationKa: 'Present Simple-ში He/She/It-თან ზმნას ემატება -s/-es (study → studies).',
      },
      {
        id: 'eg3_q2',
        promptKa: 'რომელი წინადადება აღწერს მოქმედებას, რომელიც ზუსტად ახლა ხდება?',
        options: ['I am eating now.', 'I eat every day.', 'I ate yesterday.', 'I will eat.'],
        correctAnswer: 'I am eating now.',
        explanationKa: 'am/is/are + ზმნა-ing (Present Continuous) აღნიშნავს მიმდინარე მოქმედებას.',
      },
    ],
  },
  {
    id: 'eng_gram_4',
    stage: 'grammar',
    titleKa: 'წარსული (Past Simple), მომავალი (Future) და წინადადების წყობა',
    explanationKa:
      'წარსული დრო (Past Simple): წესიერ ზმნებს ემატება -ed (walk → walked), არაწესიერები იცვლება (go → went). მომავალი დრო (Future): ზმნის წინ ვსვამთ „will“ (I will learn). ინგლისური წინადადების მკაცრი წყობაა: ვინ + რას აკეთებს + რა/სად/როდის.',
    examples: [
      { en: 'Yesterday I walked in the park.', pronunciationKa: 'იესთერდეი აი უოქდ ინ ზე ფარქ', ka: 'გუშინ პარკში ვისეირნე.' },
      { en: 'I went home.', pronunciationKa: 'აი უენთ ჰოუმ', ka: 'სახლში წავედი.' },
      { en: 'Tomorrow I will study math.', pronunciationKa: 'თუმოროუ აი უილ სთადი მეს', ka: 'ხვალ მათემატიკას ვისწავლი.' },
    ],
    quiz: [
      {
        id: 'eg4_q1',
        promptKa: 'როგორ ითქმის მომავალ დროში „მე წავალ“?',
        options: ['I will go.', 'I went.', 'I going.', 'I goes.'],
        correctAnswer: 'I will go.',
        explanationKa: 'მომავალი დროისთვის ზმნის წინ გამოიყენება will: I will go.',
      },
      {
        id: 'eg4_q2',
        promptKa: 'რომელია სწორი წინადადების წყობა?',
        options: ['I read books every day.', 'Every day books read I.', 'Read I books every day.', 'Books I every day read.'],
        correctAnswer: 'I read books every day.',
        explanationKa: 'სწორი თანმიმდევრობაა: ქვემდებარე (I) + ზმნა (read) + დამატება (books) + დრო (every day).',
      },
    ],
  },
];

export const PRACTICAL_DIALOGUES: PracticalDialogue[] = [
  {
    id: 'dial_greet',
    titleKa: 'მისალმება და მოკითხვა',
    category: 'greetings',
    lines: [
      { speaker: 'Ana', en: 'Good morning! How are you today?', ka: 'დილა მშვიდობისა! დღეს როგორ ხარ?' },
      { speaker: 'Giorgi', en: 'Good morning, Ana! I am very well, thank you. And you?', ka: 'დილა მშვიდობისა, ანა! ძალიან კარგად ვარ, გმადლობ. შენ?' },
      { speaker: 'Ana', en: 'I am great. Have a nice day!', ka: 'მშვენივრად ვარ. ბედნიერ დღეს გისურვებ!' },
    ],
    readingTextEn: 'Hello! My name is Nino. I live in Tbilisi. Every morning I drink tea and study English for fifteen minutes.',
    readingTextKa: 'გამარჯობა! მე მქვია ნინო. ვცხოვრობ თბილისში. ყოველ დილით ვსვამ ჩაის და თხუთმეტი წუთი ვსწავლობ ინგლისურს.',
    questionKa: 'რამდენ წუთს სწავლობს ნინო ინგლისურს ყოველ დილით?',
    options: ['15 წუთს', '5 წუთს', '30 წუთს', '60 წუთს'],
    correctAnswer: '15 წუთს',
  },
  {
    id: 'dial_shop',
    titleKa: 'მაღაზიაში საყიდლებზე',
    category: 'shopping',
    lines: [
      { speaker: 'Customer', en: 'Excuse me, how much is this bread?', ka: 'უკაცრავად, რა ღირს ეს პური?' },
      { speaker: 'Seller', en: 'It is two lari. Would you like anything else?', ka: 'ორი ლარი ღირს. კიდევ გნებავთ რამე?' },
      { speaker: 'Customer', en: 'Yes, one bottle of water, please.', ka: 'დიახ, ერთი ბოთლი წყალი, თუ შეიძლება.' },
    ],
    readingTextEn: 'Giorgi goes to the shop. He wants to buy bread, cheese, and two red apples.',
    readingTextKa: 'გიორგი მიდის მაღაზიაში. მას უნდა იყიდოს პური, ყველი და ორი წითელი ვაშლი.',
    questionKa: 'რა ფერის ვაშლი უნდა იყიდოს გიორგიმ?',
    options: ['წითელი', 'მწვანე', 'ყვითელი', 'თეთრი'],
    correctAnswer: 'წითელი',
  },
  {
    id: 'dial_dir',
    titleKa: 'გზის კითხვა',
    category: 'directions',
    lines: [
      { speaker: 'Tourist', en: 'Excuse me, where is the metro station?', ka: 'უკაცრავად, სად არის მეტროს სადგური?' },
      { speaker: 'Local', en: 'Go straight ahead and turn left at the bank.', ka: 'იარეთ პირდაპირ და ბანკთან შეუხვიეთ მარცხნივ.' },
      { speaker: 'Tourist', en: 'Thank you very much!', ka: 'დიდი მადლობა!' },
    ],
    readingTextEn: 'To get to the library, walk straight for two minutes and turn right near the park.',
    readingTextKa: 'ბიბლიოთეკამდე მისასვლელად იარეთ პირდაპირ ორი წუთი და პარკთან შეუხვიეთ მარჯვნივ.',
    questionKa: 'საით უნდა შეუხვიოთ პარკთან?',
    options: ['მარჯვნივ', 'მარცხნივ', 'უკან', 'ზემოთ'],
    correctAnswer: 'მარჯვნივ',
  },
  {
    id: 'dial_intro',
    titleKa: 'საკუთარი თავის წარდგენა',
    category: 'intro',
    lines: [
      { speaker: 'Luka', en: 'Hi! My name is Luka. Nice to meet you.', ka: 'გამარჯობა! მე მქვია ლუკა. სასიამოვნოა შენი გაცნობა.' },
      { speaker: 'Mariam', en: 'Nice to meet you too, Luka! Where are you from?', ka: 'ჩემთვისაც სასიამოვნოა, ლუკა! საიდან ხარ?' },
      { speaker: 'Luka', en: 'I am from Georgia. I am learning English.', ka: 'საქართველოდან ვარ. ინგლისურს ვსწავლობ.' },
    ],
    readingTextEn: 'Hello, I am Luka. I am twenty-five years old. I like reading books and learning new skills.',
    readingTextKa: 'გამარჯობა, მე ლუკა ვარ. 25 წლის ვარ. მიყვარს წიგნების კითხვა და ახალი უნარების სწავლა.',
    questionKa: 'რა უყვარს ლუკას?',
    options: ['წიგნების კითხვა და ახალი უნარების სწავლა', 'მხოლოდ სირბილი', 'თევზაობა', 'ცურვა'],
    correctAnswer: 'წიგნების კითხვა და ახალი უნარების სწავლა',
  },
];
