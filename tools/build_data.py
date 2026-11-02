"""Builds js/data.js for Master of Your Universe from tools/prompts.json plus the diorama layer.

Run:  python3 tools/build_data.py
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = json.loads((ROOT / "tools" / "prompts.json").read_text())

# ------------------------------------------------------------------ diorama look (one fixed camera for the whole game)
DIORAMA = (
    "Photorealistic architectural axonometric diorama render of one square section of a modern engineering office, "
    "sitting on a thin light-grey concrete plinth with a fine cyan edge line, floating on a seamless soft white-to-pale-grey "
    "studio background. Three-quarter isometric camera from the front-left at about 35 degrees elevation, the whole platform "
    "in frame and centred with generous margin, nothing cropped. Cutaway: no ceiling; low partial walls only on the back-left "
    "and back-right edges, with a slim black-framed window band on the back-right wall. Materials: pale white oak, matte white, "
    "warm-grey and sage-green felt, black powder-coated steel, light polished concrete floor. Soft natural daylight from the "
    "back-right, gentle realistic contact shadows, physically based materials, fine detail, like a premium V-Ray or Corona "
    "render for a workplace design pitch. No people, no text, no labels, no logos, no annotations, no callout lines."
)
KEEP = ("Keep the camera angle, the plinth, the walls, the background, the lighting and everything already on the platform "
        "exactly the same. Photorealistic, same render quality.")

MASTER = {"id": "DIO-EMPTY", "title": "Empty platform (generate first)", "mode": "generate",
          "prompt": DIORAMA + " The platform is completely empty: bare polished concrete floor, the two low walls and the window band only."}

LAYOUT_TEXT = {
    "s1.cluster.cocoon": "a team area for eight: eight compact 1.4 m oak desks in two facing rows of four, each wrapped on two sides by tall curved sage-green felt acoustic screens, open to the aisle, black mesh task chairs, one monitor per desk",
    "s1.cluster.pinwheel": "a team area for eight: eight compact desks arranged in a pinwheel around a central round white-oak storage drum topped with plants, each desk facing outward with low warm-grey felt screens between them",
    "s1.cluster.farm": "a team area for eight: one long solid white-oak farm table about 6 m long with black steel trestle legs, eight simple upholstered chairs, monitor arms and an integrated power rail",
    "s1.cluster.screened": "a team area for eight: two facing rows of four sit-stand bench desks at mixed heights, low frosted and felt screens between each position, one monitor per desk",
    "s1.cluster.focuspod": "a team area: a row of six compact desks, each with a three-sided tall navy and grey felt screen and a small task light, open at the back with no doors, still part of the open floor",
    "s1.cluster.moveit": "a team area for eight: light white-oak desks on visible castors with mobile pedestals, pushed loosely into a U shape for a team huddle, a mobile whiteboard closing the U",
    "s2.cafe.workcafe": "a workcafé: two long oak work tables with stools and power, a white coffee counter with an espresso machine along the back-left wall, pendant lights above the tables",
    "s2.cafe.clubhouse": "a clubhouse lounge: low navy and warm-grey sofas around a coffee table, a large wall TV on the back-left wall, a pool table with green felt in the middle",
    "s2.cafe.allday": "an all-day café: a white servery counter with breakfast dishes along the back-left wall, six small square oak tables with chairs in a flexible grid",
    "s2.cafe.pitstop": "a pit stop for engineers back from the site: glass-front grab-and-go fridges and a wall of navy charging lockers along the back-left wall, a long oak ledge bench with stools for writing up reports",
    "s3.room.booth": "a one-to-two-person acoustic phone booth in navy felt with a glass door, a small shelf and a stool inside, standing in the middle of the platform",
    "s3.room.four": "a small closed four-seat meeting room with glass walls on the front sides, a round oak table, four upholstered chairs and a wall screen",
    "s3.room.mid": "a closed six-to-eight-seat project room with glass front walls, a rectangular oak table, eight chairs and a wall screen",
    "s3.room.twelve": "a large twelve-seat meeting room with glass front walls, a long boat-shaped oak table, twelve chairs and a large video wall",
    "s3.room.huddle": "an open huddle: a curved high-backed sage-green bench forming most of a circle around a round oak table, open on the front side",
    "s3.room.flexi": "a flexi room with full-height sliding acoustic wall panels, partly slid open, an oak table on castors with chairs, ready to clear for ping-pong after hours",
}
STOP_OF = lambda oid: oid.split(".")[0]
layouts = [{"id": "DIO-" + oid.split(".")[0].upper() + "-" + oid.split(".")[-1].upper(), "option": oid,
            "title": next(o["label"] for o in src["options"] if o["id"] == oid), "mode": "edit", "from": "DIO-EMPTY",
            "prompt": f"Furnish this empty platform as {txt}. Use the whole platform sensibly. {KEEP}"}
           for oid, txt in LAYOUT_TEXT.items()]

# ------------------------------------------------------------------ where each pick lands (pins in % of the image) + edit wording
SLOTS = {
    "s1.near": [("along the back-left wall", 26, 34), ("along the back-right wall", 74, 32), ("at the front-left corner of the platform", 20, 68), ("at the front-right corner of the platform", 80, 68)],
    "s2.seat": [("in the front-left zone", 24, 66), ("along the front edge in the middle", 50, 77), ("in the front-right zone", 77, 66)],
    "s2.fun": [("in the right-middle zone", 72, 48), ("in the left-middle zone", 28, 50), ("in the centre", 50, 58)],
    "s2.work": [("against the back-left wall", 32, 30), ("against the back-right wall", 66, 28), ("along the left edge", 16, 48)],
}
FIXED_PIN = {"s1.cluster": (50, 52), "s1.desk": (60, 44), "s1.hood": (50, 26), "s2.cafe": (48, 44), "s2.next": (80, 34), "s3.room": (50, 50)}
KIT_PIN = {"video": (50, 30), "writingwall": (30, 38), "standing": (64, 60), "soft": (36, 62), "daylight": (72, 28), "sound": (42, 30), "purifier": (74, 56), "pinup": (24, 46)}

EDIT = {
    "s1.desk": "On every desk in the team area, add: {list}. Do not move or resize anything else.",
    "s1.hood": "Around the existing desk cluster, use the free floor near the back and the sides of the platform to add {list}. Keep the desk cluster exactly as it is.",
    "s1.near": "Add these items at these exact spots: {placed}. Keep everything else exactly as it is.",
    "s2.seat": "Add this seating at these exact spots: {placed}.",
    "s2.fun": "Add these at these exact spots: {placed}.",
    "s2.work": "Add these at these exact spots: {placed}.",
    "s2.next": "In the back-right corner of the platform, build {list}, with a low glass wall separating it from the café.",
    "s3.kit": "Inside the room, add {list}, each where it naturally belongs.",
}
FREE_TEXT_EDIT = "Also add, where it fits best: {text}."


# ------------------------------------------------------------------ player copy (written for the game, for Korean HR review)
COPY = {
 "s1.cluster": ("How should your team sit?", "One setup for eight people.", "PLACE IT"),
 "s1.desk": ("Make your desk yours", "Up to 3 things you'd want within reach.", "NEXT"),
 "s1.hood": ("What's around your team?", "The spaces next to your desks.", "NEXT"),
 "s1.near": ("What should be close by?", "Up to 4. Choose what you'd really use.", "FINISH THIS SPACE"),
 "s2.cafe": ("What should the café become?", "Busy at breakfast, quiet after. Change that.", "PLACE IT"),
 "s2.seat": ("Where would you sit?", "Up to 3.", "NEXT"),
 "s2.fun": ("How do you switch off?", "Up to 3.", "NEXT"),
 "s2.work": ("What makes it work?", "Up to 3.", "NEXT"),
 "s2.next": ("Add one room next door", "Pick 1.", "NEXT"),
 "s2.when": ("When would you come here?", "Pick all that apply.", "NEXT"),
 "s2.report": ("Would you write your site report here?", "With your team, after a customer visit.", "NEXT"),
 "s3.room": ("When your team meets, what fits best?", "Pick 1.", "PLACE IT"),
 "s3.length": ("How long do your meetings usually run?", "Pick 1.", "NEXT"),
 "s3.kit": ("What does the room need?", "Up to 3.", "FINISH THIS SPACE"),
 "close.productive": ("What would help you most at work?", "Pick 1.", "NEXT"),
 "close.favourite": ("Which space would change your day?", "We'll make a photo of it.", "THIS ONE"),
}
REPORT_OTHERS = ("Would you work here with your team?", "")
BENEFIT = {
 "s1.cluster.cocoon": "Curved screens cut noise", "s1.cluster.pinwheel": "Back to back, facing out", "s1.cluster.farm": "One long table, the whole team together",
 "s1.cluster.screened": "Sit or stand, a screen between you", "s1.cluster.focuspod": "A quiet bay for deep work", "s1.cluster.moveit": "On wheels, so the team can rearrange",
 "s1.desk.baghook": "Your bag off the floor", "s1.desk.accshelf": "Headphones and phone in reach", "s1.desk.shelving": "Files and kit at your side", "s1.desk.heightadj": "Sit or stand at a touch",
 "s1.desk.whiteboard": "Sketch an idea without leaving", "s1.desk.monitor": "Two screens, more room to work", "s1.desk.nameplate": "Your name, your spot", "s1.desk.smartdesk": "Remembers your height and light",
 "s1.hood.rooms": "Closed rooms right by your desks", "s1.hood.mix": "Fewer desks, more places to work", "s1.hood.break": "All that, plus a team break corner", "s1.hood.homebase": "A zone that's only your team's",
 "s1.near.lockers": "A safe spot for your things", "s1.near.writingwall": "Plan on the wall together", "s1.near.mobilewb": "Roll a board to wherever you meet", "s1.near.awards": "Show what the team has done",
 "s1.near.pinboard": "Notes and news for the team", "s1.near.plants": "Greener and calmer", "s1.near.phonebooth": "Private calls, next to the team", "s1.near.huddlescreen": "Quick stand-ups around a screen",
 "s1.near.kitstorage": "Tools and kit in one place", "s1.near.purifier": "Cleaner air all day", "s1.near.repairbar": "Fix and prep kit at a proper bench",
 "s2.cafe.workcafe": "Work tables, coffee and a games corner", "s2.cafe.clubhouse": "Sofas, a big TV and games", "s2.cafe.allday": "Breakfast, then work, then snacks", "s2.cafe.pitstop": "Land, eat and write up by the door",
 "s2.seat.longtables": "Plug in and spread out", "s2.seat.booths4": "A booth for four", "s2.seat.counter": "Perch by the window", "s2.seat.farm": "Sit together at one big table", "s2.seat.sofas": "Sink in and relax",
 "s2.seat.focuspod": "Close the door, get it done", "s2.seat.pod4": "A closed pod for four", "s2.seat.terrace": "Fresh air outside", "s2.seat.stepped": "Steps to sit on for team talks",
 "s2.fun.pool": "A classic after-work game", "s2.fun.foosball": "Fast games for two to four", "s2.fun.pingpong": "Get moving between tasks", "s2.fun.chess": "A quiet game of strategy",
 "s2.fun.puzzles": "Board games and puzzles to share", "s2.fun.tv": "Music or the match on a big screen", "s2.fun.videogame": "Consoles for a team game",
 "s2.work.charging": "Power at every seat", "s2.work.mobileboards": "Boards that roll to your table", "s2.work.sharescreen": "Share your laptop with the team", "s2.work.coffeebar": "Good coffee, close by",
 "s2.work.pantry": "Snacks when you need them", "s2.work.lockers": "Drop your kit by the door", "s2.work.purifier": "Cleaner air in the café",
 "s2.next.wellness": "A quiet room to reset", "s2.next.massage": "Massage chairs to unwind", "s2.next.showers": "Freshen up after the site", "s2.next.fitness": "A quick workout nearby",
 "s2.next.mothers": "A private, comfortable room", "s2.next.plantroom": "A green room to breathe",
 "s3.room.booth": "Calls and one-to-ones", "s3.room.four": "A small closed room with a screen", "s3.room.mid": "Room for a project group", "s3.room.twelve": "The whole team around one table",
 "s3.room.huddle": "A half-open pod by your desks", "s3.room.flexi": "Meetings by day, ping-pong after",
 "s3.kit.video": "Clear calls with overseas teams", "s3.kit.writingwall": "Sketch it out together", "s3.kit.standing": "Short, focused stand-ups", "s3.kit.soft": "Relaxed seats for easy talks",
 "s3.kit.daylight": "Natural light all day", "s3.kit.sound": "Talk without being overheard", "s3.kit.purifier": "Fresh air in long meetings", "s3.kit.pinup": "Pin up the week's work",
}
NAME_FIX = {"s3.room.booth": "Phone booth", "s3.room.mid": "Mid room", "close.favourite.s2": "My café"}

# ------------------------------------------------------------------ extras from the WIP deck
VERBS = {"s2.cafe.workcafe": "work · meet · play", "s2.cafe.clubhouse": "relax · watch · play", "s2.cafe.allday": "eat · work · unwind", "s2.cafe.pitstop": "land · eat · write up"}
DESK_CHIP = {"s1.cluster.cocoon": "1.4 × 0.7 m", "s1.cluster.pinwheel": "1.4 × 0.7 m", "s1.cluster.farm": "1.0 m a seat",
             "s1.cluster.screened": "1.6 × 0.75 m", "s1.cluster.focuspod": "1.4 × 0.7 m", "s1.cluster.moveit": "1.2 × 0.6 m"}
COST = {"s1.near.phonebooth": 2, "s1.near.repairbar": 2, "s1.near.kitstorage": 2, "s1.near.huddlescreen": 2,
        "s2.seat.pod4": 3, "s2.seat.terrace": 3, "s2.seat.stepped": 2, "s2.seat.booths4": 2, "s2.fun.pool": 2, "s2.fun.pingpong": 2,
        "s2.next.showers": 3, "s2.next.fitness": 3, "s2.next.massage": 2,
        "s3.room.booth": 1, "s3.room.four": 2, "s3.room.mid": 3, "s3.room.twelve": 4, "s3.room.huddle": 1, "s3.room.flexi": 3}
BUDGET = {"s1": 9, "s2": 12, "s3": 7}
HINT = {
    "s1.cluster": "A cluster is a group of desks for one team. Each shows its desk size: today's desks are 1.65 × 0.75 m.",
    "s1.desk": "This is where “the desk is home” lives: personal touches stay, even on a smaller or team desk.",
    "s1.hood": "The area around your team's desks, with the spaces your team needs. Each step up adds more choice.",
    "s1.near": "A cap makes it a choice, not a wish list.",
    "s2.cafe": "“The café is busy at breakfast and quiet the rest of the day. Make it the place you come back to after the site.”",
    "s2.seat": "Where you sit in the café.", "s2.fun": "Games are driving huge engagement in other offices.", "s2.work": "What makes it work for you.",
    "s2.next": "One room right next door.", "s2.when": "When would you use it?", "s2.report": "This is the key question.",
    "s3.room": "The game asks what you need. Room counts still come from booking data.", "s3.length": "Your usual meeting.",
    "s3.kit": "What makes the room work.", "close.productive": "One last thing before the reveal.",
    "close.favourite": "Your three stops, side by side. Tap the one that would change your day most.",
}

FINAL = ("Turn this axonometric diorama into a photorealistic eye-level interior photograph of the same space, as if standing "
         "inside it. Keep every piece of furniture, its material, colour and position from the diorama. Remove the plinth and the "
         "studio background: it becomes a real room in a newly completed engineering office in Gyeonggi-do, South Korea, with "
         "floor-to-ceiling windows, white-painted exposed concrete ceiling with linear LED lights, and distant green hills outside. ")

data = {
    "version": "2026-11-03",
    "steps": src["steps"], "options": src["options"], "library": src["images"], "style": src["style"],
    "diorama": {"look": DIORAMA, "keep": KEEP, "master": MASTER, "layouts": layouts},
    "slots": {k: [{"loc": l, "x": x, "y": y} for l, x, y in v] for k, v in SLOTS.items()},
    "fixedPin": {k: {"x": x, "y": y} for k, (x, y) in FIXED_PIN.items()},
    "kitPin": {k: {"x": x, "y": y} for k, (x, y) in KIT_PIN.items()},
    "edit": EDIT, "freeTextEdit": FREE_TEXT_EDIT, "final": FINAL,
    "copy": {k: {"title": t, "sub": u, "button": b} for k, (t, u, b) in COPY.items()}, "reportOthers": {"title": REPORT_OTHERS[0], "sub": REPORT_OTHERS[1]},
    "benefit": BENEFIT, "nameFix": NAME_FIX,
    "verbs": VERBS, "deskChip": DESK_CHIP, "cost": COST, "budget": BUDGET, "hint": HINT,
}
out = ROOT / "js" / "data.js"
out.parent.mkdir(exist_ok=True)
out.write_text("// Generated by tools/build_data.py. Edit that file, not this one.\nwindow.GAME_DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
print("wrote", out, len(layouts) + 1, "diorama prompts,", len(src["options"]), "options")
