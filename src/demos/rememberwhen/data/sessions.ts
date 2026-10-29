// Nell's conversation history with Andrew: one call most weeks, three of them replayable
// with a timed transcript and the facts the system took from them. All invented.

import { NODES } from './graph'
import { dateInWeek } from './resident'
import type { CallDetail, Session, Turn } from './types'

type SessionRow = [week: number, title: string, duration: number, status: Session['status'], summary: string]

const ROWS: SessionRow[] = [
  [1, 'A girl from Two Harbors', 1180, 'completed', 'First call. Nell introduced her family: her parents on the ore docks, her sister Solveig, Gus, and the children.'],
  [2, 'The bookmobile years', 1320, 'completed', 'Twenty-one years on the Blue Earth County bookmobile, and moving the family to Mankato in 1967.'],
  [3, "Grandma Berit's kitchen", 1040, 'completed', 'Saturday lefse, the blizzard of 1949, and her college roommate June.'],
  [4, 'Lincoln Elementary and the duplex', 960, 'completed', 'Teaching second grade in St. Cloud, Annika born in an ice storm, and the grandchildren.'],
  [5, 'Marlys and the date stamps', 1100, 'completed', 'Her bookmobile partner Marlys, the Fourth of July fish fry, and moving to Rochester.'],
  [6, 'Tess and the Fourth of July', 870, 'completed', 'Her retirement quilt, the sauna by the shore, and Tess’s husband Ben.'],
  [7, 'June Pellegrino’s piano', 940, 'completed', 'Rooming-house days in Duluth, the summer reading club, and her eightieth birthday.'],
  [8, "Annika's wedding", 820, 'completed', 'Hemming a wedding dress the night before, the Pickwick, and the choir director Walt.'],
  [9, "Gus's last summer", 760, 'completed', 'A gentle conversation about Gus’s last summer at the lake and losing him in 2011.'],
  [10, 'The flood of ’65', 880, 'completed', 'Sandbagging in St. Cloud, Pleasant Valley School, and Gus’s memorial.'],
  [11, 'Grandma Bookmobile', 790, 'completed', 'Grandson Nils in Bemidji, the Tuesday Coffee Circle, and the library book sale.'],
  [12, 'Call did not connect', 0, 'failed', 'The call rang without an answer.'],
  [13, 'Selling Hubbard Avenue', 720, 'completed', 'Selling the Mankato house, keeping a lilac cutting, and Solveig’s husband Rolf.'],
  [14, 'The storm that took the dock', 810, 'completed', 'Rebuilding the cabin dock in a weekend, and Uncle Torvald’s fiddle.'],
  [15, 'Glenwood and granite', 650, 'completed', "Visiting Gus's grave and the horehound candy at Lindahl's Grocery."],
  [16, 'Handing over the cabin keys', 700, 'completed', 'Giving the cabin to Annika and Mark, and Peter’s science-fair radio.'],
  [18, 'Karl at the cabin', 690, 'completed', 'Karl’s August visits and Gus’s family from Värmland.'],
  [19, 'Tess in Minneapolis', 640, 'completed', 'Tess’s monthly visits and Sunday phone calls with Solveig.'],
  [20, 'A short hello', 214, 'ended', 'Ended early; her daughter had arrived to visit. She mentioned Gus’s woodshop.'],
  [21, 'St. Olaf at Christmas', 610, 'completed', 'The St. Olaf Christmas Festival with Tess.'],
  [22, 'Lefse on Saturday mornings', 212, 'completed', 'Rolling lefse with Grandma Berit, the church Christmas bazaar, and the feud with Hilda Aune.'],
  [24, 'Second prize for rhubarb pie', 560, 'completed', 'The county fair pie contest and a judge she has not forgiven.'],
  [25, "Elsa's baptism", 590, 'completed', "Holding Elsa at her baptism and Kirsten's graduation."],
  [26, 'The Gray Lady on Lake Vermilion', 205, 'completed', 'Evening paddles in Gus’s canoe and Leif’s first walleye.'],
  [27, 'The Fitzgerald on the radio', 600, 'completed', 'Hearing about the Edmund Fitzgerald and phoning her father; the farmers market rhubarb.'],
  [28, 'The garden club', 570, 'completed', 'Taking charge of the rhubarb patch in the Cedar Hollow garden club.'],
  [29, 'The fall concert', 520, 'completed', 'Singing alto in the residents’ choir at the fall concert.'],
  [30, 'Stuck on County Road 9', 425, 'completed', 'The January 1971 day the bookmobile slid into a ditch, Danny Prescott and his dinosaur books, and a request about her window.'],
]

