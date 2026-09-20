import { PIECES, pieceById } from '../core/pieces.ts';
import { PLACEMENT_COUNT } from '../core/solver.ts';
import { pathForShape, shapeExtent } from './layout.ts';

/**
 * The hand-solving guide under the board. The rules are the same ones the
 * solver uses — corner-first ordering, least-flexible pieces early, and the
 * region-size arithmetic — written out for a person moving real wood.
 */

const UNIT = 13;

function Thumb({ id }: { readonly id: (typeof PIECES)[number]['id'] }): preact.JSX.Element {
  const piece = pieceById(id);
  const { rows, cols } = shapeExtent(piece.shape);
  return (
    <svg
      class="howto-thumb"
      viewBox={`-1 -1 ${cols * UNIT + 2} ${rows * UNIT + 2}`}
      width={cols * UNIT + 2}
      height={rows * UNIT + 2}
      aria-hidden="true"
    >
      <path d={pathForShape(piece.shape, UNIT)} fill={piece.color} stroke={piece.edge} stroke-width={1.2} />
    </svg>
  );
}

export function HowToSolve(): preact.JSX.Element {
  return (
    <section class="howto" aria-labelledby="howto-title">
      <header class="howto-head">
        <h2 id="howto-title">Как сложить его руками</h2>
        <p>
          {`Положить одну фигуру на доску можно ${PLACEMENT_COUNT} способами — с учётом поворотов и переворотов. Перебирать их сочетания наугад бессмысленно, но правильный порядок ходов сводит задачу к нескольким минутам. Ниже тот же порядок, по которому идёт решатель.`}
        </p>
      </header>

      <ol class="howto-steps">
        <li>
          <span class="howto-num">1</span>
          <div>
            <h3>Закройте пальцем три клетки ответа</h3>
            <p>
              Месяц, число и день недели должны остаться открытыми. Всё остальное —
              47 клеток, и фигуры занимают ровно 47. Значит, свободного места нет
              совсем: любая ошибка вылезет дыркой в конце.
            </p>
          </div>
        </li>

        <li>
          <span class="howto-num">2</span>
          <div>
            <h3>Начинайте с углов и вырезов, а не с середины</h3>
            <p>
              Угол принимает куда меньше фигур, чем центр, поэтому там выбор почти
              очевиден. Самые тесные места — левый верхний угол, ступенька под
              накладкой с шаром справа и уголок у «ПТ СБ ВС» внизу. Заполните их
              первыми, пока есть из чего выбирать.
            </p>
          </div>
        </li>

        <li>
          <span class="howto-num">3</span>
          <div>
            <h3>Неудобные фигуры — в начало, покладистые — в конец</h3>
            <p>
              Ставьте сначала те, что почти не гнутся, а самые сговорчивые держите
              в резерве: в конце останутся случайные по форме дырки, и закрыть их
              сможет только гибкая фигура.
            </p>
            <ul class="howto-pieces">
              <li>
                <Thumb id="i-tet" />
                <div>
                  <strong>Брус</strong>
                  <span>требует четыре клетки подряд — таких мест мало</span>
                </div>
              </li>
              <li>
                <Thumb id="u-pent" />
                <div>
                  <strong>Скоба</strong>
                  <span>её вырез обязан попасть на чужую фигуру или на клетку ответа</span>
                </div>
              </li>
              <li>
                <Thumb id="t-pent" />
                <div>
                  <strong>Молот</strong>
                  <span>ножка торчит и оставляет по бокам щели в одну клетку</span>
                </div>
              </li>
              <li>
                <Thumb id="p-pent" />
                <div>
                  <strong>Плита</strong>
                  <span>почти прямоугольник — влезает куда угодно, оставьте напоследок</span>
                </div>
              </li>
            </ul>
          </div>
        </li>

        <li>
          <span class="howto-num">4</span>
          <div>
            <h3>Всегда закрывайте самую верхнюю левую пустую клетку</h3>
            <p>
              Не прыгайте по доске. Возьмите самую верхнюю (а среди равных — самую
              левую) свободную клетку и решайте только одно: какая фигура накроет
              именно её. Вариантов обычно два-три. Так позади вас не остаётся
              забытых хвостов, а каждый ход — маленький и проверяемый.
            </p>
          </div>
        </li>

        <li>
          <span class="howto-num">5</span>
          <div>
            <h3>Считайте дырки: 1, 2, 3, 6, 7 и 11 — это тупик</h3>
            <p>
              Главное правило, экономящее больше всего времени. В наборе только
              фигуры по 4 и 5 клеток, поэтому любой замкнутый кусок пустоты должен
              собираться из четвёрок и пятёрок: 4, 5, 8, 9, 10, 12, 13 и так далее.
            </p>
            <p class="howto-sizes" aria-label="Возможные и невозможные размеры пустой области">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((size) => (
                <span key={size} class={REACHABLE_SIZES.has(size) ? 'ok' : 'dead'}>
                  {size}
                </span>
              ))}
            </p>
            <p>
              Отрезали от доски уголок в три клетки — снимайте последнюю фигуру, не
              доигрывая. Проверять это нужно после каждого хода: взгляд на пустоту
              занимает секунду и отменяет десятки бесполезных попыток.
            </p>
          </div>
        </li>

        <li>
          <span class="howto-num">6</span>
          <div>
            <h3>Застряли — снимайте одну фигуру, не всю доску</h3>
            <p>
              Разбирать всё заново почти никогда не нужно. Снимите последнюю
              поставленную фигуру и попробуйте для той же клетки другой вариант;
              если они кончились — снимите предыдущую. Это и есть перебор с
              возвратом, и вручную он сходится быстро, потому что шаги мелкие.
            </p>
          </div>
        </li>
      </ol>

      <p class="howto-close">
        Решение есть всегда: все 2562 сочетания месяца, числа и дня недели просчитаны,
        вместе они дают 4 864 096 раскладок. Но разброс огромный — у 7 июня в среду их
        10 374, а у 6 апреля во вторник всего 97. В «скупой» день наугад можно тыкаться
        очень долго, и порядок ходов решает всё. Если не сходится — дело не в дате,
        а в одной неудачно положенной фигуре.
      </p>
    </section>
  );
}

/** Areas that 4- and 5-cell pieces can tile between them. */
const REACHABLE_SIZES: ReadonlySet<number> = new Set([4, 5, 8, 9, 10, 12, 13]);
