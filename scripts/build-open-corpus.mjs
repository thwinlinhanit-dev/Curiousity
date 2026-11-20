// Seed the remixable tier: 20 original short lessons under CC BY 4.0.
// Text is authored here, not copied from the CC BY-NC corpus. Facts are basic,
// well-established material from public-domain sources (Euclid, Archimedes,
// Newton, standard SI definitions); each lesson names its source.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dir = path.join(root, "content/open/lessons");
fs.mkdirSync(dir, { recursive: true });

const lessons = [
  ["whole-numbers", "Whole numbers and place value", "math", "arith1", "A digit's value depends on its place: in 507 the 5 means five hundred. Zero holds the empty place.", "507 = 500 + 0 + 7", "Reading 507 as 'five hundred and seven' is right; reading the 5 as five is wrong.", "Standard decimal notation"],
  ["addition-carry", "Addition with carrying", "math", "arith1", "When a column totals ten or more, write the ones digit and carry the tens to the next column.", "48 + 37: 8+7=15, write 5 carry 1; 4+3+1=8, so 85", "Forgetting the carried 1 gives 75.", "Standard algorithm"],
  ["subtraction-borrow", "Subtraction with borrowing", "math", "arith1", "If the top digit is smaller, borrow one ten from the column to the left.", "52 − 27: borrow to make 12 − 7 = 5, then 4 − 2 = 2, so 25", "Subtracting 7 from 2 directly gives a negative digit.", "Standard algorithm"],
  ["multiplication", "Multiplication as repeated addition", "math", "arith1", "4 × 3 means four groups of three. The order does not change the product.", "4 × 3 = 3 + 3 + 3 + 3 = 12", "Thinking 4 × 3 means 4 + 3.", "Elementary arithmetic"],
  ["division", "Division as sharing", "math", "arith1", "12 ÷ 4 asks how many groups of four make twelve. The answer is three.", "12 ÷ 4 = 3 because 3 × 4 = 12", "Dividing 12 by 4 and getting 48 (that is multiplying).", "Elementary arithmetic"],
  ["fractions", "Fractions of a whole", "math", "arith1", "The denominator says how many equal parts; the numerator says how many you have.", "3/4 means three of four equal parts", "Thinking the larger denominator makes the larger fraction.", "Euclid, Elements, Book V (basic ratio idea)"],
  ["decimals", "Decimals and tenths", "math", "arith1", "The first digit after the point counts tenths, the second hundredths.", "0.25 = 25/100 = 1/4", "Reading 0.25 as twenty-five whole units.", "Standard decimal notation"],
  ["perimeter", "Perimeter of a rectangle", "math", "geometry1", "Perimeter is the distance around a shape. Add all four sides.", "A 3 m by 5 m rectangle has perimeter 3+5+3+5 = 16 m", "Using 3 × 5, which is the area.", "Euclid, Elements, Book I"],
  ["area", "Area of a rectangle", "math", "geometry1", "Area counts the unit squares that fit inside: length × width.", "A 3 m by 5 m rectangle has area 15 m²", "Adding the sides instead of multiplying.", "Euclid, Elements, Book I"],
  ["triangles", "Angles in a triangle", "math", "geometry1", "The three interior angles of a triangle add to 180 degrees.", "60° + 60° + 60° = 180°", "Assuming every triangle has a right angle.", "Euclid, Elements, Book I, Prop. 32"],
  ["pythagoras", "The Pythagorean theorem", "math", "geometry1", "In a right triangle the square on the hypotenuse equals the sum of the squares on the other two sides.", "3² + 4² = 9 + 16 = 25 = 5²", "Applying it to a triangle with no right angle.", "Euclid, Elements, Book I, Prop. 47"],
  [" Circles", "Circumference and π", "math", "geometry1", "The circumference divided by the diameter is the same number for every circle: π ≈ 3.14159.", "A circle of diameter 2 m has circumference about 6.28 m", "Using the radius where the formula needs the diameter.", "Archimedes, Measurement of a Circle"],
  ["speed", "Speed, distance and time", "physics", "phys1", "Average speed is distance divided by time. Units matter.", "60 km in 2 h gives 30 km/h", "Multiplying distance by time.", "Galileo, Two New Sciences"],
  ["force", "Newton's second law", "physics", "phys1", "Acceleration equals net force divided by mass: a = F/m.", "A 20 N net force on a 4 kg mass gives 5 m/s²", "Ignoring friction when finding the net force.", "Newton, Principia"],
  ["energy", "Kinetic energy", "physics", "phys1", "A moving object's kinetic energy is ½mv²; doubling speed quadruples it.", "A 2 kg mass at 3 m/s has 9 J", "Forgetting that the speed is squared.", "Classical mechanics"],
  ["gravity", "Weight versus mass", "physics", "phys1", "Mass is how much matter an object has; weight is the gravitational force on it.", "A 10 kg mass weighs about 98 N on Earth", "Using kilograms as a unit of force.", "Newton, Principia"],
  ["atoms", "Atoms and elements", "chemistry", "chem1", "An element is defined by its number of protons; atoms of the same element can differ in neutrons.", "Carbon always has 6 protons", "Confusing atomic number with atomic mass.", "Dalton, Atomic Theory (1808)"],
  ["conservation", "Conservation of mass", "chemistry", "chem1", "In a closed system matter is neither created nor destroyed by a chemical reaction.", "The total mass before and after a reaction is equal", "Ignoring gases that escape an open container.", "Lavoisier, Traité Élémentaire de Chimie"],
  ["cells", "Cells as the unit of life", "biology", "bio1", "All living things are made of cells; cells arise from other cells.", "A bacterium is one cell; a human has trillions", "Thinking a virus is a cell.", "Virchow, Cellular Pathology (1858)"],
  ["photosynthesis", "Photosynthesis", "biology", "bio1", "Plants use light energy to turn carbon dioxide and water into sugars, releasing oxygen.", "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "Thinking plants get their mass mainly from soil.", "Priestley, Experiments on Air (1770s)"],
];

const out = [];
for (const [id, title, ladder, course, concept, example, mistake, source] of lessons) {
  const key = `open.${id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const bundle = {
    id: key, slug: id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"), title, course, ladder,
    source: source,
    license: "CC BY 4.0 — original wording authored for Curiousity",
    sources: [{ title: source, license: "public domain / CC BY 4.0" }],
    blocks: [
      { t: "key", html: `<p>${concept}</p>` },
      { t: "worked", html: `<p><b>Example:</b> ${example}</p>` },
      { t: "mistake", html: `<p><b>Common mistake:</b> ${mistake}</p>` },
    ],
  };
  fs.writeFileSync(path.join(dir, `${bundle.slug}.json`), `${JSON.stringify(bundle, null, 0)}\n`);
  out.push({ id: key, title, ladder });
}
fs.writeFileSync(path.join(root, "content/open/index.json"), `${JSON.stringify({ license: "CC BY 4.0", count: out.length, lessons: out }, null, 2)}\n`);
console.log(`open corpus: ${out.length} CC BY lessons`);
