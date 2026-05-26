export function html(strings, ...values) {
  //TODO: add string sanitizing
  const rawTemplate = strings
    .reduce(
      (acc, curr, i) => acc.concat(curr, i < values.length ? values[i] : ""),
      "",
    )
    .trim();

  const templateElement = document.createElement("template");
  templateElement.innerHTML = rawTemplate;
  console.log("firstchild", templateElement.content.firstChild);
  return templateElement.content.firstChild;
}
