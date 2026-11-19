// Offline proof-of-pipeline: translate the 12-topic kinematics chapter into
// Spanish. Preserves $...$ math, \role{...}{...} markup and HTML tags.
// This is a deterministic phrase dictionary — not a runtime LLM.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const KEYS = path.join(ROOT, "content/i18n/keys");
const OUT = path.join(ROOT, "content/i18n/es/topics");
fs.mkdirSync(OUT, { recursive: true });

const slugs = [
  "dimensional-analysis", "position-displacement", "average-velocity", "position-time-graphs",
  "instantaneous-velocity", "acceleration", "velocity-time-graphs", "motion-graph-translation",
  "kinematic-equations", "kinematics-without-time", "free-fall", "vertical-launch",
];

const phrases = [
  ["Every term in a physics equation must have the same units, which catches many mistakes before they happen.", "Cada término de una ecuación física debe tener las mismas unidades, lo que detecta muchos errores antes de que ocurran."],
  ["Students add quantities with different units, or keep an answer whose units show the formula was misremembered.", "Los estudiantes suman cantidades con unidades distintas o conservan una respuesta cuyas unidades muestran que la fórmula estaba mal recordada."],
  ["Pick an origin and a positive direction; displacement", "Elige un origen y una dirección positiva; el desplazamiento"],
  ["carries a sign.", "lleva un signo."],
  ["Students compute displacement as the total distance traveled, ignoring a change of direction.", "Los estudiantes calculan el desplazamiento como la distancia total recorrida, ignorando un cambio de dirección."],
  ["Average velocity is", "La velocidad media es"],
  ["with a sign; average speed uses total distance instead.", "con signo; la rapidez media usa la distancia total."],
  ["Students find average velocity by averaging the starting and ending speeds even when the acceleration changes.", "Los estudiantes hallan la velocidad media promediando las rapeces inicial y final incluso cuando la aceleración cambia."],
  ["The slope of an", "La pendiente de una gráfica"],
  ["graph is the velocity.", "es la velocidad."],
  ["Students read a high point on the graph as a high speed, mixing up the value with the slope.", "Los estudiantes leen un punto alto de la gráfica como una rapidez alta, confundiendo el valor con la pendiente."],
  ["The velocity at an instant is the slope of the tangent line to the", "La velocidad en un instante es la pendiente de la recta tangente a la gráfica"],
  ["Students think an object at x = 0 must have zero velocity, mixing up position with velocity.", "Los estudiantes creen que un objeto en x = 0 debe tener velocidad cero, confundiendo posición con velocidad."],
  ["an object slows down when its acceleration points opposite to its velocity.", "un objeto disminuye su rapidez cuando su aceleración apunta en dirección opuesta a su velocidad."],
  ["Students think negative acceleration always means slowing down.", "Los estudiantes creen que una aceleración negativa siempre significa frenar."],
  ["On a v–t graph the slope is the acceleration and the area under the line is the displacement", "En una gráfica v–t la pendiente es la aceleración y el área bajo la recta es el desplazamiento"],
  ["Students read a v–t graph as if it showed position, thinking a downward slope means moving down.", "Los estudiantes leen una gráfica v–t como si mostrara posición, pensando que una pendiente descendente significa moverse hacia abajo."],
  ["Turn an x–t graph into v–t and a–t graphs, and back again.", "Convierte una gráfica x–t en gráficas v–t y a–t, y viceversa."],
  ["Students copy the shape of one graph onto the next instead of tracking slopes.", "Los estudiantes copian la forma de una gráfica a la siguiente en lugar de seguir las pendientes."],
  ["hold when the acceleration is constant.", "se cumplen cuando la aceleración es constante."],
  ["Students use these equations even when the acceleration changes partway through the motion.", "Los estudiantes usan estas ecuaciones incluso cuando la aceleración cambia durante el movimiento."],
  ["links speeds and displacement when the time isn't known.", "relaciona rapideces y desplazamiento cuando no se conoce el tiempo."],
  ["Students forget the 2, or take a square root and lose the velocity's direction.", "Los estudiantes olvidan el 2, o toman una raíz cuadrada y pierden la dirección de la velocidad."],
  ["Without air resistance, every dropped object speeds up by 9.8 m/s each second, whatever it", "Sin resistencia del aire, todo objeto que cae aumenta su rapidez en 9,8 m/s cada segundo, sea cual sea"],
  ["Students think heavier objects fall faster.", "Los estudiantes creen que los objetos más pesados caen más rápido."],
  ["Going up, at the top and coming down, the acceleration is the same 9.8 m/s² downward.", "Subiendo, en lo alto y bajando, la aceleración es la misma: 9,8 m/s² hacia abajo."],
  ["Students think the acceleration is zero at the top, where the velocity is zero for an instant", "Los estudiantes creen que la aceleración es cero en lo alto, donde la velocidad es cero por un instante"],
  ["In", "En"], ["we used", "usamos"], ["you used", "usaste"], ["You can now read", "Ahora puedes leer"],
  ["Acceleration", "Aceleración"], ["Velocity", "Velocidad"], ["Position", "Posición"], ["Displacement", "Desplazamiento"],
  ["Average Velocity", "Velocidad media"], ["Free Fall", "Caída libre"], ["Thrown Straight Up", "Lanzado verticalmente hacia arriba"],
  ["Checking Equations with Units", "Comprobar ecuaciones con unidades"],
  ["Position and Displacement on an Axis", "Posición y desplazamiento en un eje"],
  ["Position-Time Graphs", "Gráficas posición-tiempo"], ["Instantaneous Velocity", "Velocidad instantánea"],
  ["Acceleration and Its Sign", "La aceleración y su signo"], ["Velocity-Time Graphs", "Gráficas velocidad-tiempo"],
  ["Translating Between Motion Graphs", "Traducir entre gráficas de movimiento"],
  ["The Constant-Acceleration Equations", "Las ecuaciones de aceleración constante"],
  ["Motion Without the Time", "Movimiento sin el tiempo"], ["Worked examples", "Ejemplos resueltos"],
  ["Displacement is final position minus initial position", "El desplazamiento es la posición final menos la inicial"],
  ["The slope of", "La pendiente de"], ["the velocity", "la velocidad"], ["the acceleration", "la aceleración"],
  ["the distance traveled", "la distancia recorrida"], ["time", "tiempo"], ["distance", "distancia"],
  ["velocity", "velocidad"], ["acceleration", "aceleración"], ["position", "posición"],
  ["graph", "gráfica"], ["slope", "pendiente"], ["area", "área"], ["sign", "signo"],
  ["units", "unidades"], ["units multiply, divide and cancel just like algebra", "las unidades se multiplican, dividen y se cancelan como el álgebra"],
  ["A right angle", "Un ángulo recto"], ["The hypotenuse", "La hipotenusa"], ["mass", "masa"], ["weight", "peso"],
  ["How high and how long", "A qué altura y cuánto tiempo"], ["to the top", "hasta lo alto"],
  ["Throw a ball straight up and it is in", "Lanza una pelota verticalmente hacia arriba y está en"],
  ["the moment it leaves your hand: on the way up, at the top and on the way down.", "desde el instante en que sale de tu mano: subiendo, en lo alto y bajando."],
  ["One acceleration", "Una aceleración"], ["covers the whole flight, so one set of equations does too.", "cubre todo el vuelo, así que también lo hace un solo conjunto de ecuaciones."],
  ["With up positive", "Tomando arriba como positivo"], ["for the entire flight", "durante todo el vuelo"],
  ["for an instant, but the acceleration is still", "por un instante, pero la aceleración sigue siendo"],
  ["downward.", "hacia abajo."], ["up and down", "arriba y abajo"], ["straight up", "verticalmente hacia arriba"],
  ["Gravity doesn't switch off at the top", "La gravedad no se apaga en lo alto"],
  ["At the top", "En lo alto"], ["the ball", "la pelota"], ["the cart", "el carro"],
];