const REPLAYABLE = new Set([22, 26, 30])

export const SESSIONS: Session[] = ROWS.map(([week, title, duration, status, summary], i) => ({
  number: i + 1,
  call_id: `call-${String(i + 1).padStart(3, '0')}`,
  date: dateInWeek(week),
  week,
  title,
  duration_seconds: duration,
  status,
  summary,
  memories_added: status === 'failed' ? 0 : NODES.filter((n) => n.first_seen_week === week).length,
  replayable: REPLAYABLE.has(week),
}))

const callId = (week: number) => SESSIONS.find((s) => s.week === week)!.call_id

type TurnRow = [role: 'A' | 'U', text: string, offset_s: number]

function turns(rows: TurnRow[]): Turn[] {
  return rows.map(([r, text, s], i) => ({ seq: i + 1, role: r === 'A' ? 'assistant' : 'user', text, offset_ms: Math.round(s * 1000) }))
}

// ---------------------------------------------------------------- featured: week 30

const FEATURED: TurnRow[] = [
  ['A', "Good morning, Nell. It's Andrew. Is this still a good time to talk?", 0],
  ['U', "Oh, Andrew. Yes, I've got my coffee. Black, like always.", 5.2],
  ['A', "Then I'll keep you company while it's hot. Last time you told me about singing alto at the fall concert. What's on your mind this morning?", 11],
  ['U', "Well, it snowed up north last night. Annika called to tell me. And I thought, oh, that's bookmobile weather.", 19.5],
  ['A', 'Bookmobile weather. Tell me what that means.', 30.5],
  ['U', "It means you check the chains before you leave the garage, and you pack a thermos, and you say a little prayer even if you're a Lutheran who doesn't like to bother anybody.", 36],
  ['A', 'You told me once that Marlys Tiegs rode along with you and kept the date stamps in her apron. Was she with you on the snowy days too?', 52],
  ['U', "Oh, every day. Marlys never missed. She said the bookmobile was warmer than her house, and she wasn't wrong.", 63],
  ['A', 'Was there one winter day that stands out?', 75.5],
  ['U', "January of seventy-one. We had no business being out. But the Prescott boy was waiting on a book about dinosaurs, and I'd promised him.", 80.5],
  ['A', 'Who was the Prescott boy?', 95],
  ['U', 'Danny Prescott. Nine years old, farm out past Good Thunder. He read every dinosaur book we carried, and then he’d ask me to bring the same ones back.', 99],
  ['A', 'Every one of them. He sounds like a reader.', 116],
  ['U', 'He was. So off we went. County Road 9 was nothing but white. And about a mile from the Prescott lane, the back end just... went.', 121],
  ['A', 'Went where?', 140],
  ['U', "Into the ditch! Slow as you please. Books sliding off the shelves, Marlys hollering, and me laughing, I don't know why. I couldn't stop.", 143],
  ['A', 'Laughing in a ditch in January. What happened next?', 161],
  ['U', "We sat there maybe twenty minutes. Then here comes a tractor over the hill. Elmer Prescott, Danny's father. He'd seen us from the barn.", 166],
  ['A', 'Elmer saw you from the barn and came with the tractor.', 185],
  ['U', "A John Deere, green as a pickle. He hooked a chain on and pulled us out like we were nothing. And he wouldn't take a dime. Said the books were payment enough.", 190],
  ['A', 'Did Danny get his dinosaur book?', 209],
  ['U', "He did. He was standing at the end of the lane in a snowsuit two sizes too big. I'll never forget that. Just this little red snowsuit in all that white.", 213],
  ['A', "A little red snowsuit in all that white. That's a picture.", 231],
  ['U', 'It is. I can see it right now.', 236],
  ['A', 'You told me earlier about Pleasant Valley, the one-room school on your route. Did Danny go there?', 241],
  ['U', "He did, yes. Mrs. Olstad was the teacher. She'd send a list of what the children wanted and I'd try to fill it.", 251],
  ['A', 'Filling a list for a whole school. Did you ever hear what became of Danny?', 266],
  ['U', 'Oh, I did! He became a science teacher in Mankato. He came to my retirement party and brought a fossil. A real one. I still have it somewhere.', 272],
  ['A', 'That fits. You started the summer reading club with a paper star for every ten books. I’d guess Danny earned a few.', 293],
  ['U', 'Ha! He papered the side of the bookmobile with them. Marlys ran out of stars.', 302],
  ['A', "Ran out of stars. That's a good problem to have.", 311],
  ['U', 'It was. You know, talking about the snow, I keep thinking about the cold. Not in a bad way.', 316],
  ['A', 'How do you mean?', 329],
  ['U', 'At the lake, Gus always slept with the window open. Even in October. I got used to it. Here they keep it so warm, I lie awake. I sleep better with a little cold air, like at the lake. Could somebody open my window a crack?', 332],
  ['A', "That sounds like a fair thing to ask. I'll pass it along so someone can help with your window.", 358],
  ['U', "Thank you. Don't make a fuss. Just a crack.", 366],
  ['A', 'Just a crack. Before we finish, is there anything else from that winter you’d like to remember?', 372],
  ['U', 'Only that I never once missed a stop that whole winter. Not one. Marlys said I was stubborn. I said I was punctual.', 379],
  ['A', "Stubborn and punctual. I'll remember that, Nell. Thank you for the ride down County Road 9.", 397],
  ['U', 'Thank you, Andrew. Call me Thursday? After the hymn sing.', 405],
  ['A', 'Thursday after the hymn sing. Enjoy your coffee.', 413],
]

