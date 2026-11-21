import { DATASETS } from "../state/datasets";
import { t, useT } from "../i18n";
import { navigateTo } from "../utils/route";
import { ListRow } from "../components/ui";

// Library index (plan §4.2): the collections as quiet list rows, not tiles
// competing with the subjects on home.
export default function LibraryIndex() {
  useT();
  return (
    <div className="screen screen-narrow">
      <p className="eyebrow">{t("home.explore")}</p>
      <h1>{t("library.title")}</h1>
      <p className="screen-lead">{t("library.body")}</p>
      <ul className="list-rows index-list">
        {DATASETS.map(([key, label]) => (
          <ListRow key={key} title={label} onClick={() => navigateTo({ data: key })} />
        ))}
      </ul>
    </div>
  );
}