// Function words (word-boundary matched, so they never break Spanish words).
const words = [
  ["the", "el"], ["a", "un"], ["an", "un"], ["is", "es"], ["are", "son"], ["was", "fue"], ["were", "fueron"],
  ["and", "y"], ["or", "o"], ["to", "a"], ["of", "de"], ["in", "en"], ["at", "en"], ["by", "por"], ["for", "para"],
  ["from", "desde"], ["with", "con"], ["as", "como"], ["on", "sobre"], ["it", "ello"], ["its", "su"],
  ["this", "este"], ["that", "que"], ["these", "estos"], ["those", "esos"], ["you", "tú"], ["your", "tu"],
  ["we", "nosotros"], ["our", "nuestro"], ["they", "ellos"], ["their", "su"], ["not", "no"], ["but", "pero"],
  ["if", "si"], ["then", "entonces"], ["so", "así"], ["when", "cuando"], ["where", "donde"], ["how", "cómo"],
  ["why", "por qué"], ["what", "qué"], ["which", "que"], ["can", "puede"], ["will", "va a"], ["would", "sería"],
  ["should", "debería"], ["has", "ha"], ["have", "han"], ["had", "había"], ["does", "hace"], ["do", "hacer"],
  ["be", "ser"], ["been", "sido"], ["up", "arriba"], ["down", "abajo"], ["over", "sobre"], ["under", "bajo"],
  ["same", "mismo"], ["one", "uno"], ["two", "dos"], ["each", "cada"], ["every", "cada"], ["all", "todo"],
  ["any", "cualquier"], ["only", "solo"], ["also", "también"], ["more", "más"], ["most", "la mayoría"],
  ["like", "como"], ["into", "hacia"], ["out", "fuera"], ["off", "apagado"], ["because", "porque"],
  ["while", "mientras"], ["than", "que"], ["too", "también"], ["just", "solo"], ["about", "sobre"],
  // Core physics vocabulary from the kinematics corpus
  ["speed", "rapidez"], ["speeds", "rapideces"], ["velocity", "velocidad"], ["velocities", "velocidades"],
  ["acceleration", "aceleración"], ["displacement", "desplazamiento"], ["distance", "distancia"],
  ["direction", "dirección"], ["average", "media"], ["find", "halla"], ["means", "significa"],
  ["negative", "negativa"], ["positive", "positiva"], ["check", "comprueba"], ["motion", "movimiento"],
  ["back", "atrás"], ["straight", "recto"], ["car", "coche"], ["axis", "eje"], ["equation", "ecuación"],
  ["equations", "ecuaciones"], ["flat", "plano"], ["going", "yendo"], ["object", "objeto"],
  ["cart", "carro"], ["gives", "da"], ["zero", "cero"], ["top", "alto"], ["changes", "cambios"],
  ["change", "cambio"], ["ball", "pelota"], ["second", "segundo"], ["downward", "hacia abajo"],
  ["above", "arriba"], ["slopes", "pendientes"], ["slope", "pendiente"], ["moving", "en movimiento"],
  ["take", "toma"], ["final", "final"], ["never", "nunca"], ["adding", "sumando"],
  ["stopping", "frenando"], ["constant", "constante"], ["below", "abajo"], ["far", "lejos"],
  ["right", "derecha"], ["always", "siempre"], ["total", "total"], ["start", "inicio"],
  ["starting", "inicial"], ["different", "diferente"], ["formula", "fórmula"], ["answer", "respuesta"],
  ["first", "primero"], ["dropped", "dejado caer"], ["rest", "reposo"], ["trip", "trayecto"],
  ["tangent", "tangente"], ["height", "altura"], ["step", "paso"], ["signs", "signos"], ["sign", "signo"],
  ["point", "punto"], ["way", "manera"], ["speeding", "acelerando"], ["slowing", "frenando"],
  ["left", "izquierda"], ["steady", "constante"], ["interval", "intervalo"], ["long", "largo"],
  ["rate", "tasa"], ["look", "mira"], ["must", "debe"], ["wrong", "incorrecto"], ["length", "longitud"],
  ["fall", "caída"], ["curve", "curva"], ["origin", "origen"], ["high", "alto"], ["starts", "comienza"],
  ["stops", "se detiene"], ["east", "este"], ["both", "ambos"], ["ramp", "rampa"], ["thinking", "pensando"],
  ["fast", "rápido"], ["uses", "usa"], ["times", "veces"], ["term", "término"], ["equal", "igual"],
  ["square", "cuadrado"], ["root", "raíz"], ["comes", "viene"], ["number", "número"], ["air", "aire"],
  ["small", "pequeño"], ["after", "después"], ["line", "recta"], ["units", "unidades"],
  ["moves", "se mueve"], ["move", "mover"], ["piece", "parte"], ["there", "allí"], ["rise", "subida"],
  ["stays", "permanece"], ["stay", "permanecer"], ["braking", "frenado"], ["brake", "frenar"],
  ["stop", "detenerse"], ["four", "cuatro"], ["area", "área"],
  ["changing", "cambiando"], ["really", "realmente"], ["hover", "flotar"],
  ["El Velocidad", "La velocidad"], ["Un Aceleración", "Una aceleración"],
  ["un Aceleración", "una aceleración"], ["a el", "al"],
  ["forever", "para siempre"], ["es cambiando", "está cambiando"],
  ["sería flotar", "flotaría"], ["un cambiando Velocidad", "una velocidad que cambia"],
];

// Longest phrases first so short generic words don't win inside them.
phrases.sort((a, b) => b[0].length - a[0].length);

function apply(text, from, to) {
  if (from.includes(" ")) return text.replaceAll(from, to);
  const re = new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  return text.replace(re, (m) => m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);
}

function translate(text) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(\$[^$]*\$|\\role(?:\[[^\]]*\])?\{[^}]*\}\{[^}]*\}|<[^>]+>)/g);
  return parts.map((p) => {
    if (!p || /^(\$|<|\\role)/.test(p)) return p;
    let out = p;
    for (const [en, es] of phrases) out = apply(out, en, es);
    for (const [en, es] of words) out = apply(out, en, es);
    return out;
  }).join("");
}

let n = 0;
for (const slug of slugs) {
  const keysPath = path.join(KEYS, `${slug}.json`);
  if (!fs.existsSync(keysPath)) continue;
  const items = JSON.parse(fs.readFileSync(keysPath, "utf8"));
  const overlay = {};
  for (const item of items) overlay[item.key] = translate(item.source);
  fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(overlay, null, 2));
  n++;
}
console.log(`Spanish overlay written for ${n} kinematics topics`);