// ---------------------------------------------------------------- week 22

const LEFSE: TurnRow[] = [
  ['A', "Hello, Nell, it's Andrew. How's your Wednesday going?", 0],
  ['U', "Slow. They had pancakes this morning and they weren't a patch on lefse.", 6],
  ['A', 'You told me your grandmother Berit made lefse every Saturday. Did you help her?', 16],
  ['U', "Help her! I was the roller. Grandma did the griddle. You have to roll it so thin you can read the newspaper through it. That was her test.", 24],
  ['A', 'Thin enough to read through. Who else was in the kitchen?', 48],
  ['U', 'Solveig, mostly underfoot. She’d steal the first one off the griddle every time, and Grandma pretended not to see.', 54],
  ['A', "Solveig still calls you on Sundays, doesn't she?", 75],
  ['U', "Every Sunday at four. She's eighty-four and still steals the last cookie.", 80],
  ['A', "Some things don't change. Did the lefse ever leave the house?", 96],
  ['U', 'Every December, for the Christmas bazaar at First Lutheran. Grandma sold it by the dozen, wrapped in wax paper with a ribbon.', 102],
  ['A', 'Was it popular?', 126],
  ['U', "Mostly. Except Hilda Aune from next door also made lefse, and she said ours was too thick. Too thick! Grandma didn't speak to her until Easter.", 131],
  ['A', "Until Easter. That's a serious lefse disagreement.", 160],
  ['U', "It was a serious town. But Hilda brought a pan of bars over that spring, and that was the end of it. That's how it went then.", 166],
  ['A', 'A pan of bars to make peace. Thank you for the kitchen today, Nell. Same time next week?', 196],
  ['U', 'Same time. Bring your appetite.', 205],
]

// ---------------------------------------------------------------- week 26

const GRAY_LADY: TurnRow[] = [
  ['A', "Good afternoon, Nell. It's Andrew.", 0],
  ['U', "Andrew! I was just watching the geese go over. They're early this year.", 4],
  ['A', 'Geese heading south already. Does that put you in mind of anywhere?', 12],
  ['U', 'The lake. Always the lake. This time of year Gus would be pulling the dock in and grumbling about it.', 18],
  ['A', "You've told me Gus built the cabin at Pike Bay with Karl's help, over three summers. What was your favorite part of the day there?", 33],
  ['U', "Evenings. After supper Gus would say 'Gray Lady?' and that meant the canoe. We'd paddle out past the point and just sit and listen to the loons.", 44],
  ['A', "The Gray Lady. Was that the canoe's name?", 70],
  ['U', 'Gray canvas, green trim. He named her after his mother, though he never told his mother that.', 75],
  ['A', "That's a well-kept secret. Did the grandchildren go out in her too?", 91],
  ['U', "Leif did. Annika's boy. The summer he was nine he caught his first walleye right off the dock, and he wouldn't let anyone clean it. He wanted to keep it in the freezer forever.", 97],
  ['A', 'Forever in the freezer. Did it stay there?', 124],
  ['U', 'Until Labor Day. Gus fried it and told Leif it was a different fish. Leif knew. He still brings it up.', 129],
  ['A', 'Where did you get your bait in those days?', 150],
  ['U', 'Vermilion Bait and Tackle, in Tower. The fellow there always saved Gus the best minnows. I think Gus paid him in rhubarb pie.', 155],
  ['A', 'Rhubarb pie as currency. That sounds like you.', 177],
  ['U', "It worked, didn't it?", 183],
  ['A', 'It did. Thank you for taking me out on the Gray Lady today, Nell.', 188],
  ['U', 'Anytime. Mind the loons.', 196],
]

export const CALLS: Record<string, CallDetail> = {
  [callId(30)]: {
    call_id: callId(30),
    turns: turns(FEATURED),
    events: [
      { kind: 'recalled', label: 'Marlys Tiegs rode the bookmobile and kept the date stamps', note: 'You told me once that Marlys Tiegs rode along with you and kept the date stamps in her apron.', predicate: 'participated_in', entities: [{ name: 'marlys tiegs', kind: 'person', novelty: 'matched' }, { name: 'bookmobile routes', kind: 'event', novelty: 'matched' }], created_entity: false, message_seq: 7 },
      { kind: 'captured', label: 'Danny Prescott, a boy on her route, read every dinosaur book', predicate: 'knows', entities: [{ name: 'danny prescott', kind: 'person', novelty: 'new' }, { name: 'good thunder, minnesota', kind: 'place', novelty: 'matched' }], created_entity: true, message_seq: 12 },
      { kind: 'captured', label: 'The bookmobile slid into a ditch on County Road 9 in January 1971', predicate: 'participated_in', entities: [{ name: 'stuck on county road 9', kind: 'event', novelty: 'new' }, { name: 'marlys tiegs', kind: 'person', novelty: 'matched' }], created_entity: true, message_seq: 16 },
      { kind: 'captured', label: 'Elmer Prescott, Danny’s father, pulled them out with his tractor', predicate: 'has_parent', entities: [{ name: 'elmer prescott', kind: 'person', novelty: 'new' }, { name: 'danny prescott', kind: 'person', novelty: 'new' }], created_entity: true, message_seq: 18 },
      { kind: 'recalled', label: 'Pleasant Valley, the one-room school on her route', note: 'You told me earlier about Pleasant Valley, the one-room school on your route.', predicate: 'related_to', entities: [{ name: 'pleasant valley school', kind: 'organization', novelty: 'matched' }], created_entity: false, message_seq: 25 },
      { kind: 'captured', label: 'Danny attended Pleasant Valley School', predicate: 'attended_school', entities: [{ name: 'danny prescott', kind: 'person', novelty: 'new' }, { name: 'pleasant valley school', kind: 'organization', novelty: 'matched' }], created_entity: false, message_seq: 26 },
      { kind: 'captured', label: 'Danny came to her library retirement party with a fossil', predicate: 'attended', entities: [{ name: 'danny prescott', kind: 'person', novelty: 'new' }, { name: 'retirement from the library', kind: 'event', novelty: 'matched' }], created_entity: false, message_seq: 28 },
      { kind: 'recalled', label: 'The summer reading club and its paper stars', note: 'You started the summer reading club with a paper star for every ten books.', predicate: 'participated_in', entities: [{ name: 'summer reading club', kind: 'event', novelty: 'matched' }], created_entity: false, message_seq: 29 },
      { kind: 'signal', label: 'Asked for her window to be opened a crack at night', note: 'I sleep better with a little cold air, like at the lake. Could somebody open my window a crack?', predicate: 'request', entities: [{ name: 'the cabin at pike bay', kind: 'place', novelty: 'matched' }], created_entity: false, message_seq: 34 },
      { kind: 'captured', label: 'Never missed a bookmobile stop that winter', predicate: 'participated_in', entities: [{ name: 'bookmobile routes', kind: 'event', novelty: 'matched' }, { name: 'marlys tiegs', kind: 'person', novelty: 'matched' }], created_entity: false, message_seq: 38 },
    ],
  },
  [callId(22)]: {
    call_id: callId(22),
    turns: turns(LEFSE),
    events: [
      { kind: 'recalled', label: 'Grandma Berit made lefse every Saturday', note: 'You told me your grandmother Berit made lefse every Saturday.', predicate: 'participated_in', entities: [{ name: 'berit halvorsen', kind: 'person', novelty: 'matched' }, { name: 'saturday lefse baking', kind: 'event', novelty: 'matched' }], created_entity: false, message_seq: 3 },
      { kind: 'recalled', label: 'Solveig calls every Sunday', note: "Solveig still calls you on Sundays, doesn't she?", predicate: 'has_sibling', entities: [{ name: 'solveig halvorsen', kind: 'person', novelty: 'matched' }], created_entity: false, message_seq: 7 },
      { kind: 'captured', label: 'Grandma Berit sold lefse at the First Lutheran Christmas bazaar', predicate: 'participated_in', entities: [{ name: 'the christmas bazaar', kind: 'event', novelty: 'new' }, { name: 'first lutheran church', kind: 'organization', novelty: 'matched' }], created_entity: true, message_seq: 10 },
      { kind: 'captured', label: 'Hilda Aune next door said their lefse was too thick', predicate: 'knows', entities: [{ name: 'hilda aune', kind: 'person', novelty: 'new' }, { name: 'berit halvorsen', kind: 'person', novelty: 'matched' }], created_entity: true, message_seq: 12 },
      { kind: 'captured', label: 'Hilda made peace with a pan of bars', predicate: 'knows', entities: [{ name: 'hilda aune', kind: 'person', novelty: 'new' }], created_entity: false, message_seq: 14 },
    ],
  },
  [callId(26)]: {
    call_id: callId(26),
    turns: turns(GRAY_LADY),
    events: [
      { kind: 'recalled', label: 'Gus built the cabin at Pike Bay with Karl', note: "You've told me Gus built the cabin at Pike Bay with Karl's help, over three summers.", predicate: 'related_to', entities: [{ name: 'the cabin at pike bay', kind: 'place', novelty: 'matched' }, { name: 'karl halvorsen', kind: 'person', novelty: 'matched' }], created_entity: false, message_seq: 5 },
      { kind: 'captured', label: 'Evening paddles in the Gray Lady to listen to the loons', predicate: 'participated_in', entities: [{ name: 'paddling the gray lady', kind: 'event', novelty: 'matched' }, { name: 'gus lindqvist', kind: 'person', novelty: 'matched' }], created_entity: false, message_seq: 6 },
      { kind: 'captured', label: "Leif caught his first walleye off the dock at nine", predicate: 'participated_in', entities: [{ name: "leif's first walleye", kind: 'event', novelty: 'new' }, { name: 'leif', kind: 'person', novelty: 'matched' }], created_entity: true, message_seq: 10 },
      { kind: 'captured', label: 'Gus fried the walleye on Labor Day', predicate: 'participated_in', entities: [{ name: 'gus lindqvist', kind: 'person', novelty: 'matched' }, { name: "leif's first walleye", kind: 'event', novelty: 'new' }], created_entity: false, message_seq: 12 },
      { kind: 'captured', label: 'Bait from Vermilion Bait and Tackle in Tower', predicate: 'related_to', entities: [{ name: 'vermilion bait and tackle', kind: 'organization', novelty: 'matched' }, { name: 'tower, minnesota', kind: 'place', novelty: 'matched' }], created_entity: false, message_seq: 14 },
    ],
  },
}

export const FEATURED_CALL_ID = callId(30)